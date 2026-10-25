import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(cors());
app.use(express.json({ limit: '7mb' }));
app.disable('x-powered-by');

const port = process.env.PORT || 3000;
const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

app.get('/', (_req, res) => res.json({ app: 'Solusi AI', status: 'online', provider: 'Google Gemini' }));

app.post('/api/chat', async (req, res) => {
  try {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!message && !req.body?.imageBase64) {
      return res.status(400).json({ error: 'Field message wajib diisi' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY belum ada' });
    }
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const parts = [];
    if (message) parts.push({ text: message.slice(0, 30000) });
    if (req.body?.imageBase64) {
      parts.push({ inlineData: { mimeType: String(req.body.mimeType || 'image/jpeg'), data: String(req.body.imageBase64) } });
    }
    const result = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts }],
      config: { systemInstruction: 'Anda adalah Solusi AI, asisten bahasa Indonesia.' },
    });
    const reply = result.text || '';
    if (!reply.trim()) return res.status(502).json({ error: 'Model tidak mengembalikan teks' });
    return res.json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(502).json({ error: 'Layanan AI gagal: ' + (err?.message || 'unknown') });
  }
});

// Penting buat Vercel
export default app;
