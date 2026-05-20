import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { RenderWeeklySummaryArtifact } from '@/types/artifacts'

interface WeeklySummaryArtifactProps {
  artifact: RenderWeeklySummaryArtifact
}

const WEEKLY_STATS = [
  { label: 'Time in Range', value: '74%', delta: '+8%', positive: true },
  { label: 'Avg Glucose', value: '138', unit: 'mg/dL', delta: '-4', positive: true },
  { label: 'Low Events', value: '2', delta: '-1', positive: true },
  { label: 'High Events', value: '5', delta: '+1', positive: false },
]

const WEEKLY_INSIGHTS = [
  'Post-ride lows appearing 2–4h after cycling sessions',
  'Morning baseline trending 12 mg/dL higher vs. prior week',
  'Time in range improved across all 7 days',
]

export function WeeklySummaryArtifact({ artifact }: WeeklySummaryArtifactProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[#a3a3a3]">Weekly Summary</p>
        <span className="text-[10px] text-[#6b6b6b]">{artifact.weekLabel}</span>
      </div>

      {/* Key stats grid */}
      <div className="grid grid-cols-2 gap-2">
        {WEEKLY_STATS.map((stat) => (
          <Card key={stat.label} className="bg-[#111113] border-[#232326]">
            <CardContent className="pt-3 pb-2 px-3">
              <p className="text-[10px] text-[#6b6b6b] mb-0.5">{stat.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold tabular-nums text-[#e5e5e5]">{stat.value}</span>
                {stat.unit !== undefined && (
                  <span className="text-[10px] text-[#6b6b6b]">{stat.unit}</span>
                )}
              </div>
              <span
                className="text-[10px] font-medium"
                style={{ color: stat.positive ? '#22c55e' : '#ef4444' }}
              >
                {stat.delta} vs last week
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insights */}
      <Card className="bg-[#111113] border-[#232326]">
        <CardHeader className="pb-2 pt-3 px-4">
          <p className="text-xs text-[#a3a3a3]">Key patterns</p>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <ul className="flex flex-col gap-2">
            {WEEKLY_INSIGHTS.map((insight) => (
              <li key={insight} className="flex items-start gap-2 text-xs text-[#a3a3a3]">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[#6b6b6b]" />
                {insight}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
