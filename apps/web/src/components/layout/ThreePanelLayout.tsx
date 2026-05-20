'use client'

import { useState } from 'react'
import type { PanelSize } from 'react-resizable-panels'
import { AgentChat } from '@/components/chat/AgentChat'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import type { ArtifactData } from '@/types/artifacts'
import { AppSidebar } from './AppSidebar'
import { ArtifactPanel } from './ArtifactPanel'

interface ThreePanelLayoutProps {
  children: React.ReactNode
}

export function ThreePanelLayout({ children }: ThreePanelLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [artifact, setArtifact] = useState<ArtifactData | null>(null)
  const [artifactOpen, setArtifactOpen] = useState(true)

  function handleSidebarResize(size: PanelSize) {
    setCollapsed(size.asPercentage <= 5)
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <ResizablePanelGroup orientation="horizontal" className="h-full">
        {/* ── LEFT: Navigation sidebar ─────────────────────────────────────── */}
        <ResizablePanel
          defaultSize={18}
          minSize={12}
          maxSize={25}
          collapsible
          collapsedSize={4}
          onResize={handleSidebarResize}
        >
          <AppSidebar collapsed={collapsed} />
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-border hover:bg-primary/40 transition-colors" />

        {/* ── CENTER: Agent chat workspace ─────────────────────────────────── */}
        <ResizablePanel defaultSize={artifactOpen ? 50 : 82} minSize={35}>
          <AgentChat
            onArtifact={(a) => {
              setArtifact(a)
              setArtifactOpen(true)
            }}
          />
        </ResizablePanel>

        {/* ── RIGHT: Context / Artifact panel ──────────────────────────────── */}
        {artifactOpen && (
          <>
            <ResizableHandle
              withHandle
              className="bg-border hover:bg-primary/40 transition-colors"
            />
            <ResizablePanel defaultSize={32} minSize={0} maxSize={50}>
              <ArtifactPanel
                artifact={artifact}
                pageContent={children}
                onClose={() => {
                  setArtifactOpen(false)
                  setArtifact(null)
                }}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  )
}
