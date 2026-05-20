import type { TrendArrow } from '@t1copilot/types'

export const PLACEHOLDER_GLUCOSE = {
  value: 142,
  trend: 'FORTY_FIVE_UP' as TrendArrow,
  timestamp: new Date(Date.now() - 5 * 60_000).toISOString(),
  unit: 'mg/dL',
}

export const PLACEHOLDER_TIR = {
  percent: 74,
  period: 'Last 7 days',
}

export const PLACEHOLDER_LAST_WORKOUT = {
  name: 'Cycling',
  durationMinutes: 45,
  hoursAgo: 2,
  glucoseDropMgdl: 28,
  hypoRisk: 'moderate' as const,
}

export const PLACEHOLDER_RECENT_EVENTS = [
  {
    id: 'e1',
    type: 'insulin' as const,
    description: '3u rapid',
    minutesAgo: 45,
  },
  {
    id: 'e2',
    type: 'carbs' as const,
    description: '32g',
    minutesAgo: 60,
  },
]

export const PLACEHOLDER_BASELINE = {
  isf: 40,
  icr: 10,
  basalUnitsPerDay: 18,
}
