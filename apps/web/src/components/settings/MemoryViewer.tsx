'use client'

import { Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { clearAllMemories, loadMemories } from '@/lib/memory-store'

interface ServerMemory {
  id: string
  summary: string
  insightType: string
  confidence: number | null
  createdAt: string | null
}

export function MemoryViewer() {
  const [memories, setMemories] = useState<ServerMemory[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)

  const fetchMemories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/memory', { cache: 'no-store' })
      if (res.ok) {
        const data = (await res.json()) as { success: boolean; memories?: ServerMemory[] }
        setMemories(data.memories ?? [])
      }
    } catch {
      // Network error — leave memories empty
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchMemories()
  }, [fetchMemories])

  async function handleDelete(id: string) {
    try {
      await fetch('/api/memory', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setMemories((prev) => prev.filter((m) => m.id !== id))
    } catch {
      // Silently fail — item stays in list
    }
  }

  async function handleClearAll() {
    try {
      await fetch('/api/memory', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
      setMemories([])
    } catch {
      // Silently fail
    }
  }

  async function handleImportToServer() {
    const all = loadMemories()
    if (all.length === 0) {
      setImportResult('No localStorage memories to import.')
      return
    }
    setImporting(true)
    setImportResult(null)
    let succeeded = 0
    let failed = 0
    for (const m of all) {
      try {
        const res = await fetch('/api/memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: m.content,
            type: m.type,
            source: m.source,
            confidence: m.confidence,
          }),
        })
        const data = (await res.json()) as { success: boolean }
        if (data.success) {
          succeeded++
        } else {
          failed++
        }
      } catch {
        failed++
      }
    }
    if (succeeded > 0) {
      clearAllMemories()
    }
    setImportResult(
      failed === 0
        ? `Imported ${String(succeeded)} memories to server. localStorage cleared.`
        : `Imported ${String(succeeded)}, failed ${String(failed)}.`,
    )
    setImporting(false)
    await fetchMemories()
  }

  const localCount = loadMemories().length

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-foreground">Agent Memory</p>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            {loading ? '…' : String(memories.length)} stored
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Patterns written by agents based on your data. Injected into every conversation.
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        {loading ? (
          <p className="text-xs text-muted-foreground/50 py-2">Loading…</p>
        ) : memories.length === 0 ? (
          <p className="text-xs text-muted-foreground/50 py-2">
            No memories stored yet. The Insight Agent will populate these as you use the app.
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
                    {m.insightType}
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{m.summary}</p>
                  {m.createdAt !== null && (
                    <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                      {new Date(m.createdAt).toLocaleDateString()}
                      {m.confidence !== null
                        ? ` · ${String(Math.round(m.confidence * 100))}% confidence`
                        : ''}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void handleDelete(m.id)}
                  className="shrink-0 text-muted-foreground/40 hover:text-destructive transition-colors mt-0.5"
                  aria-label="Delete memory"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex flex-col gap-2">
          {localCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleImportToServer()}
              disabled={importing}
              className="h-7 text-xs border-primary/40 text-primary hover:bg-primary/10"
            >
              {importing ? 'Importing…' : `Import ${String(localCount)} from localStorage`}
            </Button>
          )}
          {memories.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleClearAll()}
              className="h-7 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              Clear all memory
            </Button>
          )}
          {importResult !== null && (
            <p className="text-[10px] text-muted-foreground">{importResult}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
