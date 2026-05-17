import { ChatAnthropic } from '@langchain/anthropic'
import type { T1CopilotState } from '../state.js'
import { MEDICAL_DISCLAIMER } from '../state.js'
import {
  analyzeTrends,
  getDailySummary,
  getGlucoseRange,
  getLatestGlucose,
} from '../tools/dexcom.js'

function createLlm(): ChatAnthropic {
  return new ChatAnthropic({ model: 'claude-haiku-4-5-20251001' })
}

export async function glucoseAgentNode(state: T1CopilotState): Promise<Partial<T1CopilotState>> {
  let toolContext = ''

  try {
    const [latest, trends, dailySummary] = await Promise.all([
      getLatestGlucose(),
      analyzeTrends({ startDate: sevenDaysAgo(), endDate: today() }),
      getDailySummary({ date: today() }),
    ])

    if (latest !== null) {
      toolContext += `Latest glucose: ${String(latest.value)} ${latest.unit}, trend: ${latest.trend}\n`
    }
    if (trends !== null) {
      toolContext += `7-day trends: avg ${String(trends.averageMgdl)} mg/dL, TIR ${String(trends.timeInRangePercent)}%, StdDev ${String(trends.standardDeviation)}\n`
    }
    if (dailySummary !== null) {
      toolContext += `Today: avg ${String(dailySummary.averageMgdl)} mg/dL, TIR ${String(dailySummary.timeInRangePercent)}%, hypos: ${String(dailySummary.hypoCount)}, hypers: ${String(dailySummary.hyperCount)}\n`
    }
    if (toolContext === '') {
      toolContext = 'No live CGM data available yet (Dexcom MCP not connected).'
    }
  } catch (fetchError) {
    toolContext = `Data fetch error: ${fetchError instanceof Error ? fetchError.message : 'unknown'}`
  }

  const prompt = `You are the Glucose Analyst for T1Copilot, an AI assistant for Type 1 diabetes management.

User query: "${state.userQuery}"

Available CGM data:
${toolContext}

Provide a clear, concise analysis responding to the user's query. Focus on patterns, trends, and actionable observations. Do not recommend specific insulin doses or parameter changes. Keep response under 200 words.`

  try {
    const llm = createLlm()
    const result = await llm.invoke(prompt)
    const text =
      typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
    return {
      agentResponse: `${text}\n\n${MEDICAL_DISCLAIMER}`,
      activeAgent: 'glucoseAgent',
    }
  } catch (error) {
    return {
      agentResponse: `Glucose analysis unavailable. ${MEDICAL_DISCLAIMER}`,
      error: error instanceof Error ? error.message : 'Glucose agent failed',
      activeAgent: 'glucoseAgent',
    }
  }
}

// ── helpers ───────────────────────────────────────────────────────────────────

export interface GlucoseAnalysis {
  zone: ReturnType<typeof classifyGlucose>
  averageMgdl: number
  timeInRange: number
}

export function analyzeGlucoseReadings(
  readings: NonNullable<T1CopilotState['glucoseData']>,
): GlucoseAnalysis {
  if (readings.length === 0) {
    return { zone: 'inRange', averageMgdl: 0, timeInRange: 0 }
  }

  const values = readings.map((r) => r.value)
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const inRange = values.filter((v) => v >= 70 && v <= 180).length

  return {
    zone: classifyGlucose(avg),
    averageMgdl: Math.round(avg),
    timeInRange: Math.round((inRange / values.length) * 100),
  }
}

export function classifyGlucose(mgdl: number): 'low' | 'inRange' | 'high' | 'veryHigh' {
  if (mgdl < 70) return 'low'
  if (mgdl <= 180) return 'inRange'
  if (mgdl <= 250) return 'high'
  return 'veryHigh'
}

function today(): string {
  return new Date().toISOString().split('T')[0] ?? new Date().toISOString()
}

function sevenDaysAgo(): string {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString().split('T')[0] ?? d.toISOString()
}

// Re-export for backwards compatibility with packages/utils callers
export { getGlucoseRange }
