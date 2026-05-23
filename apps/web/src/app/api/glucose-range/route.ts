import { NextResponse } from 'next/server'
import { getGlucoseRange } from '@/lib/dexcom-mcp'

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  if (!start || !end) {
    return NextResponse.json({ error: 'start and end query params required' }, { status: 400 })
  }

  try {
    const range = await getGlucoseRange(start, end)
    return NextResponse.json(range)
  } catch (error) {
    console.error('[/api/glucose-range] MCP call failed:', error)
    return NextResponse.json({ error: 'Failed to fetch glucose range' }, { status: 502 })
  }
}
