import { GlucoseCard } from '@/components/glucose/GlucoseCard'
import { TrendChart } from '@/components/glucose/TrendChart'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { PLACEHOLDER_GLUCOSE, PLACEHOLDER_TIR } from '@/lib/placeholder'
import type { RenderGlucoseChartArtifact } from '@/types/artifacts'

interface GlucoseChartArtifactProps {
  artifact: RenderGlucoseChartArtifact
}

// Placeholder trend data — replaced by real CGM data in Priority 5
const MOCK_TREND = Array.from({ length: 24 }, (_, i) => ({
  time: `${String(i)}:00`,
  value: 120 + Math.sin(i * 0.8) * 30 + (i > 18 ? -20 : 0),
}))

export function GlucoseChartArtifact({ artifact }: GlucoseChartArtifactProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[#a3a3a3]">{artifact.title}</p>
        <span className="rounded-full bg-[#22c55e]/10 px-2 py-0.5 text-[10px] font-medium text-[#22c55e]">
          {artifact.timeRange}
        </span>
      </div>

      <GlucoseCard
        value={PLACEHOLDER_GLUCOSE.value}
        trend={PLACEHOLDER_GLUCOSE.trend}
        timestamp={PLACEHOLDER_GLUCOSE.timestamp}
      />

      <Card className="bg-[#111113] border-[#232326]">
        <CardHeader className="pb-1 pt-3 px-4">
          <p className="text-xs text-[#a3a3a3]">Trend ({artifact.timeRange})</p>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <TrendChart data={MOCK_TREND} height={140} />
        </CardContent>
      </Card>

      <Card className="bg-[#111113] border-[#232326]">
        <CardContent className="pt-4 pb-3 px-4">
          <p className="text-xs text-[#a3a3a3] mb-1">Time in Range</p>
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-3xl text-[#22c55e] tabular-nums">
              {String(PLACEHOLDER_TIR.percent)}
            </span>
            <span className="text-sm text-[#a3a3a3]">%</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-[#232326] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#22c55e]"
              style={{ width: `${String(PLACEHOLDER_TIR.percent)}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-[#a3a3a3]">{PLACEHOLDER_TIR.period}</p>
        </CardContent>
      </Card>
    </div>
  )
}
