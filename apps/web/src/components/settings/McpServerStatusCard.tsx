'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useServerHealth } from '@/hooks/useServerHealth'

export function McpServerStatusCard() {
  const { dexcom, peloton } = useServerHealth()

  const mcpServers = [
    { name: 'Dexcom CGM', url: 'dexcom-mcp-server.fly.dev', status: dexcom },
    { name: 'Peloton', url: 'peloton-mcp-server.fly.dev', status: peloton },
  ]

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2 pt-3 px-4">
        <p className="text-xs font-medium text-foreground">MCP Servers</p>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        {mcpServers.map((server) => (
          <div
            key={server.name}
            className="flex items-center justify-between py-2 border-b border-border last:border-0"
          >
            <div>
              <p className="text-xs font-medium text-foreground">{server.name}</p>
              <p className="text-[10px] text-muted-foreground font-mono">{server.url}</p>
            </div>
            <span className="text-[10px] text-[#6b6b6b]">{server.status}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
