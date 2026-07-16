'use client'

import type { ResearchListItem } from '@t1copilot/types'
import { useState } from 'react'
import {
  ResearchResultsArtifact,
  toResearchArtifact,
} from '@/components/artifacts/ResearchResultsArtifact'
import { useLogContext } from '@/components/layout/ThreePanelLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ResearchPageClientProps {
  recentResearch: ResearchListItem[]
}

export function ResearchQueryForm() {
  const { submitLogMessage } = useLogContext()
  const [query, setQuery] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    submitLogMessage(`Research: ${trimmed}`)
    setQuery('')
    setTimeout(() => setSubmitting(false), 2000)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor="research-query" className="text-xs text-muted-foreground">
        Research question
      </label>
      <div className="flex gap-2">
        <Input
          id="research-query"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. What does evidence say about CGM accuracy during exercise?"
          className="flex-1 bg-muted border-border text-sm"
        />
        <Button
          type="submit"
          size="sm"
          disabled={submitting || query.trim().length === 0}
          className="shrink-0 text-xs"
        >
          {submitting ? 'Sending…' : 'Research'}
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground/60">
        Sends your question to the agent, which starts a background deep-research job. Results
        appear in the artifact panel when ready.
      </p>
    </form>
  )
}

export function ResearchPageClient({ recentResearch }: ResearchPageClientProps) {
  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h1 className="text-sm font-semibold text-foreground">Research</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Search and summarize medical and nutritional literature evidence.
        </p>
      </div>

      <ResearchQueryForm />

      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium text-muted-foreground">Recent research</p>
        {recentResearch.length === 0 ? (
          <p className="text-xs text-muted-foreground/60">No research run yet.</p>
        ) : (
          recentResearch.map((item) => (
            <ResearchResultsArtifact
              key={item.id}
              artifact={toResearchArtifact({
                id: item.id,
                query: item.query,
                status: item.status,
                sourceUrl: item.sourceUrl,
                content: item.content,
                agentSummary: item.agentSummary,
              })}
              poll={false}
            />
          ))
        )}
      </div>
    </div>
  )
}
