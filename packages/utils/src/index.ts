// ── Glucose unit conversion ───────────────────────────────────────────────────

export function mgdlToMmol(mgdl: number): number {
  return Math.round((mgdl / 18.018) * 10) / 10
}

export function mmolToMgdl(mmol: number): number {
  return Math.round(mmol * 18.018)
}

// ── Range helpers ─────────────────────────────────────────────────────────────

export const GLUCOSE_RANGES = {
  hypoCritical: { min: 0, max: 54 },
  hypo: { min: 54, max: 70 },
  inRange: { min: 70, max: 180 },
  hyperMild: { min: 180, max: 250 },
  hyperCritical: { min: 250, max: Infinity },
} as const

export type GlucoseZone = keyof typeof GLUCOSE_RANGES

export function classifyGlucose(mgdl: number): GlucoseZone {
  if (mgdl < 54) return 'hypoCritical'
  if (mgdl < 70) return 'hypo'
  if (mgdl <= 180) return 'inRange'
  if (mgdl <= 250) return 'hyperMild'
  return 'hyperCritical'
}

/**
 * Formats an absolute ISO timestamp for a user-facing model response without
 * requiring the model to perform UTC offset or DST arithmetic itself.
 */
export function formatLocalTimestamp(timestamp: string, timeZone: string): string {
  const date = new Date(timestamp)
  const dateParts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'long',
    day: 'numeric',
  }).format(date)
  const timeParts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).format(date)

  return `${dateParts}, ${timeParts}`
}
