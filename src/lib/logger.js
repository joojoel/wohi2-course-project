const pino = require("pino");

module.exports = pino({
  level: process.env.LOG_LEVEL || "debug",
  redact: {
    paths: ["req.headers.authorization", "req.body.password", "*.password"],
    censor: "[REDACTED]",
  },
  transport: process.env.NODE_ENV !== "production"
    ? { target: "pino-pretty" }
    : undefined,
});
