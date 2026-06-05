import { HttpResponse, http } from 'msw'

export const PELOTON_MCP_BASE_URL = 'https://peloton-mcp-server.fly.dev'
export const PELOTON_MCP_ENDPOINT = `${PELOTON_MCP_BASE_URL}/mcp`

// ── Fixtures ──────────────────────────────────────────────────────────────────

export const MOCK_PELOTON_WORKOUTS = [
  {
    id: 'w1',
    discipline: 'Cycling',
    durationMinutes: 45,
    startTime: '2026-05-23T10:00:00.000Z',
    hoursAgo: 2,
    glucoseDropMgdl: 28,
    hypoRisk: 'moderate',
  },
  {
    id: 'w2',
    discipline: 'Running',
    durationMinutes: 30,
    startTime: '2026-05-22T10:00:00.000Z',
    hoursAgo: 26,
    glucoseDropMgdl: 18,
    hypoRisk: 'low',
  },
]

export const MOCK_PELOTON_DISCIPLINE_INSIGHTS = [
  { discipline: 'Cycling', workoutCount: 12, avgGlucoseDrop: 25, avgHypoRisk: 'moderate' },
  { discipline: 'Running', workoutCount: 8, avgGlucoseDrop: 18, avgHypoRisk: 'low' },
]

export const MOCK_PELOTON_CORRELATION = {
  workoutId: 'w1',
  discipline: 'Cycling',
  durationMinutes: 45,
  startTime: '2026-05-23T10:00:00.000Z',
  hoursAgo: 2,
  glucoseDropMgdl: 28,
  hypoRisk: 'moderate',
  preWorkoutGlucose: 148,
  postWorkoutGlucose: 96,
}

// ── MCP protocol helpers ──────────────────────────────────────────────────────

const MCP_INIT_RESULT = {
  protocolVersion: '2024-11-05',
  capabilities: { tools: {} },
  serverInfo: { name: 'mock-peloton-mcp', version: '1.0.0' },
}

const TOOL_RESULTS: Record<string, unknown> = {
  peloton_get_workouts: MOCK_PELOTON_WORKOUTS,
  peloton_get_discipline_insights: MOCK_PELOTON_DISCIPLINE_INSIGHTS,
  peloton_analyze_glucose_correlation: MOCK_PELOTON_CORRELATION,
  peloton_detect_hypoglycemia_risk: { riskLevel: 'moderate', lookbackHours: 48 },
  peloton_sync_workouts: { synced: 0, skipped: 0 },
}

interface JsonRpcRequest {
  jsonrpc: string
  method: string
  id?: number
  params?: Record<string, unknown>
}

function mcpInitResponse(id: number | undefined) {
  return new HttpResponse(JSON.stringify({ jsonrpc: '2.0', id, result: MCP_INIT_RESULT }), {
    headers: {
      'Content-Type': 'application/json',
      'Mcp-Session-Id': 'test-session-peloton',
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

export const pelotonHandlers = [
  http.post(PELOTON_MCP_ENDPOINT, async ({ request }) => {
    const body = (await request.json()) as JsonRpcRequest

    if (body.method === 'initialize') {
      return mcpInitResponse(body.id)
    }

    if (body.id === undefined) {
      return new HttpResponse(null, { status: 202 })
    }

    if (body.method === 'tools/call') {
      const toolName = (body.params?.name as string | undefined) ?? ''
      const result = TOOL_RESULTS[toolName] ?? {}
      return mcpToolResponse(body.id, result)
    }

    return HttpResponse.json({ jsonrpc: '2.0', id: body.id, result: {} })
  }),

  http.delete(PELOTON_MCP_ENDPOINT, () => new HttpResponse(null, { status: 200 })),

  http.get(`${PELOTON_MCP_BASE_URL}/health`, () => new HttpResponse(null, { status: 200 })),
]
