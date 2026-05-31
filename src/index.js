const express = require("express");
const app = express();

const pinoHttp = require("pino-http");
const logger = require("./lib/logger");

app.use(pinoHttp({
  logger,
  autoLogging: { ignore: (req) => req.url.startsWith("/uploads") },
}));

const questionsRouter = require("./routes/questions");
const prisma = require("./lib/prisma");
const authRouter = require("./routes/auth");
const path = require('path');
const errorHandler = require("./middleware/errorHandler");

app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/questions", questionsRouter);
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use((req, res) => {
    res.json({ msg: "Not found" });
});

app.listen(3000, () => {
    const logger = require("./lib/logger");
    logger.info({ port: 3000 }, "server listening");
});

// Graceful shutdown
process.on("SIGINT", async () => {
    await prisma.$disconnect();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    await prisma.$disconnect();
    process.exit(0);
});

app.use(errorHandler);
