// Typed stubs for Dexcom MCP tools.
// Wired to live MCP server (https://dexcom-mcp-server.fly.dev) in Priority 5.
import type { GlucoseReading } from '@t1copilot/types'

export interface GlucoseRangeParams {
  startDate: string
  endDate: string
}

export interface DailySummaryParams {
  date: string
}

export interface TrendAnalysisResult {
  trend: string
  averageMgdl: number
  timeInRangePercent: number
  hyperPercent: number
  hypoPercent: number
  standardDeviation: number
}

export interface DailySummary {
  date: string
  averageMgdl: number
  timeInRangePercent: number
  hyperCount: number
  hypoCount: number
  totalReadings: number
}

export interface GlucoseImpactPrediction {
  predictedMgdl: number
  confidenceInterval: { low: number; high: number }
  horizon: string
}

export interface BaselineParameters {
  isf: number
  icr: number
  basalUnitsPerDay: number
}

export interface ParameterDriftResult {
  driftDetected: boolean
  affectedParameter: string | null
  magnitude: number | null
  recommendation: string | null
}

export interface EventTimelineEntry {
  timestamp: string
  eventType: string
  value: number
  unit: string
}

export interface AdaptiveInsight {
  category: string
  summary: string
  confidence: number
  actionable: boolean
}

export interface LogResult {
  success: boolean
  id: string
  timestamp: string
}

// ── Read-only tools ───────────────────────────────────────────────────────────

export async function getLatestGlucose(): Promise<GlucoseReading | null> {
  return null
}

export async function getGlucoseRange(
  params: GlucoseRangeParams,
): Promise<GlucoseReading[] | null> {
  void params
  return null
}

export async function getDailySummary(params: DailySummaryParams): Promise<DailySummary | null> {
  void params
  return null
}

export async function analyzeTrends(
  params: GlucoseRangeParams,
): Promise<TrendAnalysisResult | null> {
  void params
  return null
}

export async function predictGlucoseImpact(params: {
  carbGrams?: number
  insulinUnits?: number
  exerciseMinutes?: number
  exerciseIntensityPercent?: number
}): Promise<GlucoseImpactPrediction | null> {
  void params
  return null
}

export async function getBaselineParameters(): Promise<BaselineParameters | null> {
  return null
}

export async function compareExpectedVsActual(params: GlucoseRangeParams): Promise<{
  expected: GlucoseReading[]
  actual: GlucoseReading[]
  mape: number
} | null> {
  void params
  return null
}

export async function detectParameterDrift(): Promise<ParameterDriftResult | null> {
  return null
}

export async function getEventTimeline(
  params: GlucoseRangeParams,
): Promise<EventTimelineEntry[] | null> {
  void params
  return null
}

export async function getAdaptiveInsights(): Promise<AdaptiveInsight[] | null> {
  return null
}

export async function generateChart(params: GlucoseRangeParams): Promise<{ url: string } | null> {
  void params
  return null
}

// ── Write tools — HITL required before calling ───────────────────────────────

export async function logInsulin(params: {
  units: number
  insulinType: 'rapid' | 'long' | 'correction'
  timestamp?: string
  note?: string
}): Promise<LogResult | null> {
  void params
  return null
}

export async function logCarbs(params: {
  grams: number
  timestamp?: string
  note?: string
}): Promise<LogResult | null> {
  void params
  return null
}

export async function logExercise(params: {
  durationMinutes: number
  type: string
  intensityPercent?: number
  timestamp?: string
  note?: string
}): Promise<LogResult | null> {
  void params
  return null
}
