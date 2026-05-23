import type { HypoRisk } from '@t1copilot/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export interface WorkoutCorrelationCardProps {
  id: string
  title: string
  discipline: string
  startTime: string
  durationSeconds: number
  outputWatts: number | null
  glucoseDelta: number | null
  dropRate: number | null
  hypoRisk: HypoRisk
  glucosePreWorkout: number | null
  glucoseDuringWorkout: number | null
  glucosePostWorkout: number | null
  notes: string | null
}

const RISK_STYLES: Record<string, string> = {
  none: 'text-[#a3a3a3] border-[#a3a3a3]/40 bg-[#a3a3a3]/10',
  low: 'text-[#22c55e] border-[#22c55e]/40 bg-[#22c55e]/10',
  moderate: 'text-[#f59e0b] border-[#f59e0b]/40 bg-[#f59e0b]/10',
  high: 'text-[#ef4444] border-[#ef4444]/40 bg-[#ef4444]/10',
}

function hoursAgoFromStartTime(startTime: string): number {
  const elapsedMs = Date.now() - new Date(startTime).getTime()
  return Math.max(0, Math.floor(elapsedMs / (60 * 60 * 1000)))
}

export function WorkoutCorrelationCard({
  title,
  discipline,
  startTime,
  durationSeconds,
  outputWatts,
  glucoseDelta,
  hypoRisk,
}: WorkoutCorrelationCardProps) {
  const hoursAgo = hoursAgoFromStartTime(startTime)
  const durationMinutes = Math.round(durationSeconds / 60)

  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">{String(hoursAgo)}h ago</p>
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground capitalize">{discipline}</p>
            <p className="text-xs text-muted-foreground">
              {String(durationMinutes)} min
              {outputWatts !== null ? ` · ${String(outputWatts)} W avg` : ''}
            </p>
          </div>
          <Badge variant="outline" className={`text-[10px] shrink-0 ${RISK_STYLES[hypoRisk]}`}>
            {hypoRisk.toUpperCase()} RISK
          </Badge>
        </div>
        {glucoseDelta !== null && (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-2xl font-bold text-foreground tabular-nums">
              {glucoseDelta <= 0 ? '-' : '+'}
              {String(Math.abs(glucoseDelta))}
            </span>
            <span className="text-xs text-muted-foreground">mg/dL change</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
