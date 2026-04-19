const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const seedQuestions = [
	{
		id: 1,
		question: "Which planet is known as the Red Planet?",
		choice_1: "Venus",
		choice_2: "Mars",
		choice_3: "Jupiter",
		choice_4: "Saturn",
		solution: 2,
		keywords: ["space", "astronomy", "science"],
	},
	{
		id: 2,
		question: "Who wrote the play Romeo and Juliet?",
		choice_1: "Charles Dickens",
		choice_2: "Jane Austen",
		choice_3: "William Shakespeare",
		choice_4: "Mark Twain",
		solution: 3,
		keywords: ["literature", "art"],
	},
	{
		id: 3,
		question: "What is the largest ocean on Earth?",
		choice_1: "Atlantic Ocean",
		choice_2: "Indian Ocean",
		choice_3: "Arctic Ocean",
		choice_4: "Pacific Ocean",
		solution: 4,
		keywords: ["geography"],
	},
	{
		id: 4,
		question: "Which element has the chemical symbol O?",
		choice_1: "Gold",
		choice_2: "Oxygen",
		choice_3: "Silver",
		choice_4: "Hydrogen",
		solution: 2,
		keywords: ["chemistry", "science"],
	}
];

async function main() {
	await prisma.question.deleteMany();
	await prisma.keyword.deleteMany();
	
	for (const question of seedQuestions) {
		await prisma.question.create({
			data: {
				question: question.question,
				choice_1: question.choice_1,
				choice_2: question.choice_2,
				choice_3: question.choice_3,
				choice_4: question.choice_4,
				solution: question.solution,
				keywords: {
					connectOrCreate: question.keywords.map((kw) => ({
						where: { name: kw },
						create: { name: kw },
					})),
				},
			},
		});
	}

	console.log("Seed data inserted successfully");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
