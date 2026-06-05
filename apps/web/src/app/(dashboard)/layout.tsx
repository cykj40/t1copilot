export const dynamic = 'force-dynamic'

import { ThreePanelLayout } from '@/components/layout/ThreePanelLayout'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ThreePanelLayout>{children}</ThreePanelLayout>
}
