import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { z } from 'zod'

const PELOTON_MCP_URL = process.env.PELOTON_MCP_SERVER_URL
  ? `${process.env.PELOTON_MCP_SERVER_URL}/mcp`
  : 'https://peloton-mcp-server.fly.dev/mcp'

const PELOTON_MCP_TIMEOUT_MS = 30000

// ── Tool registry ─────────────────────────────────────────────────────────────

export const PELOTON_TOOL_NAMES = [
  'peloton_get_workouts',
  'peloton_get_discipline_insights',
  'peloton_detect_hypoglycemia_risk',
  'peloton_analyze_glucose_correlation',
  'peloton_sync_workouts',
] as const

export type PelotonToolName = (typeof PELOTON_TOOL_NAMES)[number]

// ── Input schemas (one per tool) ──────────────────────────────────────────────

const PelotonGetWorkoutsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  page: z.number().int().min(0).default(0),
  sort_by: z.enum(['-created_at']).default('-created_at'),
})

const PelotonGetDisciplineInsightsSchema = z.object({
  format: z.enum(['summary', 'detailed']).default('summary'),
})

const PelotonDetectHypoglycemiaRiskSchema = z.object({
  lookback_hours: z.number().int().min(1).max(72).default(48),
})

const PelotonAnalyzeGlucoseCorrelationSchema = z.object({
  workout_id: z.string().min(1),
  glucose_readings: z
    .array(
      z.object({
        timestamp: z.string(),
        value: z.number(),
        trend: z.string().optional(),
      }),
    )
    .min(1),
  window_minutes_before: z.number().default(60),
  window_minutes_after: z.number().default(120),
})

const PelotonSyncWorkoutsSchema = z.object({
  force: z.boolean().default(false),
})

const TOOL_SCHEMAS = {
  peloton_get_workouts: PelotonGetWorkoutsSchema,
  peloton_get_discipline_insights: PelotonGetDisciplineInsightsSchema,
  peloton_detect_hypoglycemia_risk: PelotonDetectHypoglycemiaRiskSchema,
  peloton_analyze_glucose_correlation: PelotonAnalyzeGlucoseCorrelationSchema,
  peloton_sync_workouts: PelotonSyncWorkoutsSchema,
} satisfies Record<PelotonToolName, z.ZodTypeAny>

export type PelotonToolInput = {
  [K in PelotonToolName]: z.input<(typeof TOOL_SCHEMAS)[K]>
}

// ── Response types ────────────────────────────────────────────────────────────

export interface McpToolResponse {
  content: Array<{ type: string; text: string }>
  isError?: boolean
}

// ── Error classes ─────────────────────────────────────────────────────────────

export class PelotonMcpError extends Error {
  readonly tool: PelotonToolName
  readonly statusCode: number

  constructor(tool: PelotonToolName, statusCode: number, message: string) {
    super(message)
    this.name = 'PelotonMcpError'
    this.tool = tool
    this.statusCode = statusCode
  }
}

export class PelotonMcpAuthError extends Error {
  constructor() {
    super('PELOTON_MCP_AUTH_TOKEN is not set — refusing to connect unauthenticated')
    this.name = 'PelotonMcpAuthError'
  }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

async function createPelotonMcpClient(): Promise<Client> {
  const token = process.env.PELOTON_MCP_AUTH_TOKEN
  if (!token) {
    throw new PelotonMcpAuthError()
  }

  const noStoreInit = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  } as RequestInit

  const transport = new StreamableHTTPClientTransport(new URL(PELOTON_MCP_URL), {
    requestInit: noStoreInit,
    // Next.js patches global fetch and tries to cache MCP streaming responses — bypass it.
    // We also pre-check response.ok so non-2xx status codes are embedded in the error message
    // in a consistent, parseable format (the SDK stores the code in a property, not the message).
    fetch: async (url, init) => {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), PELOTON_MCP_TIMEOUT_MS)
      const onAbort = () => controller.abort()
      init?.signal?.addEventListener('abort', onAbort, { once: true })

      try {
        const response = await fetch(url, {
          ...init,
          cache: 'no-store',
          signal: controller.signal,
        } as RequestInit)
        if (!response.ok) {
          throw new Error(`Peloton MCP HTTP ${response.status}`)
        }
        return response
      } finally {
        clearTimeout(timeout)
        init?.signal?.removeEventListener('abort', onAbort)
      }
    },
  })

  const client = new Client(
    { name: 't1copilot-peloton-client', version: '0.0.1' },
    { capabilities: {} },
  )

  try {
    await client.connect(transport as unknown as Parameters<typeof client.connect>[0])
  } catch (error) {
    throw new Error(
      `Failed to connect to Peloton MCP server: ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  return client
}

function parseStatusCode(err: Error): number {
  const match = /\b(\d{3})\b/.exec(err.message)
  const code = match?.[1]
  return code !== undefined ? parseInt(code, 10) : 500
}

// ── Public API ────────────────────────────────────────────────────────────────

export function extractText(response: McpToolResponse): string {
  const first = response.content[0]
  if (!first || first.type !== 'text') {
    throw new Error('MCP response has no text content')
  }
  return first.text
}

export function extractJson<T>(response: McpToolResponse): T {
  return JSON.parse(extractText(response)) as T
}

export async function callPelotonTool<T extends PelotonToolName>(
  tool: T,
  args: PelotonToolInput[T],
): Promise<McpToolResponse> {
  // Validate args and apply schema defaults. ZodErrors propagate before any network call.
  let validatedArgs: Record<string, unknown>
  switch (tool) {
    case 'peloton_get_workouts':
      validatedArgs = PelotonGetWorkoutsSchema.parse(args) as Record<string, unknown>
      break
    case 'peloton_get_discipline_insights':
      validatedArgs = PelotonGetDisciplineInsightsSchema.parse(args) as Record<string, unknown>
      break
    case 'peloton_detect_hypoglycemia_risk':
      validatedArgs = PelotonDetectHypoglycemiaRiskSchema.parse(args) as Record<string, unknown>
      break
    case 'peloton_analyze_glucose_correlation':
      validatedArgs = PelotonAnalyzeGlucoseCorrelationSchema.parse(args) as Record<string, unknown>
      break
    case 'peloton_sync_workouts':
      validatedArgs = PelotonSyncWorkoutsSchema.parse(args) as Record<string, unknown>
      break
    default: {
      const _exhaustive: never = tool
      throw new Error(`Unknown Peloton tool: ${String(_exhaustive)}`)
    }
  }

  let client: Client | undefined
  try {
    client = await createPelotonMcpClient()
    const result = (await client.callTool({
      name: tool,
      arguments: validatedArgs,
    })) as McpToolResponse

    if (result.isError === true) {
      const msg = result.content[0]?.text ?? 'Peloton MCP tool returned an error'
      throw new PelotonMcpError(tool, 500, msg)
    }

    return result
  } catch (err) {
    if (err instanceof PelotonMcpError) throw err
    if (err instanceof PelotonMcpAuthError) throw err
    const error = err instanceof Error ? err : new Error(String(err))
    throw new PelotonMcpError(tool, parseStatusCode(error), error.message)
  } finally {
    await client?.close()
  }
}

export type PelotonMcpClient = Awaited<ReturnType<typeof createPelotonMcpClient>>
