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
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { AgentStatusBar } from '@/components/shared/AgentStatusBar'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { StoredConversation } from '@/hooks/useConversations'
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
  conversations: StoredConversation[]
  activeConversationId: string | null
  onNewConversation: () => void
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
}

export function AppSidebar({
  collapsed,
  onToggle,
  conversations,
  activeConversationId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
}: AppSidebarProps) {
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

        {!collapsed && (
          <div className="flex flex-col mt-2 border-t border-sidebar-border pt-2 mx-2">
            <div className="flex items-center justify-between px-2 mb-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Chats
              </p>
              <button
                type="button"
                onClick={onNewConversation}
                className="text-[10px] text-primary hover:text-primary/80 transition-colors"
              >
                + New
              </button>
            </div>
            {conversations.length === 0 ? (
              <p className="text-[10px] text-muted-foreground/40 px-2 py-1">No chats yet</p>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {conversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conv={conv}
                    isActive={conv.id === activeConversationId}
                    onSelect={() => onSelectConversation(conv.id)}
                    onDelete={() => onDeleteConversation(conv.id)}
                  />
                ))}
              </ul>
            )}
          </div>
        )}
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
      {!collapsed && <AgentStatusBar />}
    </div>
  )
}

function ConversationItem({
  conv,
  isActive,
  onSelect,
  onDelete,
}: {
  conv: StoredConversation
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <li
      className="relative flex items-center rounded-md transition-colors group"
      style={{ background: isActive ? 'var(--sidebar-accent)' : 'transparent' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center px-2 py-1.5 text-left"
        onClick={onSelect}
      >
        <span className="text-xs text-muted-foreground truncate flex-1 leading-snug">
          {conv.title}
        </span>
      </button>
      {hovered && (
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 mr-2 text-muted-foreground/50 hover:text-destructive transition-colors"
          aria-label="Delete conversation"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </li>
  )
}
