'use client'

import {
  Activity,
  Brain,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Dumbbell,
  FlaskConical,
  LayoutDashboard,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AgentStatusBar } from '@/components/shared/AgentStatusBar'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/glucose', label: 'Glucose', icon: Activity },
  { href: '/workout', label: 'Workouts', icon: Dumbbell },
  { href: '/log', label: 'Log Event', icon: ClipboardList },
  { href: '/insights', label: 'Insights', icon: Brain },
  { href: '/research', label: 'Research', icon: FlaskConical },
  { href: '/settings', label: 'Settings', icon: Settings },
]

interface AppSidebarProps {
  collapsed: boolean
  onToggle: () => void
  dexcomConnected: boolean
}

export function AppSidebar({ collapsed, onToggle, dexcomConnected }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <div
      style={{ width: collapsed ? '52px' : '200px', transition: 'width 200ms ease' }}
      className="h-full flex flex-col bg-sidebar border-r border-sidebar-border overflow-hidden shrink-0"
    >
      {/* Logo */}
      <div className="flex h-12 items-center gap-2.5 px-4 border-b border-sidebar-border shrink-0">
        <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground shrink-0">
          T1
        </span>
        {!collapsed && (
          <span className="text-sm font-semibold text-foreground tracking-tight">T1Copilot</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="flex flex-col gap-0.5 px-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)
            const linkClass = cn(
              'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors w-full',
              active
                ? 'bg-primary/15 text-primary font-medium'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              collapsed && 'justify-center',
            )

            return (
              <li key={href}>
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger render={<Link href={href} className={linkClass} />}>
                      <Icon className="h-4 w-4 shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent side="right">{label}</TooltipContent>
                  </Tooltip>
                ) : (
                  <Link href={href} className={linkClass}>
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{label}</span>
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      <Separator className="bg-sidebar-border" />
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 mx-2 mb-2 px-2 py-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors text-xs w-[calc(100%-16px)]"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <>
            <ChevronLeft className="h-3.5 w-3.5 shrink-0" />
            <span>Collapse</span>
          </>
        )}
      </button>
      {!collapsed && <AgentStatusBar dexcomConnected={dexcomConnected} />}
    </div>
  )
}
