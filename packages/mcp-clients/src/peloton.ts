import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

const PELOTON_MCP_URL = 'https://peloton-mcp-server.fly.dev/mcp'

export class PelotonMcpAuthError extends Error {
  constructor() {
    super('PELOTON_MCP_AUTH_TOKEN is not set — refusing to connect unauthenticated')
    this.name = 'PelotonMcpAuthError'
  }
}

export async function createPelotonMcpClient(): Promise<Client> {
  const token = process.env.PELOTON_MCP_AUTH_TOKEN
  if (!token) {
    throw new PelotonMcpAuthError()
  }

  const transport = new StreamableHTTPClientTransport(new URL(PELOTON_MCP_URL), {
    requestInit: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })

  const client = new Client(
    { name: 't1copilot-peloton-client', version: '0.0.1' },
    { capabilities: {} },
  )

  try {
    // StreamableHTTPClientTransport.sessionId is typed as `string | undefined` in the SDK
    // rather than the optional-only `string` required by Transport under exactOptionalPropertyTypes.
    await client.connect(transport as unknown as Parameters<typeof client.connect>[0])
  } catch (error) {
    throw new Error(
      `Failed to connect to Peloton MCP server: ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  return client
}

export type PelotonMcpClient = Awaited<ReturnType<typeof createPelotonMcpClient>>
