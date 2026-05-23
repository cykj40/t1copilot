import { HttpResponse, http } from 'msw'

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

// DailySummary has nested statistics — matches DailySummarySchema
export const MOCK_DAILY_SUMMARY = {
  date: '2026-05-23',
  statistics: MOCK_STATISTICS,
  readingCount: 288,
}

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
      const result = TOOL_RESULTS[toolName] ?? {}
      return mcpToolResponse(body.id, result)
    }

    return HttpResponse.json({ jsonrpc: '2.0', id: body.id, result: {} })
  }),

  http.delete(MCP_ENDPOINT, () => new HttpResponse(null, { status: 200 })),
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
    const result = name === toolName ? fixture : (TOOL_RESULTS[name] ?? {})
    return mcpToolResponse(body.id, result)
  })
}
