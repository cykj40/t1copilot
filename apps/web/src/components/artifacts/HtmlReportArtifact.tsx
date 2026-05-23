'use client'

import type { RenderHtmlReportArtifact } from '@/types/artifacts'

export function HtmlReportArtifact({ artifact }: { artifact: RenderHtmlReportArtifact }) {
  return (
    <iframe
      srcDoc={artifact.html}
      className="w-full rounded-md border border-[#1e1e22]"
      style={{ height: '480px' }}
      sandbox="allow-scripts"
      title={artifact.title}
    />
  )
}
