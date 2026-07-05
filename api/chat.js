const TOKENLB_KEY = 'sk-mOpKxPG24lnBWjrJ2IEw5vfisXSuEqD2EStVYLhznjRTWME4';
const BLUESMINDS_KEY = 'sk-KmTYfHsUASkvQSHDx1WIZfQZyWfvALCijVk2Q65puUGqVO4P';
const TOKENLB_URL = 'https://tokenlb.net/v1/chat/completions';
const BLUESMINDS_URL = 'https://api.bluesminds.com/v1/chat/completions';
const DB_API = 'https://ai-chatbot-api.satyanagesh-r.workers.dev';

const MODEL_ROUTES = {
  'claude-opus-4-8': TOKENLB_URL, 'claude-opus-4-7': TOKENLB_URL,
  'claude-opus-4-6': TOKENLB_URL, 'claude-sonnet-4-6': TOKENLB_URL,
  'claude-sonnet-4-5-20250929': TOKENLB_URL, 'claude-haiku-4-5-20251001': TOKENLB_URL,
  'gpt-5.5': TOKENLB_URL, 'gpt-5.4': TOKENLB_URL, 'gpt-5.4-mini': TOKENLB_URL,
  'gemini-3.1-pro-preview': BLUESMINDS_URL, 'blackbox': BLUESMINDS_URL,
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).end(); return; }

  try {
    const { messages, model } = req.body;
    if (!model) { res.status(400).json({ error: 'model required' }); return; }

    // Fetch shared memories and inject as context
    let memoryContext = '';
    try {
      const memRes = await fetch(`${DB_API}/memory`);
      if (memRes.ok) {
        const memories = await memRes.json();
        if (Array.isArray(memories) && memories.length > 0) {
          memoryContext = '\n\nShared Memory (facts remembered across all conversations):\n' +
            memories.map(m => `- ${m.key}: ${m.value}`).join('\n');
        }
      }
    } catch {}

    const apiUrl = MODEL_ROUTES[model] || TOKENLB_URL;
    const apiKey = apiUrl === BLUESMINDS_URL ? BLUESMINDS_KEY : TOKENLB_KEY;

    const fullMessages = [
      { role: 'system', content: `You are ${model}. Reply helpfully and concisely.${memoryContext}` },
      ...(messages || []),
    ];

    const apiRes = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: fullMessages, stream: true }),
    });

    if (!apiRes.ok) {
      const err = await apiRes.json().catch(() => ({}));
      res.status(apiRes.status).json({ error: err.error?.message || `HTTP ${apiRes.status}` });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    const reader = apiRes.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }
    res.end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
