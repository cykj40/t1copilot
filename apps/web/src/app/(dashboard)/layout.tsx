export const dynamic = 'force-dynamic'

import { ThreePanelLayout } from '@/components/layout/ThreePanelLayout'
import { getLatestGlucose } from '@/lib/dexcom-mcp'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let dexcomConnected = false
  try {
    await getLatestGlucose()
    dexcomConnected = true
  } catch {
    // Dexcom MCP unreachable — degrade gracefully
  }

  return <ThreePanelLayout dexcomConnected={dexcomConnected}>{children}</ThreePanelLayout>
}
