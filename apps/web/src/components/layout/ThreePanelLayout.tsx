'use client'

import { useState } from 'react'
import type { PanelSize } from 'react-resizable-panels'
import { AgentChat } from '@/components/chat/AgentChat'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import type { ArtifactData } from '@/types/artifacts'
import { AppSidebar } from './AppSidebar'
import { ArtifactPanel } from './ArtifactPanel'

export function ThreePanelLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [artifact, setArtifact] = useState<ArtifactData | null>(null)

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

        {/* ── CENTER: Agent chat — always visible ──────────────────────────── */}
        <ResizablePanel defaultSize={82} minSize={35}>
          <AgentChat onArtifact={setArtifact} />
        </ResizablePanel>

        {/* ── RIGHT: Artifact panel — only mounts when agent produces output ─ */}
        {artifact !== null && (
          <>
            <ResizableHandle
              withHandle
              className="bg-border hover:bg-primary/40 transition-colors"
            />
            <ResizablePanel defaultSize={35} minSize={20} maxSize={55}>
              <ArtifactPanel artifact={artifact} onClose={() => setArtifact(null)} />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  )
}
