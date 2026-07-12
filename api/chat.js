const OPENROUTER_KEY = process.env.OPENROUTER_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DB_API = 'https://ai-chatbot-api.satyanagesh-r.workers.dev';

const MODEL_MAP = {
  'claude-opus-4-8': 'anthropic/claude-opus-4-8',
  'claude-opus-4-7': 'anthropic/claude-opus-4-7',
  'claude-opus-4-6': 'anthropic/claude-opus-4-6',
  'claude-sonnet-4-6': 'anthropic/claude-sonnet-4-6',
  'claude-sonnet-4-5-20250929': 'anthropic/claude-sonnet-4-5-20250929',
  'claude-haiku-4-5-20251001': 'anthropic/claude-haiku-4-5-20251001',
  'gpt-5.5': 'openai/gpt-5.5',
  'gpt-5.4': 'openai/gpt-5.4',
  'gpt-5.4-mini': 'openai/gpt-5.4-mini',
  'gemini-3.1-pro-preview': 'google/gemini-3.1-pro-preview',
  'blackbox': 'blackbox',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).end(); return; }

  try {
    const { messages, model } = req.body;
    if (!model) { res.status(400).json({ error: 'model required' }); return; }

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

    const openrouterModel = MODEL_MAP[model] || model;

    const fullMessages = [
      { role: 'system', content: `You are ${model}. Reply helpfully and concisely.${memoryContext}` },
      ...(messages || []),
    ];

    const apiRes = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENROUTER_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: openrouterModel, messages: fullMessages, stream: true, max_tokens: 2000 }),
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
