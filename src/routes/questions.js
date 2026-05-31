const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const authenticate = require("../middleware/auth");
const isOwner = require("../middleware/isOwner");
const path = require("path")
const multer = require("multer");
const { NotFoundError, ValidationError } = require("../lib/errors");
const { z } = require("zod");

// Apply authentication to ALL routes in this router
router.use(authenticate);

function formatQuestion(question) {
    return {
        ...question,
        keywords: question.keywords.map((k) => k.name),
        userName: question.user?.name || null,
        playCount: question._count?.plays ?? 0,
        played: question.plays ? question.plays.length > 0 : false,
        user: undefined,
        plays: undefined,
        _count: undefined,
        solved: undefined,
    };
}

function filterById(jsonObject, id) {
    return jsonObject.filter(function (jsonObject) {
        return (jsonObject['id'] == id);
    })[0];
}

// ZOD



const QuestionInput = z.object({
    question: z.string().min(1),
    choice_1: z.string().min(1),
    choice_2: z.string().min(1),
    choice_3: z.string().min(1),
    choice_4: z.string().min(1),
    keywords: z.union([z.string(), z.array(z.string())]).optional(),
});

// END ZOD

// MULTER

const storage = multer.diskStorage({
    destination: path.join(__dirname, "..", "..", "public", "uploads"),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// This is probably not needed?
// router.use((err, req, res, next) => {
//     if (err instanceof multer.MulterError ||
//         err?.message === "Only image files are allowed") {
//         return res.status(400).json({ msg: err.message });
//     }
//     next(err); // pass through to global handler
// });

fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new ValidationError("Only image files are allowed"));
},

// END MULTER

// GET /questions
// List all questions
router.get("/", async (req, res) => {
    
    const { keyword } = req.query;

    const where = keyword
        ? { keywords: { some: { name: keyword } } }
        : {};

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;
    
    const [filteredQuestions, total] = await Promise.all([
        prisma.question.findMany({
            where, 
            include: {
                keywords: true,
                user: true,
                plays: { where: {userId: req.user.userId}, take: 1 },
                _count: { select: { plays: true } },
            },
            orderBy: { id: "asc" },
            skip,
            take: limit,
        }),
        prisma.question.count({ where }),
    ]);

    const questions_solved = await prisma.play.findMany({
        where: {
            correct: true,
            userId: req.user.userId,
        },
        select: { questionId: true },
    });

    let data = filteredQuestions.map(formatQuestion);
    
    for (const key in questions_solved) {
        const q_id = questions_solved[key].questionId;
        let q = filterById(data, q_id)
        if (q)
            q.solved = true;
    }
    
    res.json({
        data,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    });
});


// GET /questions/:questionId
// Show a specific question
router.get("/:questionId", async (req, res) => {
    const questionId = Number(req.params.questionId);
    const question = await prisma.question.findUnique({
        where: { id: questionId },
        include: {
            keywords: true,
            user: true,
            plays: { where: { userId: req.user.userId }, take: 1 },
            _count: { select: { plays: true } },
        },
    });

    if (!question) {
        throw new NotFoundError("Question not found")
    }

    res.json(formatQuestion(question));
});

// END GET

// POST /questions
// Create a new question
router.post("/", upload.single("image"), async (req, res) => {
    // Slides used a single variable for zod data, but this seems to work too
    const { question, choice_1, choice_2, choice_3, choice_4, keywords} = QuestionInput.parse(req.body);
    
    const solution = parseInt(req.body.solution) // Solution must be integer
    
    if (!question || !choice_1 || !choice_2 || !choice_3 || !choice_4 || !solution) {
        throw new ValidationError("A question, 4 choices and a solution are required.");
    }

    const keywordsArray = Array.isArray(keywords) ? keywords : [];

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    const newQuestion = await prisma.question.create({
        data: {
            question, choice_1, choice_2, choice_3, choice_4, solution,
            userId: req.user.userId,
            keywords: {
                connectOrCreate: keywordsArray.map((kw) => ({
                    where: { name: kw }, create: { name: kw },
                })),
            },
            imageUrl
        },
        include: { keywords: true },
    });
    
    res.status(201).json(formatQuestion(newQuestion))
});

// Play a question
router.post("/:questionId/play", async (req, res) => {
    const questionId = Number(req.params.questionId);

    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) {
        throw new NotFoundError("Question not found");
    }

    const answer = parseInt(req.body.answer);
    const correct = (answer == question.solution) ? true : false; // Better to use strict comparison? (===)
    const play = await prisma.play.upsert({
        where: { userId_questionId: { userId: req.user.userId, questionId } },
        update: {
            // Remove these if you want questions to have single
            // attempt
            answer: answer,
            correct: correct,
            attempts: {increment: 1},
        },
        create: {
            userId: req.user.userId,
            questionId,
            answer: answer,
            correct: correct,
            attempts: 1,
        },
    });

    const playCount = await prisma.play.count({ where: { questionId } });
    
    res.status(201).json({
        id: play.id,
        questionId,
        played: true,
        answer,
        correct,
        playCount,
        solution: question.solution,
        createdAt: play.createdAt,
        attempts: play.attempts,
    });
});

// END POST

// PUT /questions/questionId
// Replace a question
router.put("/:questionId", upload.single("image"), isOwner, async (req, res) => {
    const questionId = Number(req.params.questionId);
    
    const { question, choice_1, choice_2, choice_3, choice_4, keywords } = req.body;
    const solution = parseInt(req.body.solution) // Solution must be integer
    
    const existingQuestion = await prisma.question.findUnique({ where: { id: questionId } });
    if (!existingQuestion) {
        throw new NotFoundError("Question not found");
    }

    if (!question || !choice_1 || !choice_2 || !choice_3 || !choice_4 || !solution) {
        throw new ValidationError("Question, 4 answers and a solution are mandatory!");
    }

    const keywordsArray = Array.isArray(keywords) ? keywords : [];
    const updatedQuestion = await prisma.question.update({
        where: { id: questionId },
        data: {
            question, choice_1, choice_2, choice_3, choice_4, solution,
            keywords: {
                set: [],
                connectOrCreate: keywordsArray.map((kw) => ({
                    where: { name: kw },
                    create: { name: kw },
                })),
            },
        },
        include: { keywords: true },
    });
    res.json(formatQuestion(updatedQuestion));
    
    if (req.file) data.imageUrl = `/uploads/${req.file.filename}`;
});

// DELETE /questions/:questionId
// Delete a question
router.delete("/:questionId", isOwner, async (req, res) => {
    const questionId = Number(req.params.questionId);

    const question = await prisma.question.findUnique({
        where: { id: questionId },
        include: { keywords: true },
    });

    if (!question) {
        throw new NotFoundError("Question not found");
    }

    await prisma.question.delete({ where: { id: questionId } })
    
    res.json({
        message: "Question deleted successfully",
        question: formatQuestion(question),
    });
});

// END DELETE

module.exports = router;
