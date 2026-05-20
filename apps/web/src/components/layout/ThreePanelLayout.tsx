'use client'

import { useState } from 'react'
import { AgentChat } from '@/components/chat/AgentChat'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import type { ArtifactData } from '@/types/artifacts'
import { AppSidebar } from './AppSidebar'
import { ArtifactPanel } from './ArtifactPanel'

export function ThreePanelLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [artifact, setArtifact] = useState<ArtifactData | null>(null)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((collapsed) => !collapsed)}
      />
      <ResizablePanelGroup orientation="horizontal" className="flex-1 min-w-0">
        <ResizablePanel defaultSize={100} minSize={40}>
          <AgentChat onArtifact={(a) => setArtifact(a)} />
        </ResizablePanel>
        {artifact !== null && (
          <>
            <ResizableHandle
              withHandle
              className="bg-border hover:bg-primary/40 transition-colors"
            />
            <ResizablePanel defaultSize={38} minSize={25} maxSize={55}>
              <ArtifactPanel artifact={artifact} onClose={() => setArtifact(null)} />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  )
}
