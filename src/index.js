const express = require("express");
const app = express();

const questionsRouter = require("./routes/questions");

app.use(express.json());
app.use("/api/questions", questionsRouter);

app.use((req, res) => {
	res.json({ msg: "Not found" });
});

app.listen(3000, () => {
	console.log("Server running on port 3000");
});
