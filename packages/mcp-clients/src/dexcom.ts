import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

export interface DexcomMcpClientOptions {
  serverCommand: string
  serverArgs?: string[]
}

export async function createDexcomMcpClient(options: DexcomMcpClientOptions) {
  const transport = new StdioClientTransport({
    command: options.serverCommand,
    args: options.serverArgs ?? [],
  })

  const client = new Client(
    { name: 't1copilot-dexcom-client', version: '0.0.1' },
    { capabilities: {} },
  )

  await client.connect(transport)
  return client
}

export type DexcomMcpClient = Awaited<ReturnType<typeof createDexcomMcpClient>>
