export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const agent = url.searchParams.get('agent');
    let query = 'SELECT id, name, preview, unread FROM sessions';
    const params = [];
    if (agent) { query += ' WHERE agent = ?'; params.push(agent); }
    query += ' ORDER BY created_at DESC';
    const { results } = await env.DB.prepare(query).bind(...params).all();
    return Response.json(results || []);
  }

  if (request.method === 'POST') {
    const { id, name, agent } = await request.json();
    await env.DB.prepare(
      'INSERT INTO sessions (id, name, agent) VALUES (?, ?, ?)'
    ).bind(id, name || 'New Session', agent).run();
    return Response.json({ ok: true });
  }

  return new Response('Method not allowed', { status: 405 });
}
