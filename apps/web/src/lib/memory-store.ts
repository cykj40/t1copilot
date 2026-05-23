// Client-side only — migrates to Neon agent_insights table in P9

export interface T1Memory {
  id: string
  type: 'pattern' | 'preference' | 'parameter_note' | 'risk_flag'
  content: string
  source: string
  confidence: number
  createdAt: string
}

const MEMORY_KEY = 't1copilot_memories'
const MAX_MEMORIES = 100

export function loadMemories(): T1Memory[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(MEMORY_KEY)
    return raw ? (JSON.parse(raw) as T1Memory[]) : []
  } catch {
    return []
  }
}

export function saveMemory(memory: Omit<T1Memory, 'id' | 'createdAt'>): T1Memory {
  const full: T1Memory = {
    ...memory,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  const existing = loadMemories()
  const updated = [full, ...existing].slice(0, MAX_MEMORIES)
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(updated))
  } catch {
    // storage full
  }
  return full
}

export function deleteMemory(id: string): void {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(loadMemories().filter((m) => m.id !== id)))
  } catch {
    // ignore
  }
}

export function clearAllMemories(): void {
  try {
    localStorage.removeItem(MEMORY_KEY)
  } catch {
    // ignore
  }
}

export function buildMemoryContext(limit = 5): string {
  const memories = loadMemories().slice(0, limit)
  if (memories.length === 0) return ''
  return memories.map((m) => `[${m.type}] ${m.content}`).join('\n')
}
