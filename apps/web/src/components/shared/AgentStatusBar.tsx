import { Badge } from '@/components/ui/badge'
import type { AgentStatus, McpServer } from '@/types/agents'

const AGENTS: AgentStatus[] = [
  { name: 'Glucose', active: true },
  { name: 'Exercise', active: true },
  { name: 'Modeling', active: false },
  { name: 'Logger', active: true },
  { name: 'Insight', active: true },
]

const MCP_SERVERS: McpServer[] = [
  { name: 'Dexcom', status: 'disconnected', url: 'https://dexcom-mcp-server.fly.dev' },
  { name: 'Peloton', status: 'disconnected', url: 'https://peloton-mcp-server.fly.dev' },
]

const STATUS_COLORS: Record<string, string> = {
  connected: '#22c55e',
  disconnected: '#6b6b6b',
  error: '#ef4444',
}

export function AgentStatusBar() {
  return (
    <div className="flex flex-col gap-2 p-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Agents</p>
      <div className="flex flex-wrap gap-1">
        {AGENTS.map((agent) => (
          <Badge
            key={agent.name}
            variant="outline"
            className={
              agent.active
                ? 'border-primary/40 bg-primary/10 text-primary text-[10px] px-1.5 py-0'
                : 'border-border bg-muted text-muted-foreground text-[10px] px-1.5 py-0'
            }
          >
            <span
              className="mr-1 inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: agent.active ? undefined : '#6b6b6b' }}
              aria-hidden="true"
            />
            {agent.name}
          </Badge>
        ))}
      </div>

      {/* MCP server status — Dexcom & Peloton */}
      <div className="flex flex-col gap-1 mt-1">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          MCP Servers
        </p>
        {MCP_SERVERS.map((server) => (
          <div key={server.name} className="flex items-center gap-1.5">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: STATUS_COLORS[server.status] }}
              aria-hidden="true"
            />
            <p className="text-[10px] text-muted-foreground">
              {server.name}
              <span className="ml-1 text-[#6b6b6b]">·</span>
              <span className="ml-1" style={{ color: STATUS_COLORS[server.status] }}>
                {server.status}
              </span>
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
