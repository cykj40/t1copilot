import { GlucoseCard } from '@/components/glucose/GlucoseCard'
import { TrendChart } from '@/components/glucose/TrendChart'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { PLACEHOLDER_GLUCOSE } from '@/lib/placeholder'

const DATE_RANGES = ['24h', '7d', '14d', '30d'] as const

const MOCK_TREND = Array.from({ length: 48 }, (_, i) => ({
  time: `${String(Math.floor(i / 2))}:${i % 2 === 0 ? '00' : '30'}`,
  value: 115 + Math.sin(i * 0.6) * 35 + Math.random() * 10,
}))

export default function GlucosePage() {
  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h1 className="text-sm font-semibold text-foreground">Glucose History</h1>
        <p className="text-xs text-muted-foreground mt-0.5">CGM data and trend analysis.</p>
      </div>

      {/* Date range selector (placeholder — no interactivity yet) */}
      <div className="flex gap-1">
        {DATE_RANGES.map((range, i) => (
          <span
            key={range}
            className="rounded-md px-3 py-1 text-xs font-medium transition-colors"
            style={{
              backgroundColor: i === 0 ? '#1a1a1e' : 'transparent',
              color: i === 0 ? '#e5e5e5' : '#6b6b6b',
              border: '1px solid',
              borderColor: i === 0 ? '#3a3a3e' : 'transparent',
            }}
          >
            {range}
          </span>
        ))}
      </div>

      <GlucoseCard
        value={PLACEHOLDER_GLUCOSE.value}
        trend={PLACEHOLDER_GLUCOSE.trend}
        timestamp={PLACEHOLDER_GLUCOSE.timestamp}
      />

      {/* Main chart placeholder */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-1 pt-3 px-4">
          <p className="text-xs text-muted-foreground">Glucose trend — last 24h</p>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <TrendChart data={MOCK_TREND} height={200} />
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Average', value: '138', unit: 'mg/dL' },
          { label: 'High', value: '214', unit: 'mg/dL' },
          { label: 'Low', value: '68', unit: 'mg/dL' },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="pt-3 pb-2 px-3">
              <p className="text-[10px] text-muted-foreground mb-0.5">{stat.label}</p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-lg font-bold tabular-nums text-foreground">{stat.value}</span>
                <span className="text-[10px] text-muted-foreground">{stat.unit}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
