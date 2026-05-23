'use client'

import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { clearAllMemories, deleteMemory, loadMemories, type T1Memory } from '@/lib/memory-store'

export function MemoryViewer() {
  const [memories, setMemories] = useState<T1Memory[]>([])

  useEffect(() => {
    setMemories(loadMemories())
  }, [])

  function handleDelete(id: string) {
    deleteMemory(id)
    setMemories((prev) => prev.filter((m) => m.id !== id))
  }

  function handleClearAll() {
    clearAllMemories()
    setMemories([])
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-foreground">Agent Memory</p>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            {String(memories.length)} stored
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Patterns written by agents based on your data. Injected into every conversation.
          Agent-written in P9 — currently empty by default.
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        {memories.length === 0 ? (
          <p className="text-xs text-muted-foreground/50 py-2">
            No memories stored yet. The Insight Agent will populate these in P9.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {memories.map((m) => (
              <li
                key={m.id}
                className="flex items-start justify-between gap-2 py-1.5 border-b border-border last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-medium text-primary uppercase tracking-wider">
                    {m.type}
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{m.content}</p>
                  <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                    {m.source} · {new Date(m.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(m.id)}
                  className="shrink-0 text-muted-foreground/40 hover:text-destructive transition-colors mt-0.5"
                  aria-label="Delete memory"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {memories.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="mt-3 h-7 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            Clear all memory
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
