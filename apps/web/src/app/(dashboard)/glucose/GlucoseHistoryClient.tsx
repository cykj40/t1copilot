'use client'

import { useState, useTransition } from 'react'
import { TrendChart } from '@/components/glucose/TrendChart'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { DexcomReading } from '@/lib/dexcom-mcp'

const DATE_RANGES = ['24h', '7d', '14d', '30d'] as const
type DateRange = (typeof DATE_RANGES)[number]

interface GlucoseHistoryClientProps {
  initialReadings: DexcomReading[]
}

function toChartData(readings: DexcomReading[]) {
  return readings.map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    value: r.value,
  }))
}

export function GlucoseHistoryClient({ initialReadings }: GlucoseHistoryClientProps) {
  const [activeRange, setActiveRange] = useState<DateRange>('24h')
  const [readings, setReadings] = useState(initialReadings)
  const [, startTransition] = useTransition()

  async function handleRangeChange(range: DateRange) {
    setActiveRange(range)
    startTransition(async () => {
      try {
        const msMap: Record<DateRange, number> = {
          '24h': 24 * 60 * 60 * 1000,
          '7d': 7 * 24 * 60 * 60 * 1000,
          '14d': 14 * 24 * 60 * 60 * 1000,
          '30d': 30 * 24 * 60 * 60 * 1000,
        }
        const now = new Date()
        const start = new Date(now.getTime() - msMap[range]).toISOString()
        const res = await fetch(
          `/api/glucose-range?start=${encodeURIComponent(start)}&end=${encodeURIComponent(now.toISOString())}`,
        )
        if (res.ok) {
          const data = (await res.json()) as { readings: DexcomReading[] }
          setReadings(data.readings)
        }
      } catch (error) {
        console.error('[GlucoseHistoryClient] range fetch failed:', error)
      }
    })
  }

  const chartData = toChartData(readings)

  return (
    <>
      {/* Date range selector */}
      <div className="flex gap-1">
        {DATE_RANGES.map((range) => (
          <button
            key={range}
            type="button"
            onClick={() => void handleRangeChange(range)}
            className="rounded-md px-3 py-1 text-xs font-medium transition-colors"
            style={{
              backgroundColor: range === activeRange ? '#1a1a1e' : 'transparent',
              color: range === activeRange ? '#e5e5e5' : '#6b6b6b',
              border: '1px solid',
              borderColor: range === activeRange ? '#3a3a3e' : 'transparent',
            }}
          >
            {range}
          </button>
        ))}
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-1 pt-3 px-4">
          <p className="text-xs text-muted-foreground">Glucose trend — last {activeRange}</p>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          {chartData.length > 0 ? (
            <TrendChart data={chartData} height={200} />
          ) : (
            <p className="text-xs text-muted-foreground py-8 text-center">
              No readings in this range
            </p>
          )}
        </CardContent>
      </Card>
    </>
  )
}
