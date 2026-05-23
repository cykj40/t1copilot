import { z } from 'zod'

// ── Glucose ──────────────────────────────────────────────────────────────────

export const GlucoseUnitSchema = z.enum(['mg/dL', 'mmol/L'])
export type GlucoseUnit = z.infer<typeof GlucoseUnitSchema>

export const TrendArrowSchema = z.enum([
  'NONE',
  'DOUBLE_UP',
  'SINGLE_UP',
  'FORTY_FIVE_UP',
  'FLAT',
  'FORTY_FIVE_DOWN',
  'SINGLE_DOWN',
  'DOUBLE_DOWN',
  'NOT_COMPUTABLE',
  'RATE_OUT_OF_RANGE',
])
export type TrendArrow = z.infer<typeof TrendArrowSchema>

export const GlucoseReadingSchema = z.object({
  recordId: z.string(),
  systemTime: z.string().datetime(),
  displayTime: z.string().datetime(),
  value: z.number().positive(),
  unit: GlucoseUnitSchema,
  trend: TrendArrowSchema,
  trendRate: z.number().nullable(),
})
export type GlucoseReading = z.infer<typeof GlucoseReadingSchema>

// ── Insulin ───────────────────────────────────────────────────────────────────

export const InsulinTypeSchema = z.enum(['rapid', 'long', 'correction'])
export type InsulinType = z.infer<typeof InsulinTypeSchema>

export const InsulinEventSchema = z.object({
  id: z.string(),
  timestamp: z.string().datetime(),
  units: z.number().positive(),
  insulinType: InsulinTypeSchema,
  note: z.string().optional(),
})
export type InsulinEvent = z.infer<typeof InsulinEventSchema>

// ── Carbs ─────────────────────────────────────────────────────────────────────

export const CarbEventSchema = z.object({
  id: z.string(),
  timestamp: z.string().datetime(),
  grams: z.number().nonnegative(),
  note: z.string().optional(),
})
export type CarbEvent = z.infer<typeof CarbEventSchema>

// ── Exercise ──────────────────────────────────────────────────────────────────

export const ExerciseEventSchema = z.object({
  id: z.string(),
  timestamp: z.string().datetime(),
  durationMinutes: z.number().positive(),
  type: z.string(),
  intensityPercent: z.number().min(0).max(100).nullable(),
  source: z.enum(['peloton', 'apple_health', 'manual']),
})
export type ExerciseEvent = z.infer<typeof ExerciseEventSchema>

// ── Peloton / Exercise ────────────────────────────────────────────────────────

export interface GlucoseWindow {
  timestamp: string
  value: number
  trend?: string
}

export type HypoRisk = 'none' | 'low' | 'moderate' | 'high'

export interface WorkoutCorrelation {
  id: string
  discipline: string
  durationMinutes: number
  startTime: string
  hoursAgo: number
  glucoseDropMgdl: number
  hypoRisk: HypoRisk
  preWorkoutGlucose?: number
  postWorkoutGlucose?: number
  glucoseReadings?: GlucoseWindow[]
}

export interface DisciplineInsight {
  discipline: string
  workoutCount: number
  avgGlucoseDrop: number
  avgHypoRisk: HypoRisk
}

// ── Agent ─────────────────────────────────────────────────────────────────────

export const AgentRecommendationSchema = z.object({
  id: z.string(),
  createdAt: z.string().datetime(),
  agentId: z.string(),
  summary: z.string(),
  detail: z.string(),
  confidence: z.number().min(0).max(1),
  requiresApproval: z.boolean(),
  approved: z.boolean().nullable(),
  approvedAt: z.string().datetime().nullable(),
})
export type AgentRecommendation = z.infer<typeof AgentRecommendationSchema>
