import { unstable_noStore as noStore } from 'next/cache'
import { z } from 'zod'
import { env } from '@/config/env'

const HEALTH_TIMEOUT_MS = 5000

const healthResponseSchema = z.object({
  dexcom: z.enum(['connected', 'disconnected']),
  peloton: z.enum(['connected', 'disconnected']),
})

export type McpHealthResponse = z.infer<typeof healthResponseSchema>

async function checkServerHealth(baseUrl: string): Promise<'connected' | 'disconnected'> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS)

  try {
    const response = await fetch(`${baseUrl}/health`, {
      signal: controller.signal,
      cache: 'no-store',
    })
    return response.ok ? 'connected' : 'disconnected'
  } catch {
    return 'disconnected'
  } finally {
    clearTimeout(timeout)
  }
}

export async function getMcpServerHealth(): Promise<McpHealthResponse> {
  noStore()

  const [dexcomResult, pelotonResult] = await Promise.allSettled([
    checkServerHealth(env.DEXCOM_MCP_SERVER_URL),
    checkServerHealth(env.PELOTON_MCP_SERVER_URL),
  ])

  return healthResponseSchema.parse({
    dexcom: dexcomResult.status === 'fulfilled' ? dexcomResult.value : 'disconnected',
    peloton: pelotonResult.status === 'fulfilled' ? pelotonResult.value : 'disconnected',
  })
}
