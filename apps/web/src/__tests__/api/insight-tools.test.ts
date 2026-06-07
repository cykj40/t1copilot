import {
  analyzeTrends,
  DexcomMcpError,
  detectParameterDrift,
  getAdaptiveInsights,
} from '@t1copilot/mcp-clients'
import { describe, expect, it } from 'vitest'
import {
  MOCK_ANALYZE_TRENDS,
  MOCK_DETECT_PARAMETER_DRIFT,
  MOCK_GET_ADAPTIVE_INSIGHTS,
  mcpHandlerWithBadToolResponse,
  mcpHandlerWithFixture,
} from '@/mocks/handlers/dexcom'
import { mcpHandlerWithIsError } from '@/mocks/handlers/dexcom-modeling'
import { server } from '@/mocks/node'

describe('analyzeTrends', () => {
  it('returns validated shape', async () => {
    const result = await analyzeTrends({ days: 7 })

    expect(result.period.days).toBe(7)
    expect(result.overallStatistics.timeInRange).toBe(74)
    expect(result.postMealPatterns.mealsAnalyzed).toBe(5)
    expect(result.exerciseImpact.sessionsAnalyzed).toBe(3)
    expect(result).toEqual(MOCK_ANALYZE_TRENDS)
  })

  it('throws DexcomMcpError when MCP returns isError: true', async () => {
    server.use(mcpHandlerWithIsError('Trend analysis unavailable'))

    await expect(analyzeTrends({ days: 7 })).rejects.toBeInstanceOf(DexcomMcpError)
  })

  it('throws when response fails Zod validation', async () => {
    server.use(
      mcpHandlerWithFixture('analyze_trends', {
        ...MOCK_ANALYZE_TRENDS,
        unexpectedField: true,
      }),
    )

    await expect(analyzeTrends({ days: 7 })).rejects.toThrow()
  })
})

describe('detectParameterDrift', () => {
  it('returns validated shape with driftDetected: false', async () => {
    const result = await detectParameterDrift({ days: 14 })

    expect(result.driftDetected).toBe(false)
    expect(result.observationCount).toBe(8)
    expect(result.recentObservations).toHaveLength(1)
    expect(result).toEqual(MOCK_DETECT_PARAMETER_DRIFT)
  })

  it('throws DexcomMcpError when MCP returns isError: true', async () => {
    server.use(mcpHandlerWithIsError('Drift detection unavailable'))

    await expect(detectParameterDrift({ days: 14 })).rejects.toBeInstanceOf(DexcomMcpError)
  })

  it('throws when response fails Zod validation', async () => {
    server.use(
      mcpHandlerWithFixture('detect_parameter_drift', {
        ...MOCK_DETECT_PARAMETER_DRIFT,
        driftDetected: 'no',
      }),
    )

    await expect(detectParameterDrift({ days: 14 })).rejects.toThrow()
  })
})

describe('getAdaptiveInsights', () => {
  it('returns validated shape', async () => {
    const result = await getAdaptiveInsights({ days: 14 })

    expect(result.baselineParameters.isf).toBe(30)
    expect(result.observationsSummary).toContain('15%')
    expect(result.recentObservations).toHaveLength(1)
    expect(result).toEqual(MOCK_GET_ADAPTIVE_INSIGHTS)
  })

  it('throws DexcomMcpError when MCP returns isError: true', async () => {
    server.use(mcpHandlerWithIsError('Adaptive insights unavailable'))

    await expect(getAdaptiveInsights({ days: 14 })).rejects.toBeInstanceOf(DexcomMcpError)
  })

  it('throws when response fails Zod validation', async () => {
    server.use(mcpHandlerWithBadToolResponse({ analysisWindow: 14 }))

    await expect(getAdaptiveInsights({ days: 14 })).rejects.toThrow()
  })
})
