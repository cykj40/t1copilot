import { BaselineParametersForm } from '@/components/settings/BaselineParametersForm'
import { McpServerStatusCard } from '@/components/settings/McpServerStatusCard'
import { MemoryViewer } from '@/components/settings/MemoryViewer'

export default async function SettingsPage() {
  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h1 className="text-sm font-semibold text-foreground">Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Baseline parameters and MCP server status.
        </p>
      </div>

      <BaselineParametersForm />

      {/* MCP server status */}
      <McpServerStatusCard />

      <MemoryViewer />

      <p className="text-[10px] text-muted-foreground/50 text-center">
        ⚠️ T1Copilot provides analysis only. All treatment decisions are yours.
      </p>
    </div>
  )
}
