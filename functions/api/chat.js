const TOKENLB_KEY = 'sk-mOpKxPG24lnBWjrJ2IEw5vfisXSuEqD2EStVYLhznjRTWME4';
const BLUESMINDS_KEY = 'sk-KmTYfHsUASkvQSHDx1WIZfQZyWfvALCijVk2Q65puUGqVO4P';
const TOKENLB_URL = 'https://tokenlb.net/v1/chat/completions';
const BLUESMINDS_URL = 'https://api.bluesminds.com/v1/chat/completions';

const MODEL_ROUTES = {
  'claude-opus-4-8': TOKENLB_URL, 'claude-opus-4-7': TOKENLB_URL,
  'claude-opus-4-6': TOKENLB_URL, 'claude-sonnet-4-6': TOKENLB_URL,
  'claude-sonnet-4-5-20250929': TOKENLB_URL, 'claude-haiku-4-5-20251001': TOKENLB_URL,
  'gpt-5.5': TOKENLB_URL, 'gpt-5.4': TOKENLB_URL, 'gpt-5.4-mini': TOKENLB_URL,
  'gemini-3.1-pro-preview': BLUESMINDS_URL, 'blackbox': BLUESMINDS_URL,
};

export async function onRequest(context) {
  const { request } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });

  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const { messages, model } = await request.json();
    if (!model) return Response.json({ error: 'model required' }, { status: 400 });

    const apiUrl = MODEL_ROUTES[model] || TOKENLB_URL;
    const apiKey = apiUrl === BLUESMINDS_URL
      ? (context.env.BLUESMINDS_KEY || BLUESMINDS_KEY)
      : (context.env.TOKENLB_KEY || TOKENLB_KEY);

    const fullMessages = [
      { role: 'system', content: `You are ${model}. Reply helpfully and concisely.` },
      ...(messages || []),
    ];

    const apiRes = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: fullMessages, stream: true }),
    });

    if (!apiRes.ok) {
      const err = await apiRes.json().catch(() => ({}));
      return Response.json({ error: err.error?.message || `HTTP ${apiRes.status}` }, { status: apiRes.status });
    }

    return new Response(apiRes.body, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
