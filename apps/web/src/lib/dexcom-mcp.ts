import { callDexcomTool, callDexcomToolWithRetry } from '@t1copilot/mcp-clients'
import type { TrendArrow } from '@t1copilot/types'
import { unstable_noStore as noStore } from 'next/cache'
import { cache } from 'react'
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

// get_daily_summary currently returns the same shape as get_latest_glucose.
export const DailySummarySchema = LatestGlucoseSchema

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
// noStore: MCP uses streaming HTTP — Next.js fetch cache aborts those connections.
// cache: dedupe parallel calls within the same RSC request (layout + page).

export const getLatestGlucose = cache(async (): Promise<LatestGlucose> => {
  noStore()
  const raw = await callDexcomTool('get_latest_glucose')
  return LatestGlucoseSchema.parse(raw)
})

export const getGlucoseRange = cache(async (start: string, end: string): Promise<GlucoseRange> => {
  noStore()
  const raw = await callDexcomToolWithRetry('get_glucose_range', {
    start_time: start,
    end_time: end,
  })
  return GlucoseRangeSchema.parse(raw)
})

export const getDailySummary = cache(async (date?: string): Promise<DailySummary> => {
  noStore()
  void date
  const raw = await callDexcomTool('get_latest_glucose')
  return DailySummarySchema.parse(raw)
})
