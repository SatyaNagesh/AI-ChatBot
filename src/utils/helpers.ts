export function encodeAgentMsg(agent: string, text: string) { return JSON.stringify({ a: agent, t: text }) }

export function decodeAgentMsg(content: string): { agent?: string; text: string } {
  try {
    const parsed = JSON.parse(content)
    if (parsed.a && parsed.t) return { agent: parsed.a, text: parsed.t }
  } catch {}
  return { text: content }
}

export function getInitials(name: string): string {
  return name.split(' ').slice(-2).map(s => s[0]).join('')
}
