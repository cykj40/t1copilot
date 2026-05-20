import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface WorkoutCorrelationCardProps {
  discipline: string
  durationMinutes: number
  hoursAgo: number
  glucoseDropMgdl: number
  hypoRisk: 'low' | 'moderate' | 'high'
}

const RISK_STYLES: Record<string, string> = {
  low: 'text-[#22c55e] border-[#22c55e]/40 bg-[#22c55e]/10',
  moderate: 'text-[#f59e0b] border-[#f59e0b]/40 bg-[#f59e0b]/10',
  high: 'text-[#ef4444] border-[#ef4444]/40 bg-[#ef4444]/10',
}

export function WorkoutCorrelationCard({
  discipline,
  durationMinutes,
  hoursAgo,
  glucoseDropMgdl,
  hypoRisk,
}: WorkoutCorrelationCardProps) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">{String(hoursAgo)}h ago</p>
            <p className="text-sm font-medium text-foreground">{discipline}</p>
            <p className="text-xs text-muted-foreground">{String(durationMinutes)} min</p>
          </div>
          <Badge variant="outline" className={`text-[10px] shrink-0 ${RISK_STYLES[hypoRisk]}`}>
            {hypoRisk.toUpperCase()} RISK
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-2xl font-bold text-foreground tabular-nums">
            -{String(Math.abs(glucoseDropMgdl))}
          </span>
          <span className="text-xs text-muted-foreground">mg/dL avg drop</span>
        </div>
      </CardContent>
    </Card>
  )
}
