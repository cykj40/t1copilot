import { getBaselineParameters } from '@t1copilot/mcp-clients'
import { BaselineParametersForm } from '@/components/settings/BaselineParametersForm'
import { MemoryViewer } from '@/components/settings/MemoryViewer'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { getMcpServerHealth } from '@/lib/mcp-health'
import type { McpServerStatus } from '@/types/agents'

async function BaselineParametersSection() {
  try {
    const parameters = await getBaselineParameters()
    return <BaselineParametersForm initialParameters={parameters} />
  } catch {
    return (
      <Card className="bg-card border-border">
        <CardContent className="px-4 py-6">
          <p className="text-xs text-muted-foreground text-center">Could not load parameters</p>
        </CardContent>
      </Card>
    )
  }
}

export default async function SettingsPage() {
  const health = await getMcpServerHealth()

  const mcpServers: Array<{ name: string; url: string; status: McpServerStatus }> = [
    {
      name: 'Dexcom CGM',
      url: 'dexcom-mcp-server.fly.dev',
      status: health.dexcom,
    },
    {
      name: 'Peloton',
      url: 'peloton-mcp-server.fly.dev',
      status: health.peloton,
    },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h1 className="text-sm font-semibold text-foreground">Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Baseline parameters and MCP server status.
        </p>
      </div>

      <BaselineParametersSection />

      {/* MCP server status */}
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

      <MemoryViewer />

      <p className="text-[10px] text-muted-foreground/50 text-center">
        ⚠️ T1Copilot provides analysis only. All treatment decisions are yours.
      </p>
    </div>
  )
}
