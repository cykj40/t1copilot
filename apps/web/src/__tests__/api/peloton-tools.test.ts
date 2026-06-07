import { callPelotonTool, extractJson, extractText, PelotonMcpError } from '@t1copilot/mcp-clients'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { getGlucoseRange } from '@/lib/dexcom-mcp'
import {
  MOCK_PELOTON_RAW_WORKOUTS,
  MOCK_PELOTON_SYNC_TEXT,
  mcpPelotonHandlerWithFixture,
  PELOTON_MCP_ENDPOINT,
} from '@/mocks/handlers/peloton'
import { server } from '@/mocks/node'

describe('sync_peloton_workouts', () => {
  it('returns sync confirmation text', async () => {
    const response = await callPelotonTool('peloton_sync_workouts', { limit: 50 })
    const message = extractText(response)

    expect(message).toContain('Synced 10 workouts')
    expect(message).toContain('Database now contains 10 total workouts')
    expect(message).toBe(MOCK_PELOTON_SYNC_TEXT)
  })
})

describe('bulk_correlate_workouts', () => {
  it('walks the get_workouts → glucose window → analyze_correlation sequence', async () => {
    server.use(mcpPelotonHandlerWithFixture('peloton_get_workouts', MOCK_PELOTON_RAW_WORKOUTS))

    const workoutsRaw = await callPelotonTool('peloton_get_workouts', {
      limit: 1,
      json_response: true,
    })
    const workouts = extractJson<Array<{ id: string; start_time: number }>>(workoutsRaw)
    expect(workouts).toHaveLength(1)

    const workout = workouts[0]
    if (!workout) throw new Error('expected at least one workout')

    const workoutMs = workout.start_time * 1000
    const windowStart = new Date(workoutMs - 4 * 60 * 60 * 1000).toISOString()
    const windowEnd = new Date(workoutMs + 4 * 60 * 60 * 1000).toISOString()

    const glucoseRange = await getGlucoseRange(windowStart, windowEnd)
    expect(glucoseRange.readings.length).toBeGreaterThan(0)

    const correlationResponse = await callPelotonTool('peloton_analyze_glucose_correlation', {
      workout_id: workout.id,
      glucose_readings: glucoseRange.readings.map((r) => ({
        timestamp: r.timestamp,
        value: r.value,
        trend: r.trend,
      })),
    })
    const correlation = extractJson<{ workoutId: string }>(correlationResponse)
    expect(correlation.workoutId).toBe('w1')
  })

  it('surfaces a PelotonMcpError when the correlation write fails', async () => {
    server.use(
      http.post(PELOTON_MCP_ENDPOINT, () => new HttpResponse(null, { status: 500 })),
      http.delete(PELOTON_MCP_ENDPOINT, () => new HttpResponse(null, { status: 200 })),
    )

    await expect(
      callPelotonTool('peloton_analyze_glucose_correlation', {
        workout_id: 'w1',
        glucose_readings: [{ timestamp: '2026-05-23T12:00:00.000Z', value: 142, trend: 'flat' }],
      }),
    ).rejects.toBeInstanceOf(PelotonMcpError)
  })
})
