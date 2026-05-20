'use client'

import { X } from 'lucide-react'
import { ArtifactRouter } from '@/components/artifacts/ArtifactRouter'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ArtifactData } from '@/types/artifacts'

interface ArtifactPanelProps {
  artifact: ArtifactData | null
  pageContent: React.ReactNode
  onClose: () => void
}

export function ArtifactPanel({ artifact, pageContent, onClose }: ArtifactPanelProps) {
  const hasArtifact = artifact !== null

  return (
    <div className="flex h-full flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="flex h-10 items-center justify-between border-b border-border px-4 shrink-0">
        <span className="text-xs font-medium text-muted-foreground">
          {hasArtifact ? 'Artifact' : 'Context'}
        </span>
        {hasArtifact && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {hasArtifact ? (
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-3 p-3">
            <ArtifactRouter artifact={artifact} />
          </div>
        </ScrollArea>
      ) : (
        <ScrollArea className="flex-1">{pageContent}</ScrollArea>
      )}
    </div>
  )
}
