// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Low, JSONFile } = require('lowdb');
const { nanoid } = require('nanoid');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'db.json');

const adapter = new JSONFile(DB_PATH);
const db = new Low(adapter);

async function initDb(){
  await db.read();
  db.data = db.data || { questions: [], answers: [] };
  await db.write();
}
initDb();

const app = express();
app.use(cors());
app.use(express.json());

let sseClients = [];
function sendEvent(res, type, payload){
  try {
    res.write(`event: ${type}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  } catch(e){}
}
function broadcast(type, payload){
  sseClients.forEach(res => sendEvent(res, type, payload));
}

function extractJSON(text){
  if(!text || typeof text !== 'string') return null;
  const m = text.match(/\{[\s\S]*\}/);
  if(!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch (e) {
    return null;
  }
}

async function callLLMGenerate(question){
  // If no API key provided, return a deterministic fallback so you can test immediately.
  if(!process.env.OPENAI_API_KEY){
    console.warn('No OPENAI_API_KEY detected — using fallback generator for visualization (no external LLM).');
    // simple rules for three demo questions
    const q = question.toLowerCase();
    if(q.includes('newton')) {
      return {
        text: "Newton's First Law: An object stays at rest or constant velocity unless acted on by an external force.",
        visualization: {
          id: 'vis_newton_fallback',
          duration: 4000,
          fps: 30,
          layers: [
            { id: 'ball', type: 'circle', props: { x: 100, y: 150, r: 16, fill: '#3498db' }, animations: [{ property: 'x', from: 100, to: 420, start: 0, end: 3000 }] },
            { id: 'arrow', type: 'arrow', props: { x: 90, y: 150, dx: 30, dy: 0 }, animations: [] }
          ]
        }
      };
    } else if(q.includes('solar')) {
      return {
        text: "The Solar System: the Sun in the center with planets orbiting due to gravity.",
        visualization: {
          id: 'vis_solar_fallback',
          duration: 6000,
          fps: 30,
          layers: [
            { id: 'sun', type: 'circle', props: { x: 300, y: 200, r: 30, fill: '#f39c12' }, animations: [] },
            { id: 'earth', type: 'circle', props: { x: 200, y: 200, r: 10, fill: '#3498db' }, animations: [{ property: 'orbit', centerX: 300, centerY: 200, radius: 100, duration: 6000 }] }
          ]
        }
      };
    } else if(q.includes('photo')) {
      return {
        text: "Photosynthesis: plants convert CO2 and water into glucose using sunlight.",
        visualization: {
          id: 'vis_photo_fallback',
          duration: 5000,
          fps: 30,
          layers: [
            { id: 'sun', type: 'circle', props: { x: 80, y: 80, r: 18, fill: '#f1c40f' }, animations: [] },
            { id: 'leaf', type: 'rect', props: { x: 300, y: 200, w: 140, h: 80, fill: '#2ecc71' }, animations: [] },
            { id: 'ray', type: 'arrow', props: { x: 95, y: 95, dx: 160, dy: 110 }, animations: [] }
          ]
        }
      };
    }
    // generic fallback
    return {
      text: "Short explanation (fallback): " + question,
      visualization: {
        id: 'vis_generic',
        duration: 4000,
        fps: 30,
        layers: [
          { id: 'dot', type: 'circle', props: { x: 150, y: 150, r: 12, fill: '#9b59b6' }, animations: [] }
        ]
      }
    };
  }

  // Real LLM call (OpenAI chat completion)
  const url = 'https://api.openai.com/v1/chat/completions';
  const promptSystem = `You MUST return exactly one JSON object, nothing else. Format:
{ "text": "<explanation string>", "visualization": { "id": "<id>", "duration": <ms>, "fps": <int>, "layers": [ { "id":"", "type": "circle|rect|arrow", "props": {...}, "animations": [ { "property":"x|y|orbit", ... } ] } ] } }`;
  const payload = {
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: promptSystem },
      { role: 'user', content: `Question: ${question} \nReturn a JSON exactly as described.` }
    ],
    temperature: 0.1,
    max_tokens: 800
  };
  const headers = { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' };
  const resp = await axios.post(url, payload, { headers });
  const content = resp?.data?.choices?.[0]?.message?.content;
  const parsed = extractJSON(content);
  if(!parsed) throw new Error('LLM returned unparsable JSON: ' + (content ? content.slice(0,400) : 'no content'));
  if(!parsed.text || !parsed.visualization) throw new Error('LLM JSON missing keys');
  return parsed;
}

/* POST /api/questions */
app.post('/api/questions', async (req, res) => {
  const { userId, question } = req.body || {};
  if(!question) return res.status(400).json({ error: 'question required' });

  const qId = 'q_' + nanoid(8);
  await db.read();
  db.data.questions.push({ id: qId, userId: userId || 'anon', question, createdAt: Date.now() });
  await db.write();

  broadcast('question_created', { id: qId, userId: userId || 'anon', question });

  // generate answer synchronously (so front-end receives it via SSE)
  try {
    const llm = await callLLMGenerate(question);
    const aId = 'a_' + nanoid(8);
    const answer = { id: aId, questionId: qId, text: llm.text, visualization: llm.visualization, createdAt: Date.now() };
    await db.read();
    db.data.answers.push(answer);
    await db.write();

    broadcast('answer_created', answer);
    return res.json({ questionId: qId, answerId: aId });
  } catch (err) {
    console.error('LLM error:', err.message);
    return res.status(500).json({ error: 'LLM failed: ' + err.message });
  }
});

/* GET /api/questions */
app.get('/api/questions', async (req, res) => {
  await db.read();
  const out = db.data.questions.map(q => {
    const a = db.data.answers.find(x => x.questionId === q.id);
    return { ...q, answer: a || null };
  });
  res.json(out);
});

/* GET /api/answers/:id */
app.get('/api/answers/:id', async (req, res) => {
  await db.read();
  const a = db.data.answers.find(x => x.id === req.params.id);
  if(!a) return res.status(404).json({ error: 'not found' });
  res.json(a);
});

/* SSE stream */
app.get('/api/stream', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.flushHeaders();
  res.write('retry: 10000\n\n');

  sseClients.push(res);
  req.on('close', () => {
    sseClients = sseClients.filter(r => r !== res);
  });
});

/* simple health */
app.get('/', (req, res) => res.send('AIPrep backend up.'));

app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
