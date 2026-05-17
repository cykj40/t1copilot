import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

export interface PelotonMcpClientOptions {
  serverCommand: string
  serverArgs?: string[]
}

export async function createPelotonMcpClient(options: PelotonMcpClientOptions) {
  const transport = new StdioClientTransport({
    command: options.serverCommand,
    args: options.serverArgs ?? [],
  })

  const client = new Client(
    { name: 't1copilot-peloton-client', version: '0.0.1' },
    { capabilities: {} },
  )

  await client.connect(transport)
  return client
}

export type PelotonMcpClient = Awaited<ReturnType<typeof createPelotonMcpClient>>
