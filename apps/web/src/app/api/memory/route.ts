import { agentInsights, getNeonDb } from '@t1copilot/db'
import { desc, eq, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { saveInsight } from '@/lib/insight-store'

// ── Shared userId guard ───────────────────────────────────────────────────────

function getUserId(): string | undefined {
  return process.env.SYSTEM_USER_ID
}

// ── POST /api/memory — import a memory from localStorage ─────────────────────

const ImportMemorySchema = z.object({
  content: z.string().min(1).max(2000),
  type: z.enum(['pattern', 'preference', 'parameter_note', 'risk_flag']),
  source: z.string().min(1).max(200),
  confidence: z.number().min(0).max(1).optional().default(0.7),
})

export async function POST(req: Request): Promise<Response> {
  const userId = getUserId()
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'SYSTEM_USER_ID not configured' },
      { status: 503 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = ImportMemorySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
  }

  const { content, type, source, confidence } = parsed.data

  try {
    const result = await saveInsight({
      summary: content,
      detail: { type, source, importedFromLocalStorage: true },
      agentId: 'insight',
      insightType: 'pattern',
      confidence,
    })

    if (result.skipped) {
      return NextResponse.json(
        { success: false, error: result.reason ?? 'Write skipped' },
        { status: 503 },
      )
    }

    return NextResponse.json({ success: true, id: result.id })
  } catch (err) {
    console.error('[POST /api/memory] saveInsight failed:', err)
    return NextResponse.json({ success: false, error: 'Failed to save memory' }, { status: 502 })
  }
}

// ── GET /api/memory — list recent memories ────────────────────────────────────

export async function GET(): Promise<Response> {
  const userId = getUserId()
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'SYSTEM_USER_ID not configured' },
      { status: 503 },
    )
  }

  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    return NextResponse.json({ success: true, memories: [] })
  }

  try {
    const db = getNeonDb()
    const rows = await db
      .select({
        id: agentInsights.id,
        summary: agentInsights.summary,
        insightType: agentInsights.insightType,
        confidence: agentInsights.confidence,
        createdAt: agentInsights.createdAt,
      })
      .from(agentInsights)
      .where(eq(agentInsights.userId, userId))
      .orderBy(desc(agentInsights.createdAt))
      .limit(50)

    return NextResponse.json({ success: true, memories: rows })
  } catch (err) {
    console.error('[GET /api/memory] query failed:', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch memories' }, { status: 502 })
  }
}

// ── DELETE /api/memory — delete one or all ────────────────────────────────────

const DeleteMemorySchema = z.object({
  id: z.string().min(1).optional(),
  all: z.boolean().optional(),
})

export async function DELETE(req: Request): Promise<Response> {
  const userId = getUserId()
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'SYSTEM_USER_ID not configured' },
      { status: 503 },
    )
  }

  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    return NextResponse.json({ success: true, deleted: 0 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = DeleteMemorySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
  }

  const { id, all } = parsed.data

  if (!id && !all) {
    return NextResponse.json({ success: false, error: 'Provide id or all:true' }, { status: 400 })
  }

  try {
    const db = getNeonDb()

    if (all === true) {
      await db.delete(agentInsights).where(eq(agentInsights.userId, userId))
      return NextResponse.json({ success: true, deleted: 'all' })
    }

    if (id) {
      await db
        .delete(agentInsights)
        .where(sql`${agentInsights.userId} = ${userId} AND ${agentInsights.id} = ${id}`)
      return NextResponse.json({ success: true, deleted: id })
    }

    return NextResponse.json({ success: false, error: 'Unreachable' }, { status: 400 })
  } catch (err) {
    console.error('[DELETE /api/memory] failed:', err)
    return NextResponse.json({ success: false, error: 'Failed to delete memory' }, { status: 502 })
  }
}
