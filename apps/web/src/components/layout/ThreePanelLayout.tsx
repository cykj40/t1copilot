'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AgentChat } from '@/components/chat/AgentChat'
import { ArtifactPanel } from '@/components/layout/ArtifactPanel'
import { useConversations } from '@/hooks/useConversations'
import { cn } from '@/lib/utils'
import type { ArtifactData } from '@/types/artifacts'
import { AppSidebar } from './AppSidebar'

const ARTIFACT_DEFAULT_PCT = 40
const ARTIFACT_MIN_PCT = 20
const ARTIFACT_MAX_PCT = 70

interface ThreePanelLayoutProps {
  children?: React.ReactNode
  dexcomConnected: boolean
}

export function ThreePanelLayout({ children, dexcomConnected }: ThreePanelLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [artifact, setArtifact] = useState<ArtifactData | null>(null)
  const [artifactWidthPct, setArtifactWidthPct] = useState(ARTIFACT_DEFAULT_PCT)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [chatKey, setChatKey] = useState('new')
  const splitRef = useRef<HTMLDivElement>(null)
  const { conversations, createConversation, updateConversation, deleteConversation } =
    useConversations()

  const showArtifact = artifact !== null

  useEffect(() => {
    if (showArtifact) {
      setArtifactWidthPct(ARTIFACT_DEFAULT_PCT)
    }
  }, [showArtifact])

  const handleDividerPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      const container = splitRef.current
      if (!container) return

      const startX = event.clientX
      const startPct = artifactWidthPct

      function onPointerMove(ev: PointerEvent) {
        const rect = container?.getBoundingClientRect()
        if (!rect || rect.width <= 0) return
        const deltaPct = ((startX - ev.clientX) / rect.width) * 100
        const next = Math.min(ARTIFACT_MAX_PCT, Math.max(ARTIFACT_MIN_PCT, startPct + deltaPct))
        setArtifactWidthPct(next)
      }

      function onPointerUp() {
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', onPointerUp)
      }

      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
    },
    [artifactWidthPct],
  )

  function handleCloseArtifact() {
    setArtifact(null)
  }

  function handleNewConversation() {
    setActiveConversationId(null)
    setArtifact(null)
    setChatKey(`new-${crypto.randomUUID()}`)
  }

  function handleSelectConversation(id: string) {
    setActiveConversationId(id)
    setArtifact(null)
    setChatKey(id)
  }

  function handleDeleteConversation(id: string) {
    deleteConversation(id)
    if (id === activeConversationId) handleNewConversation()
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
        dexcomConnected={dexcomConnected}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onNewConversation={handleNewConversation}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      <div ref={splitRef} className="flex flex-1 min-w-0 h-full overflow-hidden">
        <div
          className="flex min-h-0 min-w-0 flex-col overflow-hidden transition-[width] duration-200 ease-out"
          style={{ width: showArtifact ? `${100 - artifactWidthPct}%` : '100%' }}
        >
          {children && (
            <div className="border-b border-border overflow-y-auto max-h-[55%] shrink-0">
              {children}
            </div>
          )}
          <div className="flex-1 min-h-0">
            <AgentChat
              key={chatKey}
              onArtifact={setArtifact}
              conversationId={activeConversationId}
              onFirstMessage={(text) => {
                const id = createConversation(text)
                setActiveConversationId(id)
                return id
              }}
              onMessagesChange={(id, count) => updateConversation(id, count)}
            />
          </div>
        </div>

        {showArtifact && artifact !== null && (
          <>
            <button
              type="button"
              aria-label="Resize artifact panel"
              onPointerDown={handleDividerPointerDown}
              className={cn(
                'relative z-10 w-1.5 shrink-0 cursor-col-resize touch-none border-0 p-0',
                'bg-border hover:bg-primary/50 active:bg-primary transition-colors',
              )}
            >
              <div className="pointer-events-none absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 rounded-full bg-border" />
            </button>

            <aside
              className="flex h-full min-w-[280px] shrink-0 flex-col overflow-hidden border-l border-border bg-background transition-[width] duration-200 ease-out"
              style={{ width: `${artifactWidthPct}%` }}
            >
              <ArtifactPanel artifact={artifact} onClose={handleCloseArtifact} />
            </aside>
          </>
        )}
      </div>
    </div>
  )
}
