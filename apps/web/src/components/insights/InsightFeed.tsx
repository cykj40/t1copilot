'use client'

import { useEffect, useState } from 'react'
import { InsightCard } from './InsightCard'

interface ServerMemory {
  id: string
  summary: string
  insightType: string
  confidence: number | null
  createdAt: string | null
}

export function formatInsightType(insightType: string): string {
  const labels: Record<string, string> = {
    weekly_summary: 'Weekly Summary',
    pattern: 'Pattern',
    drift_alert: 'Drift Alert',
    hypo_risk: 'Hypo Risk',
  }
  return labels[insightType] ?? insightType
}

function isActionable(insightType: string): boolean {
  return insightType === 'drift_alert' || insightType === 'hypo_risk'
}

export function InsightFeed() {
  const [memories, setMemories] = useState<ServerMemory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/api/memory', { cache: 'no-store' })
        if (!res.ok) throw new Error('fetch failed')
        const data = (await res.json()) as { success: boolean; memories?: ServerMemory[] }
        if (!cancelled) {
          setMemories((data.memories ?? []).slice(0, 10))
        }
      } catch {
        if (!cancelled) {
          setMemories([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">Loading insights...</p>
      </div>
    )
  }

  if (memories.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">
          No insights yet. Ask the agent: &quot;Give me a weekly insight summary&quot;
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {memories.map((memory) => (
        <InsightCard
          key={memory.id}
          title={formatInsightType(memory.insightType)}
          summary={memory.summary}
          confidence={memory.confidence ?? 0.7}
          actionable={isActionable(memory.insightType)}
        />
      ))}
    </div>
  )
}
