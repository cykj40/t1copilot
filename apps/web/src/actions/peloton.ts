'use server'

import { callPelotonTool, extractJson, extractText, PelotonMcpError } from '@t1copilot/mcp-clients'
import type { DisciplineInsight } from '@t1copilot/types'
import { unstable_noStore as noStore } from 'next/cache'

export interface PelotonServerWorkout {
  id: string
  title: string
  fitness_discipline: string
  start_time: number
  duration_seconds: number
  output_watts: number | null
}

export async function getWorkouts(): Promise<PelotonServerWorkout[]> {
  noStore()
  try {
    const response = await callPelotonTool('peloton_get_workouts', {
      limit: 10,
      json_response: true,
    })
    const workouts = extractJson<PelotonServerWorkout[]>(response)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    return workouts.filter((w) => w.start_time * 1000 >= sevenDaysAgo)
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
    const response = await callPelotonTool('peloton_get_discipline_insights', {
      json_response: true,
    })
    if (response.isError === true) return []

    const text = extractText(response)
    try {
      const data = JSON.parse(text) as unknown
      return Array.isArray(data) ? (data as DisciplineInsight[]) : []
    } catch {
      // Server returns plain text when no correlation data exists yet.
      return []
    }
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
