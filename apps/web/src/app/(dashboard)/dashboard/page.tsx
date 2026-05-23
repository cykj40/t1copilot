export const dynamic = 'force-dynamic'

import { GlucoseCard } from '@/components/glucose/GlucoseCard'
import { InsightFeed } from '@/components/insights/InsightFeed'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { getLatestGlucose, mapDexcomTrend } from '@/lib/dexcom-mcp'
import { PLACEHOLDER_RECENT_EVENTS } from '@/lib/placeholder'

const EVENT_ICONS: Record<string, string> = {
  insulin: '💉',
  carbs: '🍞',
  exercise: '🏃',
}

export default async function DashboardPage() {
  const latestResult = await Promise.allSettled([getLatestGlucose()])

  const latest = latestResult[0]?.status === 'fulfilled' ? latestResult[0].value : null

  if (latestResult[0]?.status === 'rejected') {
    console.error('[Dashboard] getLatestGlucose failed:', latestResult[0].reason)
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h1 className="text-sm font-semibold text-foreground">Dashboard</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Your glucose, workouts, and insights.
        </p>
      </div>

      <GlucoseCard
        value={latest?.value ?? null}
        trend={latest ? mapDexcomTrend(latest.trend) : null}
        timestamp={latest?.timestamp ?? null}
        {...(latestResult[0]?.status === 'rejected' ? { error: 'CGM offline' } : {})}
      />

      {/* Time in range */}
      <Card className="bg-card border-border">
        <CardContent className="pt-4 pb-3 px-4">
          <p className="text-xs text-muted-foreground mb-1">Time in Range</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-[#22c55e] tabular-nums">—</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-[#22c55e]" style={{ width: '0%' }} />
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">Today</p>
        </CardContent>
      </Card>

      {/* Recent events */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 pt-3 px-4">
          <p className="text-xs text-muted-foreground">Recent events</p>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <ul className="flex flex-col gap-2">
            {PLACEHOLDER_RECENT_EVENTS.map((event) => (
              <li key={event.id} className="flex items-center gap-2">
                <span className="text-sm">{EVENT_ICONS[event.type]}</span>
                <span className="text-xs text-foreground capitalize">{event.type}</span>
                <span className="text-xs text-muted-foreground">{event.description}</span>
                <span className="ml-auto text-[10px] text-muted-foreground/60">
                  {String(event.minutesAgo)}m ago
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <InsightFeed />
    </div>
  )
}
