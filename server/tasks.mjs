import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const DATA_DIR = join(homedir(), '.ai-chatbot')
const DATA_FILE = join(DATA_DIR, 'tasks.json')
const COLUMNS = ['To Do', 'In Progress', 'In Review', 'Done']
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
}

function loadTasks() {
  ensureDataDir()
  if (!existsSync(DATA_FILE)) {
    const empty = Object.fromEntries(COLUMNS.map(c => [c, []]))
    writeFileSync(DATA_FILE, JSON.stringify(empty, null, 2))
    return empty
  }
  try {
    const raw = readFileSync(DATA_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    const valid = Object.fromEntries(COLUMNS.map(c => [c, []]))
    for (const col of COLUMNS) {
      if (Array.isArray(parsed[col])) {
        valid[col] = parsed[col].filter(t => t && typeof t.id === 'string')
      }
    }
    return valid
  } catch {
    const empty = Object.fromEntries(COLUMNS.map(c => [c, []]))
    writeFileSync(DATA_FILE, JSON.stringify(empty, null, 2))
    return empty
  }
}

function saveTasks(tasks) {
  ensureDataDir()
  writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2))
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function parseBody(req) {
  return req.json().catch(() => null)
}

const server = Bun.serve({
  port: 3456,
  async fetch(req) {
    const url = new URL(req.url)
    const method = req.method

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS })
    }

    // GET /api/tasks — list all tasks
    if (method === 'GET' && url.pathname === '/api/tasks') {
      return json(loadTasks())
    }

    // POST /api/tasks — create a task
    if (method === 'POST' && url.pathname === '/api/tasks') {
      const body = await parseBody(req)
      if (!body || !body.title) return json({ error: 'title required' }, 400)
      const col = body.column && COLUMNS.includes(body.column) ? body.column : 'To Do'
      const task = {
        id: generateId(),
        title: body.title.trim(),
        description: (body.description || '').trim(),
        priority: ['High', 'Medium', 'Low'].includes(body.priority) ? body.priority : 'Medium',
        dueDate: body.dueDate || '',
        createdAt: new Date().toISOString(),
      }
      const tasks = loadTasks()
      tasks[col] = [task, ...tasks[col]]
      saveTasks(tasks)
      return json(task, 201)
    }

    // PUT /api/tasks/:id — update a task
    const putMatch = url.pathname.match(/^\/api\/tasks\/(.+)$/)
    if (putMatch && method === 'PUT') {
      const taskId = putMatch[1]
      const body = await parseBody(req)
      if (!body) return json({ error: 'invalid body' }, 400)
      const tasks = loadTasks()
      let found = false
      for (const col of COLUMNS) {
        tasks[col] = tasks[col].map(t => {
          if (t.id === taskId) {
            found = true
            return {
              ...t,
              title: body.title !== undefined ? body.title.trim() : t.title,
              description: body.description !== undefined ? body.description.trim() : t.description,
              priority: body.priority && ['High', 'Medium', 'Low'].includes(body.priority) ? body.priority : t.priority,
              dueDate: body.dueDate !== undefined ? body.dueDate : t.dueDate,
            }
          }
          return t
        })
      }
      if (!found) return json({ error: 'not found' }, 404)
      saveTasks(tasks)
      return json({ ok: true })
    }

    // DELETE /api/tasks/:id — delete a task
    const delMatch = url.pathname.match(/^\/api\/tasks\/(.+)$/)
    if (delMatch && method === 'DELETE') {
      const taskId = delMatch[1]
      const tasks = loadTasks()
      let found = false
      for (const col of COLUMNS) {
        const before = tasks[col].length
        tasks[col] = tasks[col].filter(t => t.id !== taskId)
        if (tasks[col].length < before) found = true
      }
      if (!found) return json({ error: 'not found' }, 404)
      saveTasks(tasks)
      return json({ ok: true })
    }

    // POST /api/tasks/:id/move — move task to another column
    const moveMatch = url.pathname.match(/^\/api\/tasks\/(.+)\/move$/)
    if (moveMatch && method === 'POST') {
      const taskId = moveMatch[1]
      const body = await parseBody(req)
      const toCol = body?.column
      if (!toCol || !COLUMNS.includes(toCol)) return json({ error: 'valid column required' }, 400)
      const tasks = loadTasks()
      let task = null
      for (const col of COLUMNS) {
        const idx = tasks[col].findIndex(t => t.id === taskId)
        if (idx !== -1) {
          task = tasks[col][idx]
          tasks[col].splice(idx, 1)
          break
        }
      }
      if (!task) return json({ error: 'not found' }, 404)
      tasks[toCol] = [task, ...tasks[toCol]]
      saveTasks(tasks)
      return json({ ok: true })
    }

    return json({ error: 'not found' }, 404)
  },
})

console.log(`Tasks API server running on http://localhost:${server.port}`)
