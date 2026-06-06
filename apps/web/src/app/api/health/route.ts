import { unstable_noStore as noStore } from 'next/cache'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getMcpServerHealth } from '@/lib/mcp-health'

const healthResponseSchema = z.object({
  dexcom: z.enum(['connected', 'disconnected']),
  peloton: z.enum(['connected', 'disconnected']),
})

export async function GET(): Promise<Response> {
  noStore()

  try {
    const health = await getMcpServerHealth()
    return NextResponse.json(health)
  } catch (error) {
    console.error('[/api/health] failed:', error)
    return NextResponse.json(
      healthResponseSchema.parse({ dexcom: 'disconnected', peloton: 'disconnected' }),
    )
  }
}
