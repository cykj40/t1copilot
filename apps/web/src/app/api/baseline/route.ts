import {
  DexcomMcpAuthError,
  getBaselineParameters,
  updateBaselineParameters,
} from '@t1copilot/mcp-clients'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const BaselineUpdateSchema = z.object({
  correction_factor: z.number().positive(),
  insulin_to_carb_ratio: z.number().positive(),
  basal_dose: z.number().positive(),
  basal_timing: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(): Promise<Response> {
  try {
    const parameters = await getBaselineParameters()
    return NextResponse.json({ success: true, parameters })
  } catch (error) {
    console.error('[GET /api/baseline] MCP call failed:', error)
    if (error instanceof DexcomMcpAuthError) {
      return NextResponse.json(
        { success: false, error: 'Dexcom MCP auth token not configured' },
        { status: 503 },
      )
    }
    const message = error instanceof Error ? error.message : 'Failed to load baseline parameters'
    return NextResponse.json({ success: false, error: message }, { status: 502 })
  }
}

export async function POST(req: Request): Promise<Response> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = BaselineUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
  }

  const { correction_factor, insulin_to_carb_ratio, basal_dose, basal_timing, notes } = parsed.data

  try {
    const updateArgs = {
      correction_factor,
      insulin_to_carb_ratio,
      basal_dose,
      confirmed: true as const,
      ...(basal_timing !== undefined ? { basal_timing } : {}),
      ...(notes !== undefined ? { notes } : {}),
    }

    const result = await updateBaselineParameters(updateArgs)
    return NextResponse.json({
      success: true,
      updatedParameters: result.updatedParameters,
      note: result.note,
    })
  } catch (error) {
    console.error('[/api/baseline] MCP call failed:', error)
    if (error instanceof Error) {
      console.error('[/api/baseline] error type:', error.constructor.name)
      console.error('[/api/baseline] error message:', error.message)
    }

    if (error instanceof DexcomMcpAuthError) {
      return NextResponse.json(
        { success: false, error: 'Dexcom MCP auth token not configured' },
        { status: 503 },
      )
    }

    const message = error instanceof Error ? error.message : 'Failed to update baseline parameters'
    return NextResponse.json({ success: false, error: message }, { status: 502 })
  }
}
