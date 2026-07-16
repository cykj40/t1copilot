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

export function loadMemories(): T1Memory[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(MEMORY_KEY)
    return raw ? (JSON.parse(raw) as T1Memory[]) : []
  } catch {
    return []
  }
}

export function clearAllMemories(): void {
  try {
    localStorage.removeItem(MEMORY_KEY)
  } catch {
    // ignore
  }
}
