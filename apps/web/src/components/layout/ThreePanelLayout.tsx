'use client'

import { useEffect, useState } from 'react'
import { usePanelRef } from 'react-resizable-panels'
import { AgentChat } from '@/components/chat/AgentChat'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { useConversations } from '@/hooks/useConversations'
import { cn } from '@/lib/utils'
import type { ArtifactData } from '@/types/artifacts'
import { AppSidebar } from './AppSidebar'
import { ArtifactPanel } from './ArtifactPanel'

interface ThreePanelLayoutProps {
  children?: React.ReactNode
  dexcomConnected: boolean
}

export function ThreePanelLayout({ children, dexcomConnected }: ThreePanelLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [artifact, setArtifact] = useState<ArtifactData | null>(null)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [chatKey, setChatKey] = useState('new')
  const artifactPanelRef = usePanelRef()
  const { conversations, createConversation, updateConversation, deleteConversation } =
    useConversations()

  // react-resizable-panels: never mount/unmount panels dynamically — the main panel
  // starts at 100% and a late-added sibling gets 0px width. Collapse/expand instead.
  useEffect(() => {
    const panel = artifactPanelRef.current
    if (!panel) return
    if (artifact) {
      if (panel.isCollapsed()) panel.expand()
      panel.resize('38%')
    } else {
      panel.collapse()
    }
  }, [artifact, artifactPanelRef])

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
    if (id === activeConversationId) {
      handleNewConversation()
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((collapsed) => !collapsed)}
        dexcomConnected={dexcomConnected}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onNewConversation={handleNewConversation}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
      />
      <ResizablePanelGroup orientation="horizontal" className="flex-1 min-w-0">
        <ResizablePanel id="main" defaultSize={100} minSize={40}>
          <div className="flex h-full flex-col overflow-hidden">
            {children && (
              <div className="border-b border-border overflow-y-auto max-h-[55%]">{children}</div>
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
        </ResizablePanel>
        <ResizableHandle
          withHandle
          className={cn('bg-border hover:bg-primary/40 transition-colors', !artifact && 'hidden')}
        />
        <ResizablePanel
          id="artifact"
          panelRef={artifactPanelRef}
          defaultSize={0}
          collapsedSize={0}
          collapsible
          minSize={25}
          maxSize={55}
        >
          {artifact ? (
            <ArtifactPanel artifact={artifact} onClose={() => setArtifact(null)} />
          ) : null}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
