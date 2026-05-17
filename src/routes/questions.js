const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const authenticate = require("../middleware/auth");
const isOwner = require("../middleware/isOwner");
const path = require("path")

// Apply authentication to ALL routes in this router
router.use(authenticate);

function formatQuestion(question) {
    return {
        ...question,
        keywords: question.keywords.map((k) => k.name),
        userName: question.user?.name || null,
        likeCount: question._count?.likes ?? 0,
        liked: question.likes ? question.likes.length > 0 : false,
        user: undefined,
        likes: undefined,
        _count: undefined,
    };
}

// MULTER

const multer = require("multer");

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

function parseKeywords(keywords) {
  if (Array.isArray(keywords)) return keywords;
  if (typeof keywords === "string") {
    return keywords.split(",").map((k) => k.trim()).filter(Boolean);
  }
  return [];
}

router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError ||
        err?.message === "Only image files are allowed") {
        return res.status(400).json({ msg: err.message });
    }
    next(err);
});

// END MULTER

// GET /questions
// List all questions
router.get("/", async (req, res) => {
    
    const { keyword } = req.query;

    const where = keyword
        ? { keywords: { some: { name: keyword } } }
        : {};

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 5));
    const skip = (page - 1) * limit;

    const [filteredQuestions, total] = await Promise.all([
        prisma.question.findMany({
            where,
            include: {
                keywords: true,
                user: true,
                likes: { where: {userId: req.user.userId}, take: 1 },
                _count: { select: { likes: true } },
            },
            orderBy: { id: "asc" },
            skip,
            take: limit,
        }),
        prisma.question.count({ where }),
    ]);

    res.json({
        data: filteredQuestions.map(formatQuestion),
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
            likes: { where: { userId: req.user.userId }, take: 1 },
            _count: { select: { likes: true } },
        },
    });

    if (!question) {
        return res.status(404).json({ message: "Question not found" });
    }

    res.json(formatQuestion(question));
});

// END GET

// POST /questions
// Create a new question
router.post("/", upload.single("image"), async (req, res) => {
    const { question, choice_1, choice_2, choice_3, choice_4, solution, keywords } = req.body;

    if (!question || !choice_1 || !choice_2 || !choice_3 || !choice_4 || !solution) {
        return res.status(400).json({
            msg: "A question, 4 choices and a solution are required."
        });
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

// Like a question
router.post("/:questionId/like", async (req, res) => {
    const questionId = Number(req.params.questionId);

    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) {
        return res.status(404).json({ message: "Question not found" });
    }

    const like = await prisma.like.upsert({
        where: { userId_questionId: { userId: req.user.userId, questionId } },
        update: {},
        create: { userId: req.user.userId, questionId },
    });

    const likeCount = await prisma.like.count({ where: { questionId } });

    res.status(201).json({
        id: like.id,
        questionId,
        liked: true,
        likeCount,
        createdAt: like.createdAt,
    });
});

// END POST

// PUT /questions/questionId
// Replace a question
router.put("/:questionId", upload.single("image"), isOwner, async (req, res) => {
    const questionId = Number(req.params.questionId);
    const { question, choice_1, choice_2, choice_3, choice_4, solution, keywords } = req.body;
    const existingQuestion = await prisma.question.findUnique({ where: { id: questionId } });
    if (!existingQuestion) {
        return res.status(404).json({ message: "Question not found" });
    }

    if (!question || !choice_1 || !choice_2 || !choice_3 || !choice_4 || !solution) {
        return res.status(400).json({ msg: "Question, 4 answers and a solution are mandatory!" });
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
        return res.status(404).json({ message: "Question not found" });
    }

    await prisma.question.delete({ where: { id: questionId } })

    res.json({
        message: "Question deleted successfully",
        question: formatQuestion(question),
    });
});

// Dislike a question
router.delete("/:questionId/like", async (req, res) => {
    const questionId = Number(req.params.questionId);

    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) {
        return res.status(404).json({ message: "Question not found" });
    }

    await prisma.like.deleteMany({
        where: { userId: req.user.userId, questionId },
    });

    const likeCount = await prisma.like.count({ where: { questionId } });

    res.json({ questionId, liked: false, likeCount });
});

// END DELETE

// router.post("/", upload.single("image"), async (req, res) => {
//   const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
//   await prisma.post.create({ data: { ..., imageUrl } });
// });

// router.put("/:postId", upload.single("image"), isOwner, async (req, res) => {
//   const data = { ... };
  
//   await prisma.post.update({ where: { id }, data });
// });
// if (req.file) data.imageUrl = `/uploads/${req.file.filename}`;

module.exports = router;
