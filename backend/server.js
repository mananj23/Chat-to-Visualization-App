import express from "express";
import cors from "cors";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { fileURLToPath } from "url";
import { dirname, join } from "path";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ----- DB Setup -----
const file = join(__dirname, "db.json");
const adapter = new JSONFile(file);
const db = new Low(adapter, { questions: [], answers: [] });

await db.read();

// ----- Express Setup -----
const app = express();
app.use(cors());
app.use(express.json());

// ---- API Endpoints ----

// 1. Ask Question
app.post("/api/questions", async (req, res) => {
  const { userId, question } = req.body;
  const questionId = "q_" + Date.now();
  const answerId = "a_" + Date.now();

  // Dummy LLM response (replace with real LLM later)
  const dummyAnswer = {
    id: answerId,
    text: `This is a placeholder explanation for: ${question}`,
    visualization: {
      id: "vis_" + Date.now(),
      duration: 4000,
      fps: 30,
      layers: [
        {
          id: "circle1",
          type: "circle",
          props: { x: 100, y: 200, r: 20, fill: "#3498db" },
          animations: [
            { property: "x", from: 100, to: 400, start: 0, end: 3000 }
          ]
        }
      ]
    }
  };

  db.data.questions.push({ id: questionId, userId, question, answerId });
  db.data.answers.push(dummyAnswer);
  await db.write();

  res.json({ questionId, answerId });
});

// 2. Get all questions
app.get("/api/questions", async (req, res) => {
  await db.read();
  res.json(db.data.questions);
});

// 3. Get one answer
app.get("/api/answers/:id", async (req, res) => {
  await db.read();
  const answer = db.data.answers.find((a) => a.id === req.params.id);
  res.json(answer || {});
});

// 4. Stream (SSE)
app.get("/api/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(`event: connected\ndata: "SSE connected"\n\n`);

  // TODO: Hook into question/answer creation events later
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

