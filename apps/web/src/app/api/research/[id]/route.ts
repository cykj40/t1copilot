import { NextResponse } from 'next/server'
import { GeminiResearchError, pollResearchCacheById } from '@/lib/research-store'

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params

  try {
    const row = await pollResearchCacheById(id)
    if (!row) {
      return NextResponse.json(
        { success: false, error: 'Research cache entry not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, research: row })
  } catch (error) {
    console.error('[GET /api/research/[id]] failed:', error)

    if (error instanceof GeminiResearchError) {
      const message = error.message
      if (message.includes('GEMINI_API_KEY is not set')) {
        return NextResponse.json({ success: false, error: message }, { status: 503 })
      }
      return NextResponse.json({ success: false, error: message }, { status: 502 })
    }

    const message = error instanceof Error ? error.message : 'Failed to fetch research result'
    return NextResponse.json({ success: false, error: message }, { status: 502 })
  }
}
