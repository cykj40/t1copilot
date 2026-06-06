import { HttpResponse, http } from 'msw'
import { MCP_ENDPOINT, mcpInitResponse } from './dexcom.js'

// ── Fixtures — shapes match dexcom-modeling.ts schemas ────────────────────────

export const MOCK_UPDATED_BASELINE_PARAMETERS = {
  success: true as const,
  updatedParameters: {
    insulinSensitivityFactor: {
      value: 35,
      description: 'How much 1 unit of insulin lowers glucose',
    },
    insulinToCarbRatio: {
      value: 5,
      description: 'Grams of carbs covered by 1 unit',
    },
    basalDose: {
      value: 28,
      description: 'Total daily basal insulin',
    },
    basalTiming: 'morning',
    updatedAt: '2026-06-06T12:00:00Z',
  },
  note: 'Parameters updated successfully.',
}

export const MOCK_BASELINE_PARAMETERS = {
  baselineParameters: {
    insulinSensitivityFactor: {
      value: 30,
      description: 'How much 1 unit of insulin lowers glucose',
    },
    insulinToCarbRatio: {
      value: 4,
      description: 'Grams of carbs covered by 1 unit',
    },
    basalDose: {
      value: 30,
      description: 'Total daily basal insulin',
    },
    basalTiming: 'morning',
    updatedAt: '2026-06-04 14:07:59',
  },
  note: 'Set by your care team. Changes require clinical approval.',
}

const BASELINE_PARAMS = { isf: 30, icr: 4 }

export const MOCK_PREDICT_INSULIN = {
  currentGlucose: 150,
  baselineParameters: BASELINE_PARAMS,
  insulin: {
    currentGlucose: 150,
    predictedChange: -60,
    predictedGlucose: 90,
    confidenceRange: { low: 78, high: 102 },
    timeHorizonMinutes: 180,
    factors: ['2 units rapid insulin', 'ISF: 1u → -30 mg/dL'],
    disclaimer: 'Model-based estimate only. Individual response varies.',
  },
  disclaimer: 'Model-based estimate only. Individual response varies.',
}

export const MOCK_PREDICT_CARBS = {
  currentGlucose: 120,
  baselineParameters: BASELINE_PARAMS,
  carbs: {
    currentGlucose: 120,
    predictedChange: 225,
    predictedGlucose: 345,
    confidenceRange: { low: 300, high: 345 },
    timeHorizonMinutes: 180,
    factors: ['45g carbs', 'ICR: 1u per 4g', 'GI unknown'],
    disclaimer: 'Model-based estimate only. Individual response varies.',
  },
  disclaimer: 'Model-based estimate only. Individual response varies.',
}

export const MOCK_PREDICT_BOTH = {
  currentGlucose: 150,
  baselineParameters: BASELINE_PARAMS,
  insulin: {
    currentGlucose: 150,
    predictedChange: -60,
    predictedGlucose: 90,
    confidenceRange: { low: 78, high: 102 },
    timeHorizonMinutes: 180,
    factors: ['2 units rapid insulin', 'ISF: 1u → -30 mg/dL'],
    disclaimer: 'Model-based estimate only. Individual response varies.',
  },
  carbs: {
    currentGlucose: 150,
    predictedChange: 225,
    predictedGlucose: 375,
    confidenceRange: { low: 318.75, high: 375 },
    timeHorizonMinutes: 180,
    factors: ['45g carbs', 'ICR: 1u per 4g', 'GI unknown'],
    disclaimer: 'Model-based estimate only. Individual response varies.',
  },
  combined: {
    insulinEffect: -60,
    carbEffect: 225,
    netChange: 165,
    predictedGlucose: 315,
    confidenceRange: { low: 265.5, high: 315 },
    timeHorizonMinutes: 180,
  },
  disclaimer: 'Model-based estimate only. Individual response varies.',
}

export const MOCK_COMPARE_EXPECTED_VS_ACTUAL = {
  event: {
    type: 'insulin',
    value: 2,
    timestamp: '2026-06-05T10:00:00Z',
    startingGlucose: 180,
  },
  prediction: {
    predictedGlucose: 120,
    predictedChange: -60,
    confidenceRange: { low: 108, high: 132 },
  },
  actual: {
    readingsAnalyzed: 11,
    finalGlucose: 200,
  },
  observation: {
    observationType: 'isf_deviation',
    expectedValue: 120,
    actualValue: 200,
    deviationPct: 67,
    context: { timeOfDay: 'morning', hour: 10, eventType: 'insulin' },
    hypothesis: 'Insulin sensitivity may have been lower than baseline ISF suggests.',
    timestamp: '2026-06-05T13:00:00Z',
    id: 1,
  },
  disclaimer: 'Observation for discussion with your care team only.',
}

const MOCK_STATS_24H = {
  timeRange: {
    start: '2026-06-05T12:00:00Z',
    end: '2026-06-06T12:00:00Z',
    hours: 24,
  },
  statistics: {
    average: 131,
    standardDeviation: 38,
    min: 57,
    max: 231,
    timeInRange: 87,
    timeBelowRange: 4,
    timeAboveRange: 9,
    readingCount: 278,
    coefficientOfVariation: 29,
  },
}

const MOCK_STATS_168H = {
  timeRange: {
    start: '2026-05-30T12:00:00Z',
    end: '2026-06-06T12:00:00Z',
    hours: 168,
  },
  statistics: {
    average: 138,
    standardDeviation: 42,
    min: 52,
    max: 265,
    timeInRange: 72,
    timeBelowRange: 6,
    timeAboveRange: 22,
    readingCount: 1890,
    coefficientOfVariation: 30,
  },
}

interface JsonRpcRequest {
  jsonrpc: string
  method: string
  id?: number
  params?: Record<string, unknown>
}

function mcpToolResponse(id: number | undefined, data: unknown) {
  return HttpResponse.json({
    jsonrpc: '2.0',
    id,
    result: { content: [{ type: 'text', text: JSON.stringify(data) }] },
  })
}

function resolvePredictFixture(args: Record<string, unknown>): unknown {
  const actionType = args.action_type as string | undefined
  if (actionType === 'carbs') return MOCK_PREDICT_CARBS
  if (actionType === 'both') return MOCK_PREDICT_BOTH
  return MOCK_PREDICT_INSULIN
}

function resolveStatsFixture(args: Record<string, unknown>): unknown {
  const hours = args.hours as number | undefined
  return hours === 168 ? MOCK_STATS_168H : MOCK_STATS_24H
}

let currentBaselineFixture = MOCK_BASELINE_PARAMETERS

function resolveUpdateBaselineFixture(args: Record<string, unknown>): unknown {
  if (args.confirmed !== true) {
    return { error: 'confirmed must be true' }
  }
  const updated = {
    ...MOCK_UPDATED_BASELINE_PARAMETERS,
    updatedParameters: {
      ...MOCK_UPDATED_BASELINE_PARAMETERS.updatedParameters,
      insulinSensitivityFactor: {
        ...MOCK_UPDATED_BASELINE_PARAMETERS.updatedParameters.insulinSensitivityFactor,
        value:
          (args.correction_factor as number | undefined) ??
          MOCK_UPDATED_BASELINE_PARAMETERS.updatedParameters.insulinSensitivityFactor.value,
      },
      insulinToCarbRatio: {
        ...MOCK_UPDATED_BASELINE_PARAMETERS.updatedParameters.insulinToCarbRatio,
        value:
          (args.insulin_to_carb_ratio as number | undefined) ??
          MOCK_UPDATED_BASELINE_PARAMETERS.updatedParameters.insulinToCarbRatio.value,
      },
      basalDose: {
        ...MOCK_UPDATED_BASELINE_PARAMETERS.updatedParameters.basalDose,
        value:
          (args.basal_dose as number | undefined) ??
          MOCK_UPDATED_BASELINE_PARAMETERS.updatedParameters.basalDose.value,
      },
      ...(typeof args.basal_timing === 'string' ? { basalTiming: args.basal_timing } : {}),
    },
  }
  currentBaselineFixture = {
    baselineParameters: updated.updatedParameters,
    note: updated.note,
  }
  return updated
}

const MODELING_TOOL_RESULTS: Record<string, (args: Record<string, unknown>) => unknown> = {
  get_baseline_parameters: () => currentBaselineFixture,
  predict_glucose_impact: resolvePredictFixture,
  compare_expected_vs_actual: () => MOCK_COMPARE_EXPECTED_VS_ACTUAL,
  get_glucose_statistics: resolveStatsFixture,
  update_baseline_parameters: resolveUpdateBaselineFixture,
}

export function resetBaselineFixture() {
  currentBaselineFixture = MOCK_BASELINE_PARAMETERS
}

export function mcpHandlerWithIsError(message: string) {
  return http.post(MCP_ENDPOINT, async ({ request }) => {
    const body = (await request.json()) as JsonRpcRequest
    if (body.method === 'initialize') return mcpInitResponse(body.id)
    if (body.id === undefined) return new HttpResponse(null, { status: 202 })
    return HttpResponse.json({
      jsonrpc: '2.0',
      id: body.id,
      result: {
        content: [{ type: 'text', text: message }],
        isError: true,
      },
    })
  })
}

export function mcpHandlerWithModelingFixture(toolName: string, fixture: unknown) {
  return http.post(MCP_ENDPOINT, async ({ request }) => {
    const body = (await request.json()) as JsonRpcRequest
    if (body.method === 'initialize') return mcpInitResponse(body.id)
    if (body.id === undefined) return new HttpResponse(null, { status: 202 })
    if (body.method === 'tools/call') {
      const name = (body.params?.name as string | undefined) ?? ''
      const args = (body.params?.arguments as Record<string, unknown> | undefined) ?? {}
      if (name === toolName) return mcpToolResponse(body.id, fixture)
      const resolver = MODELING_TOOL_RESULTS[name]
      const result = resolver ? resolver(args) : {}
      return mcpToolResponse(body.id, result)
    }
    return HttpResponse.json({ jsonrpc: '2.0', id: body.id, result: {} })
  })
}

export function resolveModelingToolResult(
  toolName: string,
  args: Record<string, unknown>,
): unknown {
  const resolver = MODELING_TOOL_RESULTS[toolName]
  return resolver ? resolver(args) : {}
}
