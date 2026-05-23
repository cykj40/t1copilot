'use client'

import { Check, Code, Copy, Download, Eye, X } from 'lucide-react'
import { useState } from 'react'
import { ArtifactRouter } from '@/components/artifacts/ArtifactRouter'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ArtifactData } from '@/types/artifacts'

type PanelTab = 'preview' | 'source'

interface ArtifactPanelProps {
  artifact: ArtifactData
  onClose: () => void
}

function getTitle(artifact: ArtifactData): string {
  switch (artifact.artifactType) {
    case 'render_glucose_chart':
      return `Glucose · ${artifact.timeRange}`
    case 'render_workout_correlation':
      return artifact.workoutName
    case 'render_weekly_summary':
      return `Week · ${artifact.weekLabel}`
    case 'render_doctor_checklist':
      return 'Endo Prep Checklist'
    case 'confirm_log_event':
      return `Log ${artifact.eventType.charAt(0).toUpperCase()}${artifact.eventType.slice(1)}`
    case 'render_markdown_doc':
      return artifact.title
    case 'render_html_report':
      return artifact.title
    default:
      return 'Artifact'
  }
}

function hasSourceTab(artifact: ArtifactData): boolean {
  return (
    artifact.artifactType === 'render_markdown_doc' ||
    artifact.artifactType === 'render_html_report'
  )
}

function hasCsvExport(artifact: ArtifactData): boolean {
  return artifact.artifactType === 'render_glucose_chart'
}

function hasPdfExport(artifact: ArtifactData): boolean {
  return (
    artifact.artifactType === 'render_weekly_summary' ||
    artifact.artifactType === 'render_doctor_checklist' ||
    artifact.artifactType === 'render_markdown_doc' ||
    artifact.artifactType === 'render_html_report'
  )
}

export function ArtifactPanel({ artifact, onClose }: ArtifactPanelProps) {
  const [tab, setTab] = useState<PanelTab>('preview')
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(artifact, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard unavailable — fail silently
    }
  }

  function handleCsvExport() {
    if (artifact.artifactType !== 'render_glucose_chart') return
    const readings = artifact.readings ?? []
    if (readings.length === 0) return
    const csv =
      'timestamp,value_mgdl,trend\n' +
      readings.map((r) => `${r.timestamp},${String(r.value)},${r.trend}`).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `glucose-${new Date().toISOString().split('T')[0] ?? 'export'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handlePdfExport() {
    window.print()
  }

  const title = getTitle(artifact)
  const showSource = hasSourceTab(artifact)
  const showCsv = hasCsvExport(artifact)
  const showPdf = hasPdfExport(artifact)

  return (
    <div className="flex h-full flex-col bg-[#0d0d0f] border-l border-[#1e1e22] animate-in slide-in-from-right duration-200">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-[#1e1e22] px-3">
        <div className="flex items-center gap-0.5 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setTab('preview')}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors shrink-0"
            style={{
              background: tab === 'preview' ? '#1e1e22' : 'transparent',
              color: tab === 'preview' ? '#e5e5e5' : '#6b6b6b',
            }}
          >
            <Eye className="h-3 w-3" aria-hidden="true" />
            Preview
          </button>
          {showSource && (
            <button
              type="button"
              onClick={() => setTab('source')}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors shrink-0"
              style={{
                background: tab === 'source' ? '#1e1e22' : 'transparent',
                color: tab === 'source' ? '#e5e5e5' : '#6b6b6b',
              }}
            >
              <Code className="h-3 w-3" aria-hidden="true" />
              Source
            </button>
          )}
        </div>

        <p className="text-xs text-[#6b6b6b] truncate max-w-[120px] shrink">{title}</p>

        <div className="flex items-center gap-0.5 shrink-0 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-[#6b6b6b] hover:text-[#e5e5e5]"
            onClick={() => void handleCopy()}
            title="Copy"
          >
            {copied ? <Check className="h-3 w-3 text-[#22c55e]" /> : <Copy className="h-3 w-3" />}
          </Button>
          {showCsv && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-[#6b6b6b] hover:text-[#e5e5e5]"
              onClick={handleCsvExport}
              title="Download CSV"
            >
              <Download className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-[#6b6b6b] hover:text-[#e5e5e5]"
            onClick={onClose}
            title="Close"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          {tab === 'preview' ? (
            <ArtifactRouter artifact={artifact} />
          ) : (
            <pre className="text-[11px] text-[#a3a3a3] font-mono whitespace-pre-wrap break-words leading-relaxed">
              {JSON.stringify(artifact, null, 2)}
            </pre>
          )}
        </div>
      </ScrollArea>

      <div className="shrink-0 flex items-center justify-between border-t border-[#1e1e22] px-3 py-2">
        <p className="text-[10px] text-[#4b4b4b] leading-tight">
          ⚠️ T1Copilot is assistive only. All health decisions require your judgment.
        </p>
        {showPdf && (
          <button
            type="button"
            onClick={handlePdfExport}
            className="flex items-center gap-1 text-[10px] text-[#6b6b6b] hover:text-[#a3a3a3] transition-colors shrink-0 ml-2"
          >
            <Download className="h-3 w-3" aria-hidden="true" />
            PDF
          </button>
        )}
      </div>
    </div>
  )
}
