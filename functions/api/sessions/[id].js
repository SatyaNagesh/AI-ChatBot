export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();

  if (request.method === 'PATCH') {
    const { name, preview } = await request.json();
    const sets = [];
    const params = [];
    if (name !== undefined) { sets.push('name = ?'); params.push(name); }
    if (preview !== undefined) { sets.push('preview = ?'); params.push(preview); }
    if (sets.length === 0) return Response.json({ ok: true });
    params.push(id);
    await env.DB.prepare(`UPDATE sessions SET ${sets.join(', ')} WHERE id = ?`).bind(...params).run();
    return Response.json({ ok: true });
  }

  return new Response('Method not allowed', { status: 405 });
}
