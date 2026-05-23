'use client'

import { GlucoseCard } from '@/components/glucose/GlucoseCard'
import { TrendChart } from '@/components/glucose/TrendChart'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { mapDexcomTrend } from '@/lib/dexcom-mcp'
import { getTrendArrow } from '@/lib/glucose-utils'
import type { RenderGlucoseChartArtifact } from '@/types/artifacts'

interface GlucoseChartArtifactProps {
  artifact: RenderGlucoseChartArtifact
}

export function GlucoseChartArtifact({ artifact }: GlucoseChartArtifactProps) {
  const { readings, statistics, timeRange, title } = artifact

  const chartData = (readings ?? []).map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    value: r.value,
  }))

  const latest = readings?.at(-1)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[#a3a3a3]">{title}</p>
        <span className="rounded-full bg-[#22c55e]/10 px-2 py-0.5 text-[10px] font-medium text-[#22c55e]">
          {timeRange}
        </span>
      </div>

      <GlucoseCard
        value={latest?.value ?? null}
        trend={latest ? mapDexcomTrend(latest.trend) : null}
        timestamp={latest?.timestamp ?? null}
      />

      <Card className="bg-[#111113] border-[#232326]">
        <CardHeader className="pb-1 pt-3 px-4">
          <p className="text-xs text-[#a3a3a3]">Trend ({timeRange})</p>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          {chartData.length > 0 ? (
            <TrendChart data={chartData} height={140} />
          ) : (
            <p className="text-xs text-[#a3a3a3] py-6 text-center">No readings in this range</p>
          )}
        </CardContent>
      </Card>

      {statistics && (
        <Card className="bg-[#111113] border-[#232326]">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-[#a3a3a3] mb-1">Time in Range</p>
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-3xl text-[#22c55e] tabular-nums">
                {String(statistics.timeInRange)}
              </span>
              <span className="text-sm text-[#a3a3a3]">%</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-[#232326] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#22c55e]"
                style={{ width: `${String(statistics.timeInRange)}%` }}
              />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div>
                <p className="text-[10px] text-[#a3a3a3]">Avg</p>
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {String(statistics.average)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#a3a3a3]">High</p>
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {String(statistics.max)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#a3a3a3]">Low</p>
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {String(statistics.min)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {latest && (
        <p className="text-[10px] text-[#a3a3a3] text-center">
          Latest: {String(latest.value)} mg/dL {getTrendArrow(latest.trend)} ·{' '}
          {new Date(latest.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}

      <p className="text-[10px] text-[#6b6b6b] text-center">
        ⚠️ T1Copilot provides analysis only. All treatment decisions are yours.
      </p>
    </div>
  )
}
