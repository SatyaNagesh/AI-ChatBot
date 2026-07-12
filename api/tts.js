export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST required' }); return; }

  const { text } = req.body || {};

  // For production, point this to a deployed TTS server
  // Example: https://your-tts-server.onrender.com/tts
  const TTS_API = process.env.TTS_API_URL || 'http://localhost:3457/tts';

  if (!text) return res.status(400).json({ error: 'text is required' });

  try {
    const ttsRes = await fetch(TTS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!ttsRes.ok) {
      const err = await ttsRes.text().catch(() => 'TTS server error');
      return res.status(502).json({ error: err });
    }

    const audio = await ttsRes.arrayBuffer();
    res.setHeader('Content-Type', 'audio/wav');
    res.send(Buffer.from(audio));
  } catch {
    res.status(502).json({ error: 'TTS server unreachable. Run: python server/tts_server.py' });
  }
}
