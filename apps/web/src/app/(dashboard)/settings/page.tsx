import { getMcpServerHealth } from '@/app/api/health/route'
import { MemoryViewer } from '@/components/settings/MemoryViewer'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { PLACEHOLDER_BASELINE } from '@/lib/placeholder'
import type { McpServerStatus } from '@/types/agents'

interface ParamRowProps {
  label: string
  value: string
  unit: string
  description: string
}

function ParamRow({ label, value, unit, description }: ParamRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div>
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="flex items-baseline gap-1 shrink-0 ml-4">
        <span className="font-bold tabular-nums text-foreground text-sm">{value}</span>
        <span className="text-[10px] text-muted-foreground">{unit}</span>
      </div>
    </div>
  )
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

      {/* Baseline parameters — read-only */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-foreground">Baseline Parameters</p>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              Read-only
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Set by your care team. Changes require clinical approval.
          </p>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <ParamRow
            label="Insulin Sensitivity Factor (ISF)"
            value={String(PLACEHOLDER_BASELINE.isf)}
            unit="mg/dL per unit"
            description="How much 1 unit of insulin lowers glucose"
          />
          <ParamRow
            label="Insulin-to-Carb Ratio (ICR)"
            value={String(PLACEHOLDER_BASELINE.icr)}
            unit="g per unit"
            description="Grams of carbs covered by 1 unit"
          />
          <ParamRow
            label="Basal Rate"
            value={String(PLACEHOLDER_BASELINE.basalUnitsPerDay)}
            unit="units/day"
            description="Total daily basal insulin"
          />
        </CardContent>
      </Card>

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
