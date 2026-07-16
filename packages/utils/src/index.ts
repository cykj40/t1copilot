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
