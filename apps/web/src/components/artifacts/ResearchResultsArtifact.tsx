'use client'

import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { RenderResearchResultsArtifact } from '@/types/artifacts'

const DEFAULT_POLL_INTERVAL_MS = 4000
const RESEARCH_DISCLAIMER =
  'This is general information, not medical advice. Discuss findings with your care team.'

interface ResearchResultsArtifactProps {
  artifact: RenderResearchResultsArtifact
  /** When false, display static data only (past results on /research). Default true. */
  poll?: boolean
  /** Override poll interval — intended for tests only. */
  pollIntervalMs?: number
}

function DarkCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="bg-[#111113] border-[#232326]">
      <CardHeader className="pb-1 pt-3 px-4">
        <p className="text-xs font-medium text-foreground">{title}</p>
      </CardHeader>
      <CardContent className="px-4 pb-3">{children}</CardContent>
    </Card>
  )
}

function isLongerContent(content: string | null, summary: string | null): boolean {
  if (!content || !summary) return false
  return content.length > summary.length + 40
}

export function ResearchResultsArtifact({
  artifact,
  poll = true,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
}: ResearchResultsArtifactProps) {
  const [data, setData] = useState(artifact)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setData(artifact)
  }, [artifact])

  useEffect(() => {
    if (!poll || data.status !== 'pending') return

    let cancelled = false

    async function fetchStatus() {
      try {
        const res = await fetch(`/api/research/${data.id}`)
        if (!res.ok || cancelled) return
        const json = (await res.json()) as {
          success: boolean
          research?: RenderResearchResultsArtifact
        }
        if (json.success && json.research) {
          setData({
            artifactType: 'render_research_results',
            id: json.research.id,
            query: json.research.query,
            status: json.research.status,
            sourceUrl: json.research.sourceUrl,
            content: json.research.content,
            agentSummary: json.research.agentSummary,
          })
        }
      } catch {
        // Polling failures are non-fatal — next interval retries
      }
    }

    void fetchStatus()
    const interval = window.setInterval(() => {
      void fetchStatus()
    }, pollIntervalMs)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [poll, pollIntervalMs, data.id, data.status])

  const showFullContent = isLongerContent(data.content, data.agentSummary)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-[#a3a3a3]">Research</p>
        {data.status === 'pending' && (
          <span className="inline-flex items-center gap-1.5 text-[10px] text-primary">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
            In progress
          </span>
        )}
      </div>

      <DarkCard title="Query">
        <p className="text-xs text-foreground leading-relaxed">{data.query}</p>
      </DarkCard>

      {data.status === 'pending' && (
        <DarkCard title="Status">
          <p className="text-[10px] text-[#a3a3a3]">
            Deep research is running. Results typically take a few minutes — this panel updates
            automatically.
          </p>
        </DarkCard>
      )}

      {data.status === 'error' && (
        <DarkCard title="Research unavailable">
          <p className="text-[10px] text-[#a3a3a3]">
            Research could not be completed for this query. Try again later or rephrase your
            question.
          </p>
        </DarkCard>
      )}

      {data.status === 'complete' && (
        <>
          {data.agentSummary && (
            <DarkCard title="Summary">
              <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                {data.agentSummary}
              </p>
            </DarkCard>
          )}

          {showFullContent && data.content && (
            <DarkCard title="Full research">
              {expanded ? (
                <p className="text-[10px] text-[#a3a3a3] leading-relaxed whitespace-pre-wrap">
                  {data.content}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" aria-hidden="true" />
                    Hide full research
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" aria-hidden="true" />
                    Show full research
                  </>
                )}
              </button>
            </DarkCard>
          )}

          {data.sourceUrl && (
            <DarkCard title="Source">
              <a
                href={data.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline break-all"
              >
                {data.sourceUrl}
              </a>
            </DarkCard>
          )}
        </>
      )}

      <p className="text-[10px] text-muted-foreground/70 px-1">{RESEARCH_DISCLAIMER}</p>
    </div>
  )
}

export function toResearchArtifact(
  item: Omit<RenderResearchResultsArtifact, 'artifactType'>,
): RenderResearchResultsArtifact {
  return { artifactType: 'render_research_results', ...item }
}
