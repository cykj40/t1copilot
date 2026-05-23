'use server'

import { callPelotonTool, extractJson, PelotonMcpError } from '@t1copilot/mcp-clients'
import type { DisciplineInsight, WorkoutCorrelation } from '@t1copilot/types'
import { unstable_noStore as noStore } from 'next/cache'

export async function getWorkouts(): Promise<WorkoutCorrelation[]> {
  noStore()
  try {
    const response = await callPelotonTool('peloton_get_workouts', { limit: 20 })
    return extractJson<WorkoutCorrelation[]>(response)
  } catch (err) {
    if (err instanceof PelotonMcpError) {
      console.error(`[getWorkouts] Peloton MCP error (${String(err.statusCode)}):`, err.message)
    } else {
      console.error('[getWorkouts] Unexpected error:', err)
    }
    return []
  }
}

export async function getDisciplineInsights(): Promise<DisciplineInsight[]> {
  noStore()
  try {
    const response = await callPelotonTool('peloton_get_discipline_insights', {})
    return extractJson<DisciplineInsight[]>(response)
  } catch (err) {
    if (err instanceof PelotonMcpError) {
      console.error(
        `[getDisciplineInsights] Peloton MCP error (${String(err.statusCode)}):`,
        err.message,
      )
    } else {
      console.error('[getDisciplineInsights] Unexpected error:', err)
    }
    return []
  }
}
