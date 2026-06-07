import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import {
  type AnalyzeTrendsResponse,
  AnalyzeTrendsResponseSchema,
  type DetectParameterDriftResponse,
  DetectParameterDriftResponseSchema,
  type GetAdaptiveInsightsResponse,
  GetAdaptiveInsightsResponseSchema,
} from './schemas/dexcom-insights.js'
import {
  type BaselineParametersResponse,
  BaselineParametersResponseSchema,
  type CompareExpectedVsActualArgs,
  type CompareExpectedVsActualResponse,
  CompareExpectedVsActualResponseSchema,
  type GlucoseStatisticsResponse,
  GlucoseStatisticsResponseSchema,
  type PredictGlucoseImpactArgs,
  type PredictGlucoseImpactResponse,
  PredictGlucoseImpactResponseSchema,
  type UpdateBaselineParametersArgs,
  type UpdateBaselineParametersResponse,
  UpdateBaselineParametersResponseSchema,
} from './schemas/dexcom-modeling.js'

export * from './schemas/dexcom-insights.js'
export * from './schemas/dexcom-modeling.js'

const DEXCOM_MCP_URL = process.env.DEXCOM_MCP_SERVER_URL
  ? `${process.env.DEXCOM_MCP_SERVER_URL}/mcp`
  : 'https://dexcom-mcp-server.fly.dev/mcp'

const DEXCOM_MCP_TIMEOUT_MS = 30000

export class DexcomMcpAuthError extends Error {
  constructor() {
    super('DEXCOM_MCP_AUTH_TOKEN is not set — refusing to connect unauthenticated')
    this.name = 'DexcomMcpAuthError'
  }
}

export class DexcomMcpError extends Error {
  readonly tool: string

  constructor(tool: string, message: string) {
    super(message)
    this.name = 'DexcomMcpError'
    this.tool = tool
  }
}

export async function createDexcomMcpClient(): Promise<Client> {
  const token = process.env.DEXCOM_MCP_AUTH_TOKEN
  if (!token) {
    throw new DexcomMcpAuthError()
  }

  const noStoreInit = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  } as RequestInit

  const transport = new StreamableHTTPClientTransport(new URL(DEXCOM_MCP_URL), {
    requestInit: noStoreInit,
    // Next.js patches global fetch and tries to cache MCP streaming responses — bypass it.
    fetch: async (url, init) => {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), DEXCOM_MCP_TIMEOUT_MS)
      const onAbort = () => controller.abort()
      init?.signal?.addEventListener('abort', onAbort, { once: true })

      try {
        return await fetch(url, {
          ...init,
          cache: 'no-store',
          signal: controller.signal,
        } as RequestInit)
      } finally {
        clearTimeout(timeout)
        init?.signal?.removeEventListener('abort', onAbort)
      }
    },
  })

  const client = new Client(
    { name: 't1copilot-dexcom-client', version: '0.0.1' },
    { capabilities: {} },
  )

  try {
    // StreamableHTTPClientTransport.sessionId is typed as `string | undefined` in the SDK
    // rather than the optional-only `string` required by Transport under exactOptionalPropertyTypes.
    await client.connect(transport as unknown as Parameters<typeof client.connect>[0])
  } catch (error) {
    throw new Error(
      `Failed to connect to Dexcom MCP server: ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  return client
}

export type DexcomMcpClient = Awaited<ReturnType<typeof createDexcomMcpClient>>

interface McpTextContent {
  type: 'text'
  text: string
}

interface McpCallToolResult {
  content: McpTextContent[]
  isError?: boolean
}

export async function callDexcomTool(
  toolName: string,
  args: Record<string, unknown> = {},
): Promise<unknown> {
  const client = await createDexcomMcpClient()
  try {
    const result = (await client.callTool({ name: toolName, arguments: args })) as McpCallToolResult
    if (result.isError === true) {
      throw new Error(`Dexcom MCP tool error: ${JSON.stringify(result.content)}`)
    }
    const first = result.content[0]
    if (!first || first.type !== 'text') {
      throw new Error('Unexpected Dexcom MCP response format')
    }
    return JSON.parse(first.text) as unknown
  } finally {
    await client.close()
  }
}

// ── Modeling tool wrappers ────────────────────────────────────────────────────

export async function getBaselineParameters(): Promise<BaselineParametersResponse> {
  const tool = 'get_baseline_parameters'
  try {
    const raw = await callDexcomTool(tool)
    return BaselineParametersResponseSchema.parse(raw)
  } catch (error) {
    if (error instanceof DexcomMcpAuthError) throw error
    const message = error instanceof Error ? error.message : String(error)
    throw new DexcomMcpError(tool, message)
  }
}

export async function predictGlucoseImpact(
  args: PredictGlucoseImpactArgs,
): Promise<PredictGlucoseImpactResponse> {
  const tool = 'predict_glucose_impact'
  try {
    const raw = await callDexcomTool(tool, args as Record<string, unknown>)
    return PredictGlucoseImpactResponseSchema.parse(raw)
  } catch (error) {
    if (error instanceof DexcomMcpAuthError) throw error
    const message = error instanceof Error ? error.message : String(error)
    throw new DexcomMcpError(tool, message)
  }
}

export async function compareExpectedVsActual(
  args: CompareExpectedVsActualArgs,
): Promise<CompareExpectedVsActualResponse> {
  const tool = 'compare_expected_vs_actual'
  try {
    const raw = await callDexcomTool(tool, args as Record<string, unknown>)
    return CompareExpectedVsActualResponseSchema.parse(raw)
  } catch (error) {
    if (error instanceof DexcomMcpAuthError) throw error
    const message = error instanceof Error ? error.message : String(error)
    throw new DexcomMcpError(tool, message)
  }
}

export async function getGlucoseStatistics(args?: {
  hours?: number
}): Promise<GlucoseStatisticsResponse> {
  const tool = 'get_glucose_statistics'
  try {
    const raw = await callDexcomTool(tool, args ?? {})
    return GlucoseStatisticsResponseSchema.parse(raw)
  } catch (error) {
    if (error instanceof DexcomMcpAuthError) throw error
    const message = error instanceof Error ? error.message : String(error)
    throw new DexcomMcpError(tool, message)
  }
}

export async function updateBaselineParameters(
  args: UpdateBaselineParametersArgs,
): Promise<UpdateBaselineParametersResponse> {
  const tool = 'update_baseline_parameters'
  if (args.confirmed !== true) {
    throw new DexcomMcpError(tool, 'confirmed must be true before updating baseline parameters')
  }
  try {
    const raw = await callDexcomTool(tool, args as Record<string, unknown>)
    return UpdateBaselineParametersResponseSchema.parse(raw)
  } catch (error) {
    if (error instanceof DexcomMcpAuthError) throw error
    if (error instanceof DexcomMcpError) throw error
    const message = error instanceof Error ? error.message : String(error)
    throw new DexcomMcpError(tool, message)
  }
}

// ── Insight tool wrappers ─────────────────────────────────────────────────────

export async function analyzeTrends(args?: { days?: number }): Promise<AnalyzeTrendsResponse> {
  const tool = 'analyze_trends'
  try {
    const raw = await callDexcomTool(tool, args ?? {})
    return AnalyzeTrendsResponseSchema.parse(raw)
  } catch (error) {
    if (error instanceof DexcomMcpAuthError) throw error
    const message = error instanceof Error ? error.message : String(error)
    throw new DexcomMcpError(tool, message)
  }
}

export async function detectParameterDrift(args?: {
  days?: number
}): Promise<DetectParameterDriftResponse> {
  const tool = 'detect_parameter_drift'
  try {
    const raw = await callDexcomTool(tool, args ?? {})
    return DetectParameterDriftResponseSchema.parse(raw)
  } catch (error) {
    if (error instanceof DexcomMcpAuthError) throw error
    const message = error instanceof Error ? error.message : String(error)
    throw new DexcomMcpError(tool, message)
  }
}

export async function getAdaptiveInsights(args?: {
  days?: number
}): Promise<GetAdaptiveInsightsResponse> {
  const tool = 'get_adaptive_insights'
  try {
    const raw = await callDexcomTool(tool, args ?? {})
    return GetAdaptiveInsightsResponseSchema.parse(raw)
  } catch (error) {
    if (error instanceof DexcomMcpAuthError) throw error
    const message = error instanceof Error ? error.message : String(error)
    throw new DexcomMcpError(tool, message)
  }
}
