'use client'

import { useRef, useState } from 'react'
import { AgentChat } from '@/components/chat/AgentChat'
import { ArtifactPanel } from '@/components/layout/ArtifactPanel'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { useConversations } from '@/hooks/useConversations'
import type { ArtifactData } from '@/types/artifacts'
import { AppSidebar } from './AppSidebar'

interface ThreePanelLayoutProps {
  children?: React.ReactNode
  dexcomConnected: boolean
}

export function ThreePanelLayout({ children, dexcomConnected }: ThreePanelLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [artifact, setArtifact] = useState<ArtifactData | null>(null)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [chatKey, setChatKey] = useState('new')

  // react-resizable-panels only reads defaultSize on initial render of each panel.
  // Remount the group the first time an artifact opens so defaultSize applies (60/40).
  // After that, user drag controls layout until close.
  const [panelGroupKey, setPanelGroupKey] = useState('initial')
  const artifactWasShown = useRef(false)

  const { conversations, createConversation, updateConversation, deleteConversation } =
    useConversations()

  function handleArtifact(newArtifact: ArtifactData) {
    if (!artifactWasShown.current) {
      artifactWasShown.current = true
      setPanelGroupKey('with-artifact')
    }
    setArtifact(newArtifact)
  }

  function handleCloseArtifact() {
    setArtifact(null)
    artifactWasShown.current = false
    setPanelGroupKey('initial')
  }

  function handleNewConversation() {
    setActiveConversationId(null)
    setArtifact(null)
    artifactWasShown.current = false
    setPanelGroupKey('initial')
    setChatKey(`new-${crypto.randomUUID()}`)
  }

  function handleSelectConversation(id: string) {
    setActiveConversationId(id)
    setArtifact(null)
    artifactWasShown.current = false
    setPanelGroupKey('initial')
    setChatKey(id)
  }

  function handleDeleteConversation(id: string) {
    deleteConversation(id)
    if (id === activeConversationId) handleNewConversation()
  }

  const showArtifact = artifact !== null

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

      <ResizablePanelGroup key={panelGroupKey} orientation="horizontal" className="flex-1 min-w-0">
        <ResizablePanel defaultSize={showArtifact ? 60 : 100} minSize={30}>
          <div className="flex h-full flex-col overflow-hidden">
            {children && (
              <div className="border-b border-border overflow-y-auto max-h-[55%]">{children}</div>
            )}
            <div className="flex-1 min-h-0">
              <AgentChat
                key={chatKey}
                onArtifact={handleArtifact}
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

        {showArtifact && (
          <>
            <ResizableHandle
              withHandle
              className="bg-border hover:bg-primary/40 transition-colors"
            />
            <ResizablePanel defaultSize={40} minSize={20} maxSize={70}>
              <ArtifactPanel artifact={artifact} onClose={handleCloseArtifact} />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  )
}
