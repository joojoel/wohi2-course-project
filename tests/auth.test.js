const bcrypt = require("bcrypt")
const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");

const { resetDb, registerAndLogin, createQuestion } = require("./helpers");

beforeEach(resetDb);

it("registers, hashes the password, returns a token", async () => {
    const res = await request(app).post("/api/auth/register")
        .send({ email: "a@test.io", password: "pw12345", name: "A" });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));

    const user = await prisma.user.findUnique({ where: { email: "a@test.io" } });
    expect(user.password).not.toBe("pw12345");                          // not plain
    expect(await bcrypt.compare("pw12345", user.password)).toBe(true);  // valid hash
});

it("returns 403 when editing someone else's question", async () => {
    const aliceToken = await registerAndLogin("alice@test.io", "Alice");
    const question = await createQuestion(aliceToken, { question: "Alice's question" });
    const bobToken = await registerAndLogin("bob@test.io", "Bob");
    const res = await request(app).put(`/api/questions/${question.id}`)
        .set("Authorization", `Bearer ${bobToken}`)
        .send({
            question: "hijacked",
            choice_1: "hijacked",
            choice_2: "hijacked",
            choice_3: "hijacked",
            choice_4: "hijacked",
            solution: "2",
            keywords: ["hijacked", "hijacked"],
        });

    expect(res.status).toBe(403);

    const after = await prisma.question.findUnique({ where: { id: question.id } });
    expect(after.question).toBe("Alice's question");  // unchanged
});
