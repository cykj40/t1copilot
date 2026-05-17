import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

const DEXCOM_MCP_URL = 'https://dexcom-mcp-server.fly.dev/mcp'

export class DexcomMcpAuthError extends Error {
  constructor() {
    super('DEXCOM_MCP_AUTH_TOKEN is not set — refusing to connect unauthenticated')
    this.name = 'DexcomMcpAuthError'
  }
}

export async function createDexcomMcpClient(): Promise<Client> {
  const token = process.env.DEXCOM_MCP_AUTH_TOKEN
  if (!token) {
    throw new DexcomMcpAuthError()
  }

  const transport = new StreamableHTTPClientTransport(new URL(DEXCOM_MCP_URL), {
    requestInit: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
