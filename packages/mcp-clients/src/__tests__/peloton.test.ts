import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { callPelotonTool, extractJson, extractText, PelotonMcpError } from '../peloton.js'
import {
  MOCK_CORRELATION,
  MOCK_DISCIPLINE_INSIGHTS,
  MOCK_HYPO_RISK,
  MOCK_SYNC_RESULT,
  MOCK_WORKOUTS,
  mcpPelotonHandlerWithError,
  mcpPelotonHandlerWithIsError,
  PELOTON_MCP_ENDPOINT,
} from './peloton.handlers.js'
import { server } from './server.js'

// ── peloton_get_workouts ──────────────────────────────────────────────────────

describe('peloton_get_workouts', () => {
  it('happy path — parses workout list', async () => {
    const response = await callPelotonTool('peloton_get_workouts', {})
    const data = extractJson<typeof MOCK_WORKOUTS>(response)
    expect(data).toHaveLength(2)
    expect(data[0]?.discipline).toBe('Cycling')
    expect(data[1]?.discipline).toBe('Running')
  })

  it('default coercion — limit defaults to 20', async () => {
    const response = await callPelotonTool('peloton_get_workouts', {})
    expect(response.content).toHaveLength(1)
    expect(extractJson(response)).toEqual(MOCK_WORKOUTS)
  })

  it('accepts json_response=true for structured JSON payloads', async () => {
    const response = await callPelotonTool('peloton_get_workouts', {
      limit: 10,
      json_response: true,
    })
    expect(extractJson(response)).toEqual(MOCK_WORKOUTS)
  })

  it('rejects limit > 100', async () => {
    await expect(callPelotonTool('peloton_get_workouts', { limit: 101 })).rejects.toThrow()
  })

  it('rejects limit < 1', async () => {
    await expect(callPelotonTool('peloton_get_workouts', { limit: 0 })).rejects.toThrow()
  })

  it('rejects fields not accepted by the server schema', async () => {
    await expect(
      callPelotonTool('peloton_get_workouts', { limit: 10, page: 0 } as never),
    ).rejects.toThrow()
  })
})

// ── peloton_get_discipline_insights ──────────────────────────────────────────

describe('peloton_get_discipline_insights', () => {
  it('happy path — parses discipline list', async () => {
    const response = await callPelotonTool('peloton_get_discipline_insights', {})
    const data = extractJson<typeof MOCK_DISCIPLINE_INSIGHTS>(response)
    expect(data).toHaveLength(2)
    expect(data[0]?.discipline).toBe('Cycling')
  })

  it('sends no arguments for discipline insights', async () => {
    const response = await callPelotonTool('peloton_get_discipline_insights', {})
    expect(extractJson(response)).toEqual(MOCK_DISCIPLINE_INSIGHTS)
  })

  it('accepts json_response=true for structured JSON payloads', async () => {
    const response = await callPelotonTool('peloton_get_discipline_insights', {
      json_response: true,
    })
    expect(extractJson(response)).toEqual(MOCK_DISCIPLINE_INSIGHTS)
  })

  it('rejects format because the server schema does not accept it', async () => {
    await expect(
      callPelotonTool('peloton_get_discipline_insights', { format: 'summary' } as never),
    ).rejects.toThrow()
  })
})

// ── peloton_detect_hypoglycemia_risk ─────────────────────────────────────────

describe('peloton_detect_hypoglycemia_risk', () => {
  it('happy path — returns risk assessment', async () => {
    const response = await callPelotonTool('peloton_detect_hypoglycemia_risk', {})
    const data = extractJson<typeof MOCK_HYPO_RISK>(response)
    expect(data.riskLevel).toBe('moderate')
  })

  it('default coercion — lookback_hours defaults to 48', async () => {
    const response = await callPelotonTool('peloton_detect_hypoglycemia_risk', {})
    expect(extractJson(response)).toEqual(MOCK_HYPO_RISK)
  })

  it('rejects lookback_hours > 72', async () => {
    await expect(
      callPelotonTool('peloton_detect_hypoglycemia_risk', { lookback_hours: 73 }),
    ).rejects.toThrow()
  })

  it('rejects lookback_hours < 1', async () => {
    await expect(
      callPelotonTool('peloton_detect_hypoglycemia_risk', { lookback_hours: 0 }),
    ).rejects.toThrow()
  })
})

// ── peloton_analyze_glucose_correlation ──────────────────────────────────────

describe('peloton_analyze_glucose_correlation', () => {
  const validArgs = {
    workout_id: 'w1',
    glucose_readings: [{ timestamp: '2026-05-23T10:00:00.000Z', value: 148 }],
  }

  it('happy path — returns correlation data', async () => {
    const response = await callPelotonTool('peloton_analyze_glucose_correlation', validArgs)
    const data = extractJson<typeof MOCK_CORRELATION>(response)
    expect(data.workoutId).toBe('w1')
    expect(data.glucoseDropMgdl).toBe(28)
  })

  it('default coercion — window_minutes_before defaults to 60, window_minutes_after to 120', async () => {
    const response = await callPelotonTool('peloton_analyze_glucose_correlation', validArgs)
    expect(extractJson(response)).toEqual(MOCK_CORRELATION)
  })

  it('accepts optional trend field on glucose readings', async () => {
    const response = await callPelotonTool('peloton_analyze_glucose_correlation', {
      workout_id: 'w1',
      glucose_readings: [{ timestamp: '2026-05-23T10:00:00.000Z', value: 148, trend: 'flat' }],
    })
    expect(extractJson(response)).toEqual(MOCK_CORRELATION)
  })

  it('rejects empty workout_id', async () => {
    await expect(
      callPelotonTool('peloton_analyze_glucose_correlation', {
        workout_id: '',
        glucose_readings: [{ timestamp: '2026-05-23T10:00:00.000Z', value: 148 }],
      }),
    ).rejects.toThrow()
  })

  it('rejects empty glucose_readings array', async () => {
    await expect(
      callPelotonTool('peloton_analyze_glucose_correlation', {
        workout_id: 'w1',
        glucose_readings: [],
      }),
    ).rejects.toThrow()
  })
})

// ── peloton_sync_workouts ─────────────────────────────────────────────────────

describe('peloton_sync_workouts', () => {
  it('happy path — returns sync result', async () => {
    const response = await callPelotonTool('peloton_sync_workouts', {})
    const data = extractJson<typeof MOCK_SYNC_RESULT>(response)
    expect(data.synced).toBe(3)
  })

  it('default coercion — force defaults to false', async () => {
    const response = await callPelotonTool('peloton_sync_workouts', {})
    expect(extractJson(response)).toEqual(MOCK_SYNC_RESULT)
  })

  it('accepts explicit force=true', async () => {
    const response = await callPelotonTool('peloton_sync_workouts', { force: true })
    expect(extractJson(response)).toEqual(MOCK_SYNC_RESULT)
  })
})

// ── Error handling ────────────────────────────────────────────────────────────

describe('HTTP error handling', () => {
  it('throws PelotonMcpError with statusCode 401 on HTTP 401', async () => {
    server.use(
      http.post(PELOTON_MCP_ENDPOINT, () => new HttpResponse(null, { status: 401 })),
      http.delete(PELOTON_MCP_ENDPOINT, () => new HttpResponse(null, { status: 200 })),
    )
    const err = await callPelotonTool('peloton_get_workouts', {}).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(PelotonMcpError)
    expect((err as PelotonMcpError).statusCode).toBe(401)
    expect((err as PelotonMcpError).tool).toBe('peloton_get_workouts')
  })

  it('throws PelotonMcpError with statusCode 500 on HTTP 500', async () => {
    server.use(
      http.post(PELOTON_MCP_ENDPOINT, () => new HttpResponse(null, { status: 500 })),
      http.delete(PELOTON_MCP_ENDPOINT, () => new HttpResponse(null, { status: 200 })),
    )
    const err = await callPelotonTool('peloton_detect_hypoglycemia_risk', {}).catch(
      (e: unknown) => e,
    )
    expect(err).toBeInstanceOf(PelotonMcpError)
    expect((err as PelotonMcpError).statusCode).toBe(500)
  })

  it('throws PelotonMcpError on server-side JSON-RPC error envelope', async () => {
    server.use(mcpPelotonHandlerWithError({ code: -32601, message: 'Tool not found' }))
    const err = await callPelotonTool('peloton_get_workouts', {}).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(PelotonMcpError)
  })

  it('throws PelotonMcpError when response has isError:true', async () => {
    server.use(mcpPelotonHandlerWithIsError('Something went wrong on the Peloton server'))
    const err = await callPelotonTool('peloton_sync_workouts', {}).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(PelotonMcpError)
    expect((err as PelotonMcpError).statusCode).toBe(500)
  })
})

// ── extractText / extractJson ─────────────────────────────────────────────────

describe('extractText', () => {
  it('returns the text from the first content item', () => {
    const response = { content: [{ type: 'text', text: 'hello' }] }
    expect(extractText(response)).toBe('hello')
  })

  it('throws when content array is empty', () => {
    expect(() => extractText({ content: [] })).toThrow()
  })

  it('throws when first item type is not text', () => {
    expect(() => extractText({ content: [{ type: 'image', text: '' }] })).toThrow()
  })
})

describe('extractJson', () => {
  it('parses valid JSON text', () => {
    const response = { content: [{ type: 'text', text: '{"value":42}' }] }
    expect(extractJson<{ value: number }>(response)).toEqual({ value: 42 })
  })

  it('throws a readable error when response has isError=true with plain text content', () => {
    const response = {
      content: [
        {
          type: 'text',
          text: 'Error: Peloton client not connected. Use peloton_refresh_token.',
        },
      ],
      isError: true as const,
    }
    expect(() => extractJson(response)).toThrow('Peloton MCP returned an error')
  })

  it('throws a readable error when content is not valid JSON', () => {
    const response = {
      content: [{ type: 'text', text: 'Error: something went wrong (not JSON)' }],
    }
    expect(() => extractJson(response)).toThrow('Peloton MCP response is not valid JSON')
  })

  it('throws on malformed JSON with readable message', () => {
    const response = { content: [{ type: 'text', text: 'not json {{{' }] }
    expect(() => extractJson(response)).toThrow('Peloton MCP response is not valid JSON')
  })

  it('throws when content is empty', () => {
    expect(() => extractJson({ content: [] })).toThrow()
  })
})
