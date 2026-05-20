import { ThreePanelLayout } from '@/components/layout/ThreePanelLayout'

// Next.js requires layouts to receive children, but the three-panel shell
// owns its own rendering — route pages exist for URL routing only.
export default function DashboardLayout({ children: _children }: { children: React.ReactNode }) {
  return <ThreePanelLayout />
}
