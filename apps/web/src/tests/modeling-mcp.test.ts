import {
  compareExpectedVsActual,
  DexcomMcpError,
  getBaselineParameters,
  getGlucoseStatistics,
  predictGlucoseImpact,
  updateBaselineParameters,
} from '@t1copilot/mcp-clients'
import { afterEach, describe, expect, it } from 'vitest'
import {
  isDefaultParameters,
  SERVER_DEFAULT_BASAL,
  SERVER_DEFAULT_ICR,
  SERVER_DEFAULT_ISF,
} from '@/lib/baseline-defaults'
import {
  MOCK_BASELINE_PARAMETERS,
  MOCK_COMPARE_EXPECTED_VS_ACTUAL,
  MOCK_PREDICT_BOTH,
  MOCK_PREDICT_CARBS,
  MOCK_PREDICT_INSULIN,
  MOCK_UPDATED_BASELINE_PARAMETERS,
  mcpHandlerWithIsError,
  mcpHandlerWithModelingFixture,
  resetBaselineFixture,
} from '@/mocks/handlers/dexcom-modeling'
import { server } from '@/mocks/node'

afterEach(() => {
  resetBaselineFixture()
})

describe('getBaselineParameters', () => {
  it('returns validated baseline parameters on success', async () => {
    const result = await getBaselineParameters()

    expect(result.baselineParameters.insulinSensitivityFactor.value).toBe(30)
    expect(result.baselineParameters.insulinToCarbRatio.value).toBe(4)
    expect(result.baselineParameters.basalDose.value).toBe(30)
    expect(result.baselineParameters.basalTiming).toBe('morning')
    expect(result.note).toBe(MOCK_BASELINE_PARAMETERS.note)
  })
})

describe('predictGlucoseImpact', () => {
  it('insulin action — insulin block present, carbs/combined absent', async () => {
    const result = await predictGlucoseImpact({
      action_type: 'insulin',
      insulin_units: 2,
      current_glucose: 150,
    })

    expect(result.currentGlucose).toBe(150)
    expect(result.insulin).toBeDefined()
    expect(result.insulin?.predictedChange).toBe(-60)
    expect(result.carbs).toBeUndefined()
    expect(result.combined).toBeUndefined()
    expect(result).toEqual(MOCK_PREDICT_INSULIN)
  })

  it('carbs action — carbs block present, insulin/combined absent', async () => {
    const result = await predictGlucoseImpact({
      action_type: 'carbs',
      carb_grams: 45,
      current_glucose: 120,
    })

    expect(result.currentGlucose).toBe(120)
    expect(result.carbs).toBeDefined()
    expect(result.carbs?.predictedChange).toBe(225)
    expect(result.insulin).toBeUndefined()
    expect(result.combined).toBeUndefined()
    expect(result).toEqual(MOCK_PREDICT_CARBS)
  })

  it('both action — insulin, carbs, and combined blocks present', async () => {
    const result = await predictGlucoseImpact({
      action_type: 'both',
      insulin_units: 2,
      carb_grams: 45,
      current_glucose: 150,
    })

    expect(result.insulin).toBeDefined()
    expect(result.carbs).toBeDefined()
    expect(result.combined).toBeDefined()
    expect(result.combined?.netChange).toBe(165)
    expect(result).toEqual(MOCK_PREDICT_BOTH)
  })
})

describe('compareExpectedVsActual', () => {
  it('returns validated observation shape', async () => {
    const result = await compareExpectedVsActual({
      event_type: 'insulin',
      event_timestamp: '2026-06-05T10:00:00Z',
      event_value: 2,
      current_glucose: 180,
    })

    expect(result.event.type).toBe('insulin')
    expect(result.observation.observationType).toBe('isf_deviation')
    expect(result.observation.deviationPct).toBe(67)
    expect(result.actual.finalGlucose).toBe(200)
    expect(result).toEqual(MOCK_COMPARE_EXPECTED_VS_ACTUAL)
  })
})

describe('getGlucoseStatistics', () => {
  it('returns default 24h statistics', async () => {
    const result = await getGlucoseStatistics()

    expect(result.timeRange.hours).toBe(24)
    expect(result.statistics.average).toBe(131)
    expect(result.statistics.timeInRange).toBe(87)
    expect(result.statistics.readingCount).toBe(278)
  })

  it('returns weekly statistics for 168 hours', async () => {
    const result = await getGlucoseStatistics({ hours: 168 })

    expect(result.timeRange.hours).toBe(168)
    expect(result.statistics.readingCount).toBe(1890)
    expect(result.statistics.timeInRange).toBe(72)
  })
})

describe('modeling MCP error handling', () => {
  it('throws DexcomMcpError when MCP returns isError plain-text response', async () => {
    server.use(mcpHandlerWithIsError('Prediction unavailable — baseline parameters missing'))

    await expect(
      predictGlucoseImpact({
        action_type: 'insulin',
        insulin_units: 2,
        current_glucose: 150,
      }),
    ).rejects.toBeInstanceOf(DexcomMcpError)
  })
})

describe('modeling schema strictness', () => {
  it('rejects extra keys in MCP response', async () => {
    server.use(
      mcpHandlerWithModelingFixture('get_baseline_parameters', {
        ...MOCK_BASELINE_PARAMETERS,
        unexpectedField: true,
      }),
    )

    await expect(getBaselineParameters()).rejects.toThrow()
  })
})

describe('updateBaselineParameters', () => {
  it('happy path — validates response schema', async () => {
    const result = await updateBaselineParameters({
      correction_factor: 35,
      insulin_to_carb_ratio: 5,
      basal_dose: 28,
      confirmed: true,
    })

    expect(result.success).toBe(true)
    expect(result.updatedParameters.insulinSensitivityFactor.value).toBe(35)
    expect(result.updatedParameters.insulinToCarbRatio.value).toBe(5)
    expect(result.updatedParameters.basalDose.value).toBe(28)
    expect(result.note).toBe(MOCK_UPDATED_BASELINE_PARAMETERS.message)
  })

  it('throws before calling MCP when confirmed is not true', async () => {
    await expect(
      updateBaselineParameters({
        correction_factor: 35,
        confirmed: undefined,
      }),
    ).rejects.toBeInstanceOf(DexcomMcpError)
  })
})

describe('isDefaultParameters', () => {
  it('returns true when all three values match server defaults', () => {
    expect(isDefaultParameters(MOCK_BASELINE_PARAMETERS)).toBe(true)
    expect(SERVER_DEFAULT_ISF).toBe(30)
    expect(SERVER_DEFAULT_ICR).toBe(4)
    expect(SERVER_DEFAULT_BASAL).toBe(30)
  })

  it('returns false when any single value differs from defaults', () => {
    expect(
      isDefaultParameters({
        ...MOCK_BASELINE_PARAMETERS,
        baselineParameters: {
          ...MOCK_BASELINE_PARAMETERS.baselineParameters,
          insulinSensitivityFactor: {
            ...MOCK_BASELINE_PARAMETERS.baselineParameters.insulinSensitivityFactor,
            value: 35,
          },
        },
      }),
    ).toBe(false)
  })
})
