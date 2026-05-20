import { GlucoseCard } from '@/components/glucose/GlucoseCard'
import { TrendChart } from '@/components/glucose/TrendChart'
import { InsightFeed } from '@/components/insights/InsightFeed'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { PLACEHOLDER_GLUCOSE, PLACEHOLDER_RECENT_EVENTS, PLACEHOLDER_TIR } from '@/lib/placeholder'

const MOCK_TREND = Array.from({ length: 24 }, (_, i) => ({
  time: `${String(i)}:00`,
  value: 120 + Math.sin(i * 0.8) * 30 + (i > 18 ? -15 : 0),
}))

const EVENT_ICONS: Record<string, string> = {
  insulin: '💉',
  carbs: '🍞',
  exercise: '🏃',
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h1 className="text-sm font-semibold text-foreground">Dashboard</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Your glucose, workouts, and insights.
        </p>
      </div>

      <GlucoseCard
        value={PLACEHOLDER_GLUCOSE.value}
        trend={PLACEHOLDER_GLUCOSE.trend}
        timestamp={PLACEHOLDER_GLUCOSE.timestamp}
      />

      {/* Time in range */}
      <Card className="bg-card border-border">
        <CardContent className="pt-4 pb-3 px-4">
          <p className="text-xs text-muted-foreground mb-1">Time in Range</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-[#22c55e] tabular-nums">
              {String(PLACEHOLDER_TIR.percent)}
            </span>
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-[#22c55e]"
              style={{ width: `${String(PLACEHOLDER_TIR.percent)}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">{PLACEHOLDER_TIR.period}</p>
        </CardContent>
      </Card>

      {/* 24h trend */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-1 pt-3 px-4">
          <p className="text-xs text-muted-foreground">24h trend</p>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <TrendChart data={MOCK_TREND} height={120} />
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
