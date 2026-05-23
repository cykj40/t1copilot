export const dynamic = 'force-dynamic'

import { GlucoseCard } from '@/components/glucose/GlucoseCard'
import { Card, CardContent } from '@/components/ui/card'
import { getGlucoseRange, mapDexcomTrend } from '@/lib/dexcom-mcp'
import { GlucoseHistoryClient } from './GlucoseHistoryClient'

export default async function GlucosePage() {
  const now = new Date()
  const start24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

  const [rangeResult] = await Promise.allSettled([getGlucoseRange(start24h, now.toISOString())])

  if (rangeResult.status === 'rejected') {
    console.error('[GlucosePage] getGlucoseRange failed:', rangeResult.reason)
  }

  const range = rangeResult.status === 'fulfilled' ? rangeResult.value : null
  const statistics = range?.statistics ?? null

  const latest = range?.readings.at(-1)

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h1 className="text-sm font-semibold text-foreground">Glucose History</h1>
        <p className="text-xs text-muted-foreground mt-0.5">CGM data and trend analysis.</p>
      </div>

      <GlucoseCard
        value={latest?.value ?? null}
        trend={latest ? mapDexcomTrend(latest.trend) : null}
        timestamp={latest?.timestamp ?? null}
        {...(rangeResult.status === 'rejected' ? { error: 'CGM offline' } : {})}
      />

      {/* Interactive chart — client component handles date range switching */}
      <GlucoseHistoryClient initialReadings={range?.readings ?? []} />

      {/* Today's stats */}
      {statistics && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Average', value: String(statistics.average), unit: 'mg/dL' },
            { label: 'High', value: String(statistics.max), unit: 'mg/dL' },
            { label: 'Low', value: String(statistics.min), unit: 'mg/dL' },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="pt-3 pb-2 px-3">
                <p className="text-[10px] text-muted-foreground mb-0.5">{stat.label}</p>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-lg font-bold tabular-nums text-foreground">
                    {stat.value}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{stat.unit}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {statistics && (
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground mb-1">Time in Range (today)</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-[#22c55e] tabular-nums">
                {String(statistics.timeInRange)}
              </span>
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-[#22c55e]"
                style={{ width: `${String(statistics.timeInRange)}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {String(statistics.readingCount)} readings · CV{' '}
              {String(statistics.coefficientOfVariation)}%
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
