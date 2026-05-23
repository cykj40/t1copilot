import { callDexcomTool } from '@t1copilot/mcp-clients'
import type { TrendArrow } from '@t1copilot/types'
import { z } from 'zod'

// ── Zod schemas matching actual Dexcom MCP server response shapes ─────────────

const DexcomStatisticsSchema = z.object({
  average: z.number(),
  standardDeviation: z.number(),
  min: z.number(),
  max: z.number(),
  timeInRange: z.number(),
  timeBelowRange: z.number(),
  timeAboveRange: z.number(),
  readingCount: z.number(),
  coefficientOfVariation: z.number(),
})

export const LatestGlucoseSchema = z.object({
  value: z.number(),
  unit: z.string(),
  trend: z.string(),
  trendDescription: z.string(),
  timestamp: z.string(),
  ageMinutes: z.number(),
  source: z.string(),
})

export const DexcomReadingSchema = z.object({
  value: z.number(),
  trend: z.string(),
  timestamp: z.string(),
})

export const GlucoseRangeSchema = z.object({
  timeRange: z.object({ start: z.string(), end: z.string() }),
  readingCount: z.number(),
  statistics: DexcomStatisticsSchema,
  readings: z.array(DexcomReadingSchema),
})

export const DailySummarySchema = z.object({
  date: z.string(),
  statistics: DexcomStatisticsSchema,
  readingCount: z.number(),
})

export type LatestGlucose = z.infer<typeof LatestGlucoseSchema>
export type DexcomReading = z.infer<typeof DexcomReadingSchema>
export type GlucoseRange = z.infer<typeof GlucoseRangeSchema>
export type DailySummary = z.infer<typeof DailySummarySchema>
export type DexcomStatistics = z.infer<typeof DexcomStatisticsSchema>

// ── Trend mapping: Dexcom camelCase → app TrendArrow enum ────────────────────
const DEXCOM_TREND_MAP: Record<string, TrendArrow> = {
  none: 'NONE',
  doubleUp: 'DOUBLE_UP',
  singleUp: 'SINGLE_UP',
  fortyFiveUp: 'FORTY_FIVE_UP',
  flat: 'FLAT',
  fortyFiveDown: 'FORTY_FIVE_DOWN',
  singleDown: 'SINGLE_DOWN',
  doubleDown: 'DOUBLE_DOWN',
  notComputable: 'NOT_COMPUTABLE',
  rateOutOfRange: 'RATE_OUT_OF_RANGE',
}

export function mapDexcomTrend(dexcomTrend: string): TrendArrow {
  return DEXCOM_TREND_MAP[dexcomTrend] ?? 'NONE'
}

// ── Typed MCP call wrappers ───────────────────────────────────────────────────

export async function getLatestGlucose(): Promise<LatestGlucose> {
  const raw = await callDexcomTool('get_latest_glucose')
  return LatestGlucoseSchema.parse(raw)
}

export async function getGlucoseRange(start: string, end: string): Promise<GlucoseRange> {
  const raw = await callDexcomTool('get_glucose_range', { start_time: start, end_time: end })
  return GlucoseRangeSchema.parse(raw)
}

export async function getDailySummary(date?: string): Promise<DailySummary> {
  const raw = await callDexcomTool('get_daily_summary', date !== undefined ? { date } : {})
  return DailySummarySchema.parse(raw)
}
