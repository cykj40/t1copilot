import type { TrendArrow } from '@t1copilot/types'
import { classifyGlucose } from '@t1copilot/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface GlucoseCardProps {
  value: number | null
  trend: TrendArrow | null
  timestamp: string | null
  error?: string
}

const TREND_ARROWS: Record<TrendArrow, string> = {
  NONE: '—',
  DOUBLE_UP: '↑↑',
  SINGLE_UP: '↑',
  FORTY_FIVE_UP: '↗',
  FLAT: '→',
  FORTY_FIVE_DOWN: '↘',
  SINGLE_DOWN: '↓',
  DOUBLE_DOWN: '↓↓',
  NOT_COMPUTABLE: '?',
  RATE_OUT_OF_RANGE: '±',
}

const ZONE_COLORS = {
  hypoCritical: {
    text: 'text-red-400',
    badge: 'border-red-400/40 bg-red-400/10 text-red-400',
    label: 'CRITICAL LOW',
  },
  hypo: {
    text: 'text-orange-400',
    badge: 'border-orange-400/40 bg-orange-400/10 text-orange-400',
    label: 'LOW',
  },
  inRange: {
    text: 'text-green-400',
    badge: 'border-green-400/40 bg-green-400/10 text-green-400',
    label: 'IN RANGE',
  },
  hyperMild: {
    text: 'text-yellow-400',
    badge: 'border-yellow-400/40 bg-yellow-400/10 text-yellow-400',
    label: 'HIGH',
  },
  hyperCritical: {
    text: 'text-red-400',
    badge: 'border-red-400/40 bg-red-400/10 text-red-400',
    label: 'CRITICAL HIGH',
  },
} as const

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1) return 'just now'
  if (diff < 60) return `${String(diff)} min ago`
  const hrs = Math.floor(diff / 60)
  return `${String(hrs)}h ago`
}

export function GlucoseCard({ value, trend, timestamp, error }: GlucoseCardProps) {
  if (value === null || trend === null || timestamp === null) {
    return (
      <Card className="bg-card border-border opacity-60">
        <CardContent className="pt-4 pb-3 px-4">
          <p className="text-xs text-muted-foreground mb-1">Current Glucose</p>
          <p className="text-sm text-muted-foreground">{error ?? 'CGM offline'}</p>
        </CardContent>
      </Card>
    )
  }

  const zone = classifyGlucose(value)
  const colors = ZONE_COLORS[zone]

  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Current Glucose</p>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-3xl font-bold tabular-nums ${colors.text}`}>
                {String(value)}
              </span>
              <span className={`text-xl ${colors.text}`}>{TREND_ARROWS[trend]}</span>
              <span className="text-xs text-muted-foreground">mg/dL</span>
            </div>
          </div>
          <Badge variant="outline" className={`text-[10px] ${colors.badge}`}>
            {colors.label}
          </Badge>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">{relativeTime(timestamp)}</p>
      </CardContent>
    </Card>
  )
}
