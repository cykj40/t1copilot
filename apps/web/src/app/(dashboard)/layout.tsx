export const dynamic = 'force-dynamic'

import { ThreePanelLayout } from '@/components/layout/ThreePanelLayout'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Connectivity check moved to individual pages — avoids triple concurrent MCP connections.
  return <ThreePanelLayout dexcomConnected={true}>{children}</ThreePanelLayout>
}
