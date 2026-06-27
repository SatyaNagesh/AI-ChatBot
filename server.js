#!/usr/bin/env node
import { createServer } from 'http';
import { readFileSync, existsSync, writeFileSync, mkdirSync, unlinkSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const TOKENLB_KEY = 'sk-mOpKxPG24lnBWjrJ2IEw5vfisXSuEqD2EStVYLhznjRTWME4';
const BLUESMINDS_KEY = 'sk-KmTYfHsUASkvQSHDx1WIZfQZyWfvALCijVk2Q65puUGqVO4P';
const TOKENLB_URL = 'https://tokenlb.net/v1/chat/completions';
const BLUESMINDS_URL = 'https://api.bluesminds.com/v1/chat/completions';
const PORT = 3456;

const MODEL_ROUTES = {
  'claude-opus-4-8': TOKENLB_URL, 'claude-opus-4-7': TOKENLB_URL,
  'claude-opus-4-6': TOKENLB_URL, 'claude-sonnet-4-6': TOKENLB_URL,
  'claude-sonnet-4-5': TOKENLB_URL, 'claude-haiku-4-5': TOKENLB_URL,
  'gpt-5.5': TOKENLB_URL, 'gpt-5.4': TOKENLB_URL, 'gpt-5.4-mini': TOKENLB_URL,
  'gemini-3.1-pro-preview': BLUESMINDS_URL, 'blackbox': BLUESMINDS_URL,
}

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const INDEX_PATH = join(DATA_DIR, 'sessions.json');
function loadIndex() {
  if (existsSync(INDEX_PATH)) return JSON.parse(readFileSync(INDEX_PATH, 'utf-8'));
  return {};
}
function saveIndex(idx) {
  writeFileSync(INDEX_PATH, JSON.stringify(idx, null, 2));
}

function loadSession(id) {
  const path = join(DATA_DIR, `${id}.json`);
  if (existsSync(path)) return JSON.parse(readFileSync(path, 'utf-8'));
  return { id, messages: [] };
}
function saveSession(s) {
  writeFileSync(join(DATA_DIR, `${s.id}.json`), JSON.stringify(s, null, 2));
}

const mime = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon'
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': '*', 'Access-Control-Allow-Headers': '*' };
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); res.end(); return; }

  if (url.pathname === '/v1/chat/completions' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const { session: sessionId, messages: msgs, model, stream = false } = JSON.parse(body);
        if (!sessionId) { res.writeHead(400, cors); res.end(JSON.stringify({ error: 'session required' })); return; }

        const session = loadSession(sessionId);
        const lastMsg = msgs?.[msgs.length - 1];
        if (lastMsg?.role === 'user') session.messages.push(lastMsg);

        const apiUrl = MODEL_ROUTES[model] || TOKENLB_URL;
        const apiKey = apiUrl === BLUESMINDS_URL ? BLUESMINDS_KEY : TOKENLB_KEY;

        const fullMessages = [
          { role: 'system', content: `You are ${model}. Reply helpfully and concisely.` },
          ...(session.messages.slice(-50))
        ];

        const apiRes = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, messages: fullMessages, stream })
        });

        if (!apiRes.ok) {
          const err = await apiRes.json().catch(() => ({}));
          res.writeHead(apiRes.status, { ...cors, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.error?.message || `HTTP ${apiRes.status}` }));
          return;
        }

        if (stream) {
          res.writeHead(200, { ...cors, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });
          const reader = apiRes.body.getReader();
          const decoder = new TextDecoder();
          let reply = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value, { stream: true });
            res.write(text);
            const lines = text.split('\n').filter(l => l.startsWith('data: ') && l !== 'data: [DONE]');
            for (const line of lines) {
              try { reply += JSON.parse(line.slice(6)).choices?.[0]?.delta?.content || ''; } catch {}
            }
          }
          res.end();
          if (reply) { session.messages.push({ role: 'assistant', content: reply }); saveSession(session); }
        } else {
          const data = await apiRes.json();
          const reply = data.choices?.[0]?.message?.content || '';
          if (reply) { session.messages.push({ role: 'assistant', content: reply }); saveSession(session); }
          res.writeHead(200, { ...cors, 'Content-Type': 'application/json' });
          res.end(JSON.stringify(data));
        }
      } catch (e) {
        res.writeHead(500, { ...cors, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (url.pathname === '/session-messages' && req.method === 'GET') {
    const id = url.searchParams.get('session');
    if (!id) { res.writeHead(400, cors); res.end(JSON.stringify({ error: 'session required' })); return; }
    const s = loadSession(id);
    res.writeHead(200, { ...cors, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ id: s.id, messages: s.messages }));
    return;
  }

  if (url.pathname === '/sessions' && req.method === 'GET') {
    const agent = url.searchParams.get('agent');
    const idx = loadIndex();
    let list = Object.values(idx);
    if (agent) list = list.filter(s => s.agent === agent);
    list.sort((a, b) => b.created - a.created);
    res.writeHead(200, { ...cors, 'Content-Type': 'application/json' });
    res.end(JSON.stringify(list));
    return;
  }

  if (url.pathname === '/session-create' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const { id, name, agent } = JSON.parse(body);
      const idx = loadIndex();
      idx[id] = { id, name, agent, preview: '', unread: 0, created: Date.now() };
      saveIndex(idx);
      saveSession({ id, messages: [] });
      res.writeHead(200, { ...cors, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }

  if (url.pathname === '/session-rename' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const { id, name, preview } = JSON.parse(body);
      const idx = loadIndex();
      if (idx[id]) {
        if (name !== undefined) idx[id].name = name;
        if (preview !== undefined) idx[id].preview = preview;
        saveIndex(idx);
      }
      res.writeHead(200, { ...cors, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }

  if (url.pathname === '/session-delete' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const { id } = JSON.parse(body);
      const idx = loadIndex();
      delete idx[id];
      saveIndex(idx);
      const path = join(DATA_DIR, `${id}.json`);
      if (existsSync(path)) unlinkSync(path);
      res.writeHead(200, { ...cors, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }

  const DIST = join(__dirname, 'dist');
  let filePath = join(DIST, url.pathname === '/' ? 'index.html' : url.pathname);
  if (!existsSync(filePath) || !filePath.startsWith(DIST)) filePath = join(DIST, 'index.html');
  const ext = filePath.slice(filePath.lastIndexOf('.'));
  res.writeHead(200, { ...cors, 'Content-Type': mime[ext] || 'application/octet-stream' });
  res.end(readFileSync(filePath));
});

server.listen(PORT, () => {
  console.log(`Chat API running at http://localhost:${PORT}`);
});
