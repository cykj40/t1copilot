'use client'

import { useCallback, useEffect, useState } from 'react'

export interface StoredConversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messageCount: number
}

const CONV_KEY = 't1copilot_conversations'
const MSG_KEY = (id: string) => `t1copilot_messages_${id}`
const MAX_STORED = 50

function read(): StoredConversation[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CONV_KEY)
    return raw ? (JSON.parse(raw) as StoredConversation[]) : []
  } catch {
    return []
  }
}

function write(convs: StoredConversation[]): void {
  try {
    localStorage.setItem(CONV_KEY, JSON.stringify(convs))
  } catch {
    // storage full — silently fail
  }
}

export function useConversations() {
  const [conversations, setConversations] = useState<StoredConversation[]>([])

  useEffect(() => {
    setConversations(read())
  }, [])

  const createConversation = useCallback((firstMessage: string): string => {
    const id = crypto.randomUUID()
    const title = firstMessage.length > 40 ? `${firstMessage.slice(0, 40)}…` : firstMessage
    const now = new Date().toISOString()
    const conv: StoredConversation = {
      id,
      title,
      createdAt: now,
      updatedAt: now,
      messageCount: 1,
    }
    setConversations((prev) => {
      const next = [conv, ...prev].slice(0, MAX_STORED)
      write(next)
      return next
    })
    return id
  }, [])

  const updateConversation = useCallback((id: string, messageCount: number) => {
    setConversations((prev) => {
      const next = prev.map((c) =>
        c.id === id ? { ...c, updatedAt: new Date().toISOString(), messageCount } : c,
      )
      write(next)
      return next
    })
  }, [])

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id)
      write(next)
      try {
        localStorage.removeItem(MSG_KEY(id))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const deleteAllConversations = useCallback(() => {
    setConversations((prev) => {
      for (const c of prev) {
        try {
          localStorage.removeItem(MSG_KEY(c.id))
        } catch {
          // ignore
        }
      }
      write([])
      return []
    })
  }, [])

  return {
    conversations,
    createConversation,
    updateConversation,
    deleteConversation,
    deleteAllConversations,
  }
}
