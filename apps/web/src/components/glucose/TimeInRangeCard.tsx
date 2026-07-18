'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import type { DexcomStatistics } from '@/lib/dexcom-mcp'

export function TimeInRangeCard() {
  const [statistics, setStatistics] = useState<DexcomStatistics | null>(null)

  const fetchStatistics = useCallback(async () => {
    const now = new Date()
    const start24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

    try {
      const response = await fetch(
        `/api/glucose-range?start=${encodeURIComponent(start24h)}&end=${encodeURIComponent(now.toISOString())}`,
        { cache: 'no-store' },
      )

      if (response.ok) {
        const data = (await response.json()) as { statistics: DexcomStatistics }
        setStatistics(data.statistics)
      }
    } catch (error) {
      console.error('[TimeInRangeCard] range fetch failed:', error)
    }
  }, [])

  useEffect(() => {
    void fetchStatistics()
  }, [fetchStatistics])

  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-4 pb-3 px-4">
        <p className="text-xs text-muted-foreground mb-1">Time in Range</p>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-[#22c55e] tabular-nums">
            {statistics ? String(statistics.timeInRange) : '—'}
          </span>
          {statistics && <span className="text-sm text-muted-foreground">%</span>}
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-[#22c55e]"
            style={{ width: statistics ? `${String(statistics.timeInRange)}%` : '0%' }}
          />
        </div>
        {statistics && (
          <div className="mt-2 grid grid-cols-3 gap-2">
            <div>
              <p className="text-[10px] text-muted-foreground">Avg</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {String(statistics.average)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">High</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {String(statistics.max)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Low</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {String(statistics.min)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
