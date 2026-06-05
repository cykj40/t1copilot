import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { POST } from '@/app/api/log/route'
import {
  type CapturedMcpToolCall,
  MCP_ENDPOINT,
  mcpHandlerCapturingToolCalls,
} from '@/mocks/handlers/dexcom'
import { server } from '@/mocks/node'

function postLog(body: Record<string, unknown>) {
  return POST(
    new Request('http://localhost:3000/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )
}

describe('POST /api/log — timestamp and duration forwarding', () => {
  it('passes explicit past timestamp to log_insulin', async () => {
    const calls: CapturedMcpToolCall[] = []
    server.use(
      mcpHandlerCapturingToolCalls((call) => {
        calls.push(call)
      }),
      http.delete(MCP_ENDPOINT, () => new HttpResponse(null, { status: 200 })),
    )

    const timestamp = '2026-06-05T14:30:00.000Z'
    const response = await postLog({
      eventType: 'insulin',
      value: 6,
      unit: 'units',
      subtype: 'rapid',
      timestamp,
    })

    expect(response.status).toBe(200)
    const insulinCall = calls.find((c) => c.name === 'log_insulin')
    expect(insulinCall).toBeDefined()
    expect(insulinCall?.args.timestamp).toBe(timestamp)
    expect(insulinCall?.args.units).toBe(6)
  })

  it('passes duration_minutes to log_exercise', async () => {
    const calls: CapturedMcpToolCall[] = []
    server.use(
      mcpHandlerCapturingToolCalls((call) => {
        calls.push(call)
      }),
      http.delete(MCP_ENDPOINT, () => new HttpResponse(null, { status: 200 })),
    )

    const response = await postLog({
      eventType: 'exercise',
      value: 0,
      unit: 'cycling',
      duration_minutes: 45,
    })

    expect(response.status).toBe(200)
    const exerciseCall = calls.find((c) => c.name === 'log_exercise')
    expect(exerciseCall).toBeDefined()
    expect(exerciseCall?.args.duration_minutes).toBe(45)
    expect(exerciseCall?.args.activity_type).toBe('cycling')
  })

  it('omits timestamp from log_carbs when not provided (now)', async () => {
    const calls: CapturedMcpToolCall[] = []
    server.use(
      mcpHandlerCapturingToolCalls((call) => {
        calls.push(call)
      }),
      http.delete(MCP_ENDPOINT, () => new HttpResponse(null, { status: 200 })),
    )

    const response = await postLog({
      eventType: 'carbs',
      value: 45,
      unit: 'g',
      food_description: 'pasta',
    })

    expect(response.status).toBe(200)
    const carbsCall = calls.find((c) => c.name === 'log_carbs')
    expect(carbsCall).toBeDefined()
    expect(carbsCall?.args.timestamp).toBeUndefined()
    expect(carbsCall?.args.grams).toBe(45)
  })
})
