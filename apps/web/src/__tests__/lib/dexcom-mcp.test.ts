import { DexcomMcpTimeoutError } from '@t1copilot/mcp-clients'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import {
  getDailySummary,
  getGlucoseRange,
  getLatestGlucose,
  mapDexcomTrend,
} from '@/lib/dexcom-mcp'
import {
  MCP_ENDPOINT,
  MOCK_CRITICAL_LOW_GLUCOSE,
  MOCK_GLUCOSE_RANGE,
  MOCK_LATEST_GLUCOSE,
  MOCK_LOW_GLUCOSE,
  mcpHandlerWithBadToolResponse,
  mcpHandlerWithFixture,
  mcpHandlerWithPersistentColdStartFailure,
  mcpHandlerWithTimeoutOnce,
} from '@/mocks/handlers/dexcom'
import { server } from '@/mocks/node'

// ── getLatestGlucose ─────────────────────────────────────────────────────────

describe('getLatestGlucose', () => {
  it('returns a validated glucose reading on success', async () => {
    const result = await getLatestGlucose()

    expect(result.value).toBe(142)
    expect(result.unit).toBe('mg/dL')
    expect(result.trend).toBe('flat')
    expect(result.ageMinutes).toBe(4)
    expect(result.source).toBe('share')
    expect(typeof result.timestamp).toBe('string')
    expect(typeof result.trendDescription).toBe('string')
  })

  it('parses low glucose readings correctly', async () => {
    server.use(mcpHandlerWithFixture('get_latest_glucose', MOCK_LOW_GLUCOSE))

    const result = await getLatestGlucose()
    expect(result.value).toBe(58)
    expect(result.trend).toBe('singleDown')
  })

  it('parses critical-low glucose readings correctly', async () => {
    server.use(mcpHandlerWithFixture('get_latest_glucose', MOCK_CRITICAL_LOW_GLUCOSE))

    const result = await getLatestGlucose()
    expect(result.value).toBe(48)
    expect(result.trend).toBe('doubleDown')
  })

  it('throws when the MCP server returns a 500', async () => {
    server.use(
      http.post(MCP_ENDPOINT, () => new HttpResponse(null, { status: 500 })),
      http.delete(MCP_ENDPOINT, () => new HttpResponse(null, { status: 200 })),
    )

    await expect(getLatestGlucose()).rejects.toThrow()
  })

  it('throws on network error', async () => {
    server.use(
      http.post(MCP_ENDPOINT, () => HttpResponse.error()),
      http.delete(MCP_ENDPOINT, () => new HttpResponse(null, { status: 200 })),
    )

    await expect(getLatestGlucose()).rejects.toThrow()
  })

  it('throws when the response fails Zod validation — missing required fields', async () => {
    server.use(mcpHandlerWithBadToolResponse({ value: 142 }))

    await expect(getLatestGlucose()).rejects.toThrow()
  })

  it('throws when value is not a number', async () => {
    server.use(mcpHandlerWithBadToolResponse({ ...MOCK_LATEST_GLUCOSE, value: 'high' }))

    await expect(getLatestGlucose()).rejects.toThrow()
  })
})

// ── getGlucoseRange ──────────────────────────────────────────────────────────

describe('getGlucoseRange', () => {
  const start = '2026-05-23T00:00:00.000Z'
  const end = '2026-05-23T23:59:59.000Z'

  it('returns readings and statistics for a valid range', async () => {
    const result = await getGlucoseRange(start, end)

    expect(result.readingCount).toBe(3)
    expect(result.readings).toHaveLength(3)
    expect(result.statistics.average).toBe(138)
    expect(result.statistics.timeInRange).toBe(74)
    expect(result.statistics.min).toBe(72)
    expect(result.statistics.max).toBe(210)
    expect(result.statistics.standardDeviation).toBe(20)
    expect(result.statistics.coefficientOfVariation).toBe(15)
  })

  it('each reading has the correct shape', async () => {
    const result = await getGlucoseRange(start, end)

    for (const reading of result.readings) {
      expect(typeof reading.value).toBe('number')
      expect(typeof reading.trend).toBe('string')
      expect(typeof reading.timestamp).toBe('string')
    }
  })

  it('handles empty readings array', async () => {
    server.use(
      mcpHandlerWithFixture('get_glucose_range', {
        ...MOCK_GLUCOSE_RANGE,
        readings: [],
        readingCount: 0,
        statistics: { ...MOCK_GLUCOSE_RANGE.statistics, readingCount: 0 },
      }),
    )

    const result = await getGlucoseRange(start, end)
    expect(result.readings).toHaveLength(0)
    expect(result.readingCount).toBe(0)
  })

  it('throws on 401 unauthorized', async () => {
    server.use(
      http.post(MCP_ENDPOINT, () => new HttpResponse(null, { status: 401 })),
      http.delete(MCP_ENDPOINT, () => new HttpResponse(null, { status: 200 })),
    )

    await expect(getGlucoseRange(start, end)).rejects.toThrow()
  })

  it('throws when statistics is missing from response', async () => {
    const { statistics: _omit, ...withoutStats } = MOCK_GLUCOSE_RANGE
    server.use(mcpHandlerWithBadToolResponse(withoutStats))

    await expect(getGlucoseRange(start, end)).rejects.toThrow()
  })

  it('throws when readings contains a reading with wrong shape', async () => {
    server.use(
      mcpHandlerWithFixture('get_glucose_range', {
        ...MOCK_GLUCOSE_RANGE,
        readings: [{ value: 'not-a-number', trend: 'flat', timestamp: '2026-05-23T12:00:00.000Z' }],
      }),
    )

    await expect(getGlucoseRange(start, end)).rejects.toThrow()
  })

  it('retries once after a cold-start timeout and returns data', async () => {
    vi.useFakeTimers()
    server.use(mcpHandlerWithTimeoutOnce('get_glucose_range', MOCK_GLUCOSE_RANGE))

    const promise = getGlucoseRange(start, end)
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.readingCount).toBe(3)
    vi.useRealTimers()
  })

  it('throws DexcomMcpTimeoutError when both attempts fail with cold-start errors', async () => {
    vi.useFakeTimers()
    server.use(mcpHandlerWithPersistentColdStartFailure('get_glucose_range'))

    const promise = getGlucoseRange(start, end).catch((e: unknown) => e)
    await vi.runAllTimersAsync()
    const err = await promise

    expect(err).toBeInstanceOf(DexcomMcpTimeoutError)
    vi.useRealTimers()
  })

  it('does not retry on HTTP 401', async () => {
    let postCount = 0
    server.use(
      http.post(MCP_ENDPOINT, () => {
        postCount++
        return new HttpResponse(null, { status: 401 })
      }),
      http.delete(MCP_ENDPOINT, () => new HttpResponse(null, { status: 200 })),
    )

    await expect(getGlucoseRange(start, end)).rejects.toThrow()
    expect(postCount).toBe(1)
  })
})

// ── getDailySummary ──────────────────────────────────────────────────────────

describe('getDailySummary', () => {
  it('returns the daily summary shape', async () => {
    const result = await getDailySummary()

    expect(result.date).toBe('2026-05-23')
    expect(result.statistics.average).toBe(138)
    expect(result.readingCount).toBe(3)
  })

  it('passes an explicit date string through to the MCP tool', async () => {
    const result = await getDailySummary('2026-05-23')
    expect(result.date).toBe('2026-05-23')
  })

  it('throws when the server is unreachable', async () => {
    server.use(
      http.post(MCP_ENDPOINT, () => HttpResponse.error()),
      http.delete(MCP_ENDPOINT, () => new HttpResponse(null, { status: 200 })),
    )

    await expect(getDailySummary()).rejects.toThrow()
  })

  it('throws when daily summary fields are missing from response', async () => {
    server.use(mcpHandlerWithBadToolResponse({ value: 142 }))

    await expect(getDailySummary()).rejects.toThrow()
  })
})

// ── mapDexcomTrend ────────────────────────────────────────────────────────────

describe('mapDexcomTrend', () => {
  it('maps all Dexcom camelCase trends to app TrendArrow enum values', () => {
    expect(mapDexcomTrend('flat')).toBe('FLAT')
    expect(mapDexcomTrend('singleUp')).toBe('SINGLE_UP')
    expect(mapDexcomTrend('singleDown')).toBe('SINGLE_DOWN')
    expect(mapDexcomTrend('fortyFiveUp')).toBe('FORTY_FIVE_UP')
    expect(mapDexcomTrend('fortyFiveDown')).toBe('FORTY_FIVE_DOWN')
    expect(mapDexcomTrend('doubleUp')).toBe('DOUBLE_UP')
    expect(mapDexcomTrend('doubleDown')).toBe('DOUBLE_DOWN')
    expect(mapDexcomTrend('none')).toBe('NONE')
    expect(mapDexcomTrend('notComputable')).toBe('NOT_COMPUTABLE')
    expect(mapDexcomTrend('rateOutOfRange')).toBe('RATE_OUT_OF_RANGE')
  })

  it('defaults to NONE for unknown trend strings', () => {
    expect(mapDexcomTrend('unknown')).toBe('NONE')
    expect(mapDexcomTrend('')).toBe('NONE')
  })
})
