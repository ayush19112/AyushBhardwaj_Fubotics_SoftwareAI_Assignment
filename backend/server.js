// server.js (ESM) — Groq backend integration
import dotenv from 'dotenv';
dotenv.config();
console.log("Groq key loaded:", !!process.env.GROQ_API_KEY);


import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { nanoid } from 'nanoid';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// lowdb setup (ensure default data present)
const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const defaultData = { messages: [] };
const db = new Low(adapter, defaultData);

async function initDB() {
  try {
    await db.read();
    if (!db.data) {
      db.data = defaultData;
      await db.write();
    } else if (!Array.isArray(db.data.messages)) {
      db.data.messages = [];
      await db.write();
    }
  } catch (err) {
    console.error('Failed to initialize DB:', err);
    try {
      await fs.promises.writeFile(file, JSON.stringify(defaultData, null, 2), 'utf8');
      await db.read();
    } catch (err2) {
      console.error('Failed to create db file:', err2);
      throw err2;
    }
  }
}
await initDB();

async function saveMessage(role, text) {
  const msg = { id: nanoid(), role, text, createdAt: new Date().toISOString() };
  db.data.messages.push(msg);
  await db.write();
  return msg;
}

// Groq AI reply function
async function getAiReply(userText) {
  const key = process.env.GROQ_API_KEY;
  const url = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
  const model = process.env.GROQ_MODEL || 'llama3-8b-8192';

  if (!key) {
    // graceful fallback so you can test without a key
    return `Echo (no GROQ key): ${userText}`;
  }

  try {
    const payload = {
      model: model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: userText }
      ],
      max_tokens: 512,
      temperature: 0.7
    };

    const resp = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    // Groq uses OpenAI-compatible response shape (choices[0].message.content)
    const aiText = resp.data?.choices?.[0]?.message?.content;
    if (aiText && typeof aiText === 'string') return aiText;
    // if different shape, try some fallbacks
    if (resp.data?.choices?.[0]?.text) return resp.data.choices[0].text;
    // Last resort: stringify the response summary
    return JSON.stringify(resp.data).slice(0, 1000);
  } catch (err) {
    console.error('Groq API error:', err?.response?.data || err.message || err);
    return 'Error from Groq provider — see server logs.';
  }
}

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/history', async (req, res) => {
  await db.read();
  res.json(db.data.messages || []);
});

app.post('/message', async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text is required' });
  }

  const userMsg = await saveMessage('user', text);
  const aiText = await getAiReply(text);
  const aiMsg = await saveMessage('ai', aiText);
  await db.read();
  res.json({ aiMessage: aiMsg, history: db.data.messages });
});

// Serve frontend build if exists
const frontBuild = path.join(__dirname, '../frontend/build');
if (fs.existsSync(frontBuild)) {
  app.use(express.static(frontBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontBuild, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
