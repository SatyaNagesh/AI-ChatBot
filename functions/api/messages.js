export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const sessionId = url.searchParams.get('session_id');
    if (!sessionId) return Response.json({ error: 'session_id required' }, { status: 400 });
    const { results } = await env.DB.prepare(
      'SELECT role, content FROM messages WHERE session_id = ? ORDER BY created_at ASC'
    ).bind(sessionId).all();
    return Response.json(results || []);
  }

  if (request.method === 'POST') {
    const { session_id, role, content } = await request.json();
    await env.DB.prepare(
      'INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)'
    ).bind(session_id, role, content).run();
    return Response.json({ ok: true });
  }

  return new Response('Method not allowed', { status: 405 });
}
