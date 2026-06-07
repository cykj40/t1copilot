import { HttpResponse, http } from 'msw'
import { resolveModelingToolResult } from './dexcom-modeling.js'

// The MCP SDK posts JSON-RPC messages to /mcp, not to /tools/{name}.
// These handlers implement a minimal MCP Streamable HTTP server.
export const MCP_BASE_URL = 'https://dexcom-mcp-server.fly.dev'
export const MCP_ENDPOINT = `${MCP_BASE_URL}/mcp`

// ── Fixtures — shapes match the actual Zod schemas in dexcom-mcp.ts ───────────

const MOCK_STATISTICS = {
  average: 138,
  standardDeviation: 20,
  min: 72,
  max: 210,
  timeInRange: 74,
  timeBelowRange: 4,
  timeAboveRange: 22,
  readingCount: 288,
  coefficientOfVariation: 15,
}

export const MOCK_LATEST_GLUCOSE = {
  value: 142,
  unit: 'mg/dL',
  trend: 'flat',
  trendDescription: 'Steady',
  timestamp: '2026-05-23T12:00:00.000Z',
  ageMinutes: 4,
  source: 'share',
}

export const MOCK_GLUCOSE_RANGE = {
  timeRange: {
    start: '2026-05-23T00:00:00.000Z',
    end: '2026-05-23T23:59:59.000Z',
  },
  readingCount: 3,
  statistics: MOCK_STATISTICS,
  readings: [
    { value: 142, trend: 'flat', timestamp: '2026-05-23T12:00:00.000Z' },
    { value: 155, trend: 'fortyFiveUp', timestamp: '2026-05-23T12:05:00.000Z' },
    { value: 168, trend: 'singleUp', timestamp: '2026-05-23T12:10:00.000Z' },
  ],
}

// get_daily_summary currently returns the same shape as get_latest_glucose.
export const MOCK_DAILY_SUMMARY = MOCK_LATEST_GLUCOSE

export const MOCK_LOW_GLUCOSE = {
  ...MOCK_LATEST_GLUCOSE,
  value: 58,
  trend: 'singleDown',
  trendDescription: 'Falling',
}

export const MOCK_CRITICAL_LOW_GLUCOSE = {
  ...MOCK_LATEST_GLUCOSE,
  value: 48,
  trend: 'doubleDown',
  trendDescription: 'Falling rapidly',
}

export const MOCK_HIGH_GLUCOSE = {
  ...MOCK_LATEST_GLUCOSE,
  value: 265,
  trend: 'singleUp',
  trendDescription: 'Rising',
}

export const MOCK_STALE_GLUCOSE = {
  ...MOCK_LATEST_GLUCOSE,
  ageMinutes: 22,
}

const MOCK_INSIGHT_STATS = {
  average: 138,
  standardDeviation: 20,
  min: 72,
  max: 210,
  timeInRange: 74,
  timeBelowRange: 4,
  timeAboveRange: 22,
  readingCount: 288,
  coefficientOfVariation: 15,
}

export const MOCK_ANALYZE_TRENDS = {
  period: {
    start: '2026-05-31T00:00:00.000Z',
    end: '2026-06-07T00:00:00.000Z',
    days: 7,
  },
  overallStatistics: MOCK_INSIGHT_STATS,
  overnightPattern: {
    statistics: {
      ...MOCK_INSIGHT_STATS,
      average: 125,
      timeInRange: 82,
      readingCount: 84,
    },
    readingCount: 84,
    note: 'Overnight average stable with mild dawn rise between 5–7 AM.',
  },
  postMealPatterns: {
    mealsAnalyzed: 5,
    averageSpike: 45,
    recentMeals: [
      {
        timestamp: '2026-06-05T12:30:00.000Z',
        preGlucose: 110,
        maxGlucose: 168,
        spike: 58,
        carbData: {
          id: 1,
          grams: 45,
          foodDescription: 'Lunch — rice bowl',
          estimatedGi: 'medium',
          timestamp: '2026-06-05T12:30:00.000Z',
          createdAt: '2026-06-05T12:30:00.000Z',
        },
      },
    ],
    note: 'Post-meal spikes consistent with moderate GI meals.',
  },
  exerciseImpact: {
    sessionsAnalyzed: 3,
    recentSessions: [
      {
        timestamp: '2026-06-04T10:00:00.000Z',
        preGlucose: 148,
        minGlucose: 96,
        drop: 52,
        exerciseData: {
          id: 1,
          activityType: 'Cycling',
          durationMinutes: 45,
          intensity: 'moderate',
          timestamp: '2026-06-04T10:00:00.000Z',
          createdAt: '2026-06-04T10:00:00.000Z',
        },
      },
    ],
    note: 'Exercise sessions show predictable glucose drop within 90 minutes.',
  },
  disclaimer: 'Patterns are observational only. Discuss with your care team.',
}

export const MOCK_DETECT_PARAMETER_DRIFT = {
  analysisWindow: '14 days',
  observationCount: 8,
  driftDetected: false,
  findings: {
    isfDrift: null,
    icrDrift: null,
    patterns: [],
  },
  recentObservations: [
    {
      type: 'isf_deviation',
      deviation: '+12%',
      hypothesis: 'Correction doses slightly less effective than expected',
      timestamp: '2026-06-03T14:00:00.000Z',
    },
  ],
  recommendation: 'No significant parameter drift detected. Continue current regimen.',
  disclaimer: 'Drift analysis is observational. Confirm any changes with your care team.',
}

export const MOCK_GET_ADAPTIVE_INSIGHTS = {
  analysisWindow: '14 days',
  baselineParameters: {
    isf: 30,
    icr: 4,
    basalDose: 30,
    basalTiming: 'morning',
    updatedAt: '2026-06-04T14:07:59Z',
  },
  observationsSummary:
    'Predictions aligned with actuals within 15% on average over the analysis window.',
  detectedDrift: {
    isfDrift: null,
    icrDrift: null,
    patterns: [],
  },
  recentObservations: [
    {
      type: 'prediction_accuracy',
      deviation: '−8%',
      hypothesis: 'Carb predictions slightly overestimated rise',
      timestamp: '2026-06-02T18:00:00.000Z',
    },
  ],
  recommendation: 'Continue monitoring carb-heavy meals for prediction accuracy.',
  disclaimer: 'Adaptive insights are model-based. Individual response varies.',
}

// ── MCP protocol helpers ──────────────────────────────────────────────────────

const MCP_INIT_RESULT = {
  protocolVersion: '2024-11-05',
  capabilities: { tools: {} },
  serverInfo: { name: 'mock-dexcom-mcp', version: '1.0.0' },
}

const TOOL_RESULTS: Record<string, unknown> = {
  get_latest_glucose: MOCK_LATEST_GLUCOSE,
  get_glucose_range: MOCK_GLUCOSE_RANGE,
  get_daily_summary: MOCK_DAILY_SUMMARY,
  analyze_trends: MOCK_ANALYZE_TRENDS,
  detect_parameter_drift: MOCK_DETECT_PARAMETER_DRIFT,
  get_adaptive_insights: MOCK_GET_ADAPTIVE_INSIGHTS,
}

interface JsonRpcRequest {
  jsonrpc: string
  method: string
  id?: number
  params?: Record<string, unknown>
}

export function mcpInitResponse(id: number | undefined) {
  return new HttpResponse(JSON.stringify({ jsonrpc: '2.0', id, result: MCP_INIT_RESULT }), {
    headers: {
      'Content-Type': 'application/json',
      'Mcp-Session-Id': 'test-session-id',
    },
  })
}

function mcpToolResponse(id: number | undefined, data: unknown) {
  return HttpResponse.json({
    jsonrpc: '2.0',
    id,
    result: { content: [{ type: 'text', text: JSON.stringify(data) }] },
  })
}

// ── Base handlers ─────────────────────────────────────────────────────────────

export const dexcomHandlers = [
  http.post(MCP_ENDPOINT, async ({ request }) => {
    const body = (await request.json()) as JsonRpcRequest

    if (body.method === 'initialize') {
      return mcpInitResponse(body.id)
    }

    // Notifications have no id — return 202, no body
    if (body.id === undefined) {
      return new HttpResponse(null, { status: 202 })
    }

    if (body.method === 'tools/call') {
      const toolName = (body.params?.name as string | undefined) ?? ''
      const args = (body.params?.arguments as Record<string, unknown> | undefined) ?? {}
      const result = TOOL_RESULTS[toolName] ?? resolveModelingToolResult(toolName, args) ?? {}
      return mcpToolResponse(body.id, result)
    }

    return HttpResponse.json({ jsonrpc: '2.0', id: body.id, result: {} })
  }),

  http.delete(MCP_ENDPOINT, () => new HttpResponse(null, { status: 200 })),

  http.get(`${MCP_BASE_URL}/health`, () => new HttpResponse(null, { status: 200 })),
]

// ── Per-test override helpers ─────────────────────────────────────────────────

/**
 * Returns an MSW handler that makes initialize succeed but returns `badData`
 * for all tool calls — useful for testing Zod validation failure paths.
 */
export function mcpHandlerWithBadToolResponse(badData: unknown) {
  return http.post(MCP_ENDPOINT, async ({ request }) => {
    const body = (await request.json()) as JsonRpcRequest
    if (body.method === 'initialize') return mcpInitResponse(body.id)
    if (body.id === undefined) return new HttpResponse(null, { status: 202 })
    return mcpToolResponse(body.id, badData)
  })
}

/**
 * Returns an MSW handler that makes a specific tool return the given fixture
 * while other tools use the default fixtures.
 */
export function mcpHandlerWithFixture(toolName: string, fixture: unknown) {
  return http.post(MCP_ENDPOINT, async ({ request }) => {
    const body = (await request.json()) as JsonRpcRequest
    if (body.method === 'initialize') return mcpInitResponse(body.id)
    if (body.id === undefined) return new HttpResponse(null, { status: 202 })
    const name = (body.params?.name as string | undefined) ?? ''
    const args = (body.params?.arguments as Record<string, unknown> | undefined) ?? {}
    const result =
      name === toolName
        ? fixture
        : (TOOL_RESULTS[name] ?? resolveModelingToolResult(name, args) ?? {})
    return mcpToolResponse(body.id, result)
  })
}

export interface CapturedMcpToolCall {
  name: string
  args: Record<string, unknown>
}

/**
 * Returns an MSW handler that records each tools/call request and returns a success payload.
 * Pass `onCapture` to assert against tool name and arguments in tests.
 */
export function mcpHandlerCapturingToolCalls(
  onCapture: (call: CapturedMcpToolCall) => void,
  result: unknown = { eventId: 'test-event-id' },
) {
  return http.post(MCP_ENDPOINT, async ({ request }) => {
    const body = (await request.json()) as JsonRpcRequest
    if (body.method === 'initialize') return mcpInitResponse(body.id)
    if (body.id === undefined) return new HttpResponse(null, { status: 202 })
    if (body.method === 'tools/call') {
      const name = (body.params?.name as string | undefined) ?? ''
      const args = (body.params?.arguments as Record<string, unknown> | undefined) ?? {}
      onCapture({ name, args })
      return mcpToolResponse(body.id, result)
    }
    return HttpResponse.json({ jsonrpc: '2.0', id: body.id, result: {} })
  })
}
