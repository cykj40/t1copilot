'use client'

import ReactMarkdown from 'react-markdown'
import type { RenderMarkdownDocArtifact } from '@/types/artifacts'

export function MarkdownDocArtifact({ artifact }: { artifact: RenderMarkdownDocArtifact }) {
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <ReactMarkdown>{artifact.content}</ReactMarkdown>
    </div>
  )
}
