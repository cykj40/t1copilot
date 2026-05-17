// Typed stubs for Peloton MCP tools.
// Wired to live MCP server (https://peloton-mcp-server.fly.dev) in Priority 6.
import type { ExerciseEvent } from '@t1copilot/types'

export interface WorkoutFetchParams {
  limit?: number
  startDate?: string
  endDate?: string
}

export interface GlucoseCorrelationResult {
  correlationCoefficient: number
  pValue: number
  sampleSize: number
  summary: string
  byDiscipline: Array<{
    discipline: string
    correlation: number
    avgGlucoseDropMgdl: number
  }>
}

export interface HypoglycemiaRisk {
  riskLevel: 'low' | 'moderate' | 'high'
  riskScore: number
  contributingFactors: string[]
  recommendations: string[]
}

export interface DisciplineInsight {
  discipline: string
  totalWorkouts: number
  avgDurationMinutes: number
  avgGlucoseImpactMgdl: number
  hypoRiskPercent: number
  recommendation: string
}

// ── Read-only tools ───────────────────────────────────────────────────────────

export async function pelotonGetWorkouts(
  params: WorkoutFetchParams,
): Promise<ExerciseEvent[] | null> {
  void params
  return null
}

export async function pelotonAnalyzeGlucoseCorrelation(
  params: WorkoutFetchParams,
): Promise<GlucoseCorrelationResult | null> {
  void params
  return null
}

export async function pelotonDetectHypoglycemiaRisk(params: {
  lookbackDays?: number
}): Promise<HypoglycemiaRisk | null> {
  void params
  return null
}

export async function pelotonGetDisciplineInsights(): Promise<DisciplineInsight[] | null> {
  return null
}
