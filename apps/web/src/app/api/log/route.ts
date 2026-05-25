import { callDexcomTool } from '@t1copilot/mcp-clients'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const LogEventBodySchema = z.object({
  eventType: z.enum(['insulin', 'carbs', 'exercise']),
  value: z.number(),
  unit: z.string(),
  subtype: z.string().optional(),
  food_description: z.string().optional(),
  notes: z.string().optional(),
})

export async function POST(req: Request): Promise<Response> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = LogEventBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
  }

  const { eventType, value, unit, subtype, food_description, notes } = parsed.data

  try {
    let result: unknown

    if (eventType === 'insulin') {
      result = await callDexcomTool('log_insulin', {
        units: value,
        type: subtype ?? 'rapid',
        ...(notes !== undefined ? { notes } : {}),
      })
    } else if (eventType === 'carbs') {
      result = await callDexcomTool('log_carbs', {
        grams: value,
        ...(food_description !== undefined ? { food_description } : {}),
        ...(notes !== undefined ? { notes } : {}),
      })
    } else {
      result = await callDexcomTool('log_exercise', {
        activity_type: unit,
        duration_minutes: value,
        ...(notes !== undefined ? { notes } : {}),
      })
    }

    const mcpResult = result as Record<string, unknown>
    const eventId = (mcpResult.eventId ?? mcpResult.id ?? 'logged') as string
    return NextResponse.json({
      success: eventId,
      message: (mcpResult.message as string | undefined) ?? `${eventType} logged successfully`,
    })
  } catch (error) {
    console.error('[/api/log] MCP call failed:', error)
    const message = error instanceof Error ? error.message : 'Failed to log event'
    return NextResponse.json({ success: false, error: message }, { status: 502 })
  }
}
