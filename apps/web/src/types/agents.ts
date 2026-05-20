export type AgentName = 'Glucose' | 'Exercise' | 'Modeling' | 'Logger' | 'Insight'

export type McpServerName = 'Dexcom' | 'Peloton'

export type McpServerStatus = 'connected' | 'disconnected' | 'error'

export interface AgentStatus {
  name: AgentName
  active: boolean
  lastRun?: string
}

export interface McpServer {
  name: McpServerName
  status: McpServerStatus
  url: string
}
