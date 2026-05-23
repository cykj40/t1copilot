'use client'

import { useEffect, useState } from 'react'
import { useGroupRef } from 'react-resizable-panels'
import { AgentChat } from '@/components/chat/AgentChat'
import { ArtifactPanel } from '@/components/layout/ArtifactPanel'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { useConversations } from '@/hooks/useConversations'
import { cn } from '@/lib/utils'
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
  const groupRef = useGroupRef()
  const { conversations, createConversation, updateConversation, deleteConversation } =
    useConversations()

  const showArtifact = artifact !== null

  // defaultSize only applies on mount — push layout when artifact opens/closes
  useEffect(() => {
    groupRef.current?.setLayout(
      showArtifact ? { main: 62, artifact: 38 } : { main: 100, artifact: 0 },
    )
  }, [showArtifact, groupRef])

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
        onToggle={() => setSidebarCollapsed((v) => !v)}
        dexcomConnected={dexcomConnected}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onNewConversation={handleNewConversation}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
      />
      <ResizablePanelGroup
        groupRef={groupRef}
        orientation="horizontal"
        className="flex-1 min-w-0"
        defaultLayout={{ main: 100, artifact: 0 }}
      >
        <ResizablePanel id="main" defaultSize={100} minSize={35}>
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
          className={cn(
            'bg-border hover:bg-primary/40 transition-colors',
            !showArtifact && 'hidden',
          )}
        />

        <ResizablePanel
          id="artifact"
          defaultSize={0}
          minSize={showArtifact ? 25 : 0}
          maxSize={55}
          className={!showArtifact ? 'hidden' : ''}
        >
          {artifact !== null && (
            <ArtifactPanel artifact={artifact} onClose={() => setArtifact(null)} />
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
