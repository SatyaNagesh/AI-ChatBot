export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': '*', 'Access-Control-Allow-Headers': '*' };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors, status: 204 });

    try {
      if (url.pathname === '/sessions') {
        if (request.method === 'GET') {
          const agent = url.searchParams.get('agent');
          let query = 'SELECT id, name, preview, unread FROM sessions';
          const params = [];
          if (agent) { query += ' WHERE agent = ?'; params.push(agent); }
          query += ' ORDER BY created_at DESC';
          const { results } = await env.DB.prepare(query).bind(...params).all();
          return Response.json(results || [], { headers: cors });
        }
        if (request.method === 'POST') {
          const { id, name, agent } = await request.json();
          await env.DB.prepare('INSERT INTO sessions (id, name, agent) VALUES (?, ?, ?)').bind(id, name || 'New Session', agent).run();
          return Response.json({ ok: true }, { headers: cors });
        }
      }

      const sessionMatch = url.pathname.match(/^\/sessions\/(.+)$/);
      if (sessionMatch && request.method === 'PATCH') {
        const { name, preview } = await request.json();
        const sets = []; const params = [];
        if (name !== undefined) { sets.push('name = ?'); params.push(name); }
        if (preview !== undefined) { sets.push('preview = ?'); params.push(preview); }
        if (sets.length) { params.push(sessionMatch[1]); await env.DB.prepare(`UPDATE sessions SET ${sets.join(', ')} WHERE id = ?`).bind(...params).run(); }
        return Response.json({ ok: true }, { headers: cors });
      }

      if (url.pathname === '/messages') {
        if (request.method === 'GET') {
          const sessionId = url.searchParams.get('session_id');
          const { results } = await env.DB.prepare('SELECT role, content FROM messages WHERE session_id = ? ORDER BY created_at ASC').bind(sessionId).all();
          return Response.json(results || [], { headers: cors });
        }
        if (request.method === 'POST') {
          const { session_id, role, content } = await request.json();
          await env.DB.prepare('INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)').bind(session_id, role, content).run();
          return Response.json({ ok: true }, { headers: cors });
        }
      }

      return new Response('Not found', { status: 404 });
    } catch (e) {
      return Response.json({ error: e.message }, { status: 500, headers: cors });
    }
  }
}
