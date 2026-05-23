import type { T1UIMessage } from '@/types/artifacts'

const msgKey = (id: string) => `t1copilot_messages_${id}`

export function persistMessages(conversationId: string, messages: T1UIMessage[]): void {
  try {
    localStorage.setItem(msgKey(conversationId), JSON.stringify(messages.slice(-100)))
  } catch {
    // storage full
  }
}

export function loadPersistedMessages(conversationId: string): T1UIMessage[] {
  try {
    const raw = localStorage.getItem(msgKey(conversationId))
    return raw ? (JSON.parse(raw) as T1UIMessage[]) : []
  } catch {
    return []
  }
}
