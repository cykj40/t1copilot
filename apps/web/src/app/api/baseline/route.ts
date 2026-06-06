import { updateBaselineParameters } from '@t1copilot/mcp-clients'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const BaselineUpdateSchema = z.object({
  correction_factor: z.number().positive(),
  insulin_to_carb_ratio: z.number().positive(),
  basal_dose: z.number().positive(),
  basal_timing: z.string().optional(),
  notes: z.string().optional(),
})

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
    return NextResponse.json(
      { success: false, error: 'Failed to update baseline parameters' },
      { status: 502 },
    )
  }
}
