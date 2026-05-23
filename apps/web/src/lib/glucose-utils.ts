export type GlucoseStatus = 'critical-low' | 'low' | 'in-range' | 'high' | 'critical-high'

export function getGlucoseStatus(value: number): GlucoseStatus {
  if (value < 54) return 'critical-low'
  if (value < 70) return 'low'
  if (value <= 180) return 'in-range'
  if (value <= 250) return 'high'
  return 'critical-high'
}

// Read-only baseline parameters — never modified by any agent or API call
export const BASELINE_PARAMETERS = {
  isf: 30, // mg/dL per unit
  icr: 4, // grams of carbs per unit
  basalDose: 30, // units per day
} as const

// Trend arrow characters for chart tooltips and display
export function getTrendArrow(dexcomTrend: string): string {
  const map: Record<string, string> = {
    none: '—',
    doubleUp: '↑↑',
    singleUp: '↑',
    fortyFiveUp: '↗',
    flat: '→',
    fortyFiveDown: '↘',
    singleDown: '↓',
    doubleDown: '↓↓',
    notComputable: '—',
    rateOutOfRange: '±',
  }
  return map[dexcomTrend] ?? '—'
}

export function formatReadingAge(ageMinutes: number): string {
  if (ageMinutes < 1) return 'just now'
  if (ageMinutes < 60) return `${Math.round(ageMinutes)}m ago`
  return `${Math.round(ageMinutes / 60)}h ago`
}

// Derive a color hex for chart line segments based on glucose value
export function getValueColor(value: number): string {
  if (value < 70) return '#E24B4A'
  if (value <= 180) return '#1D9E75'
  if (value <= 250) return '#BA7517'
  return '#E24B4A'
}
