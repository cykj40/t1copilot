import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

const DEXCOM_MCP_URL = process.env.DEXCOM_MCP_SERVER_URL
  ? `${process.env.DEXCOM_MCP_SERVER_URL}/mcp`
  : 'https://dexcom-mcp-server.fly.dev/mcp'

export async function createDexcomMcpClient(): Promise<Client> {
  const token = process.env.DEXCOM_MCP_AUTH_TOKEN

  const transport = new StreamableHTTPClientTransport(new URL(DEXCOM_MCP_URL), {
    requestInit: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
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
