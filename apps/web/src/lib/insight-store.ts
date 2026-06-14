import 'server-only'

/**
 * insight-store.ts
 *
 * Server-side only. Embeds an insight summary and persists the row to the
 * agent_insights Neon table. Used by the render_insight_summary tool execute
 * handler in /api/chat/route.ts (wired in Step 3).
 *
 * Self-hosted / single-user: userId comes from SYSTEM_USER_ID env var.
 * If not set, the write is skipped and a warning is logged — this keeps
 * the app functional during local dev without a Neon connection.
 */

import { agentInsights, getNeonDb, type NewAgentInsightRow } from '@t1copilot/db/neon'
import { sql } from 'drizzle-orm'
import OpenAI from 'openai'

const EMBED_MODEL = 'text-embedding-3-small'
const EMBED_DIMENSIONS = 1536

async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')

  const client = new OpenAI({ apiKey })
  const response = await client.embeddings.create({
    model: EMBED_MODEL,
    input: text,
    dimensions: EMBED_DIMENSIONS,
  })

  const embedding = response.data[0]?.embedding
  if (!embedding || embedding.length !== EMBED_DIMENSIONS) {
    throw new Error(`Unexpected embedding dimensions: ${String(embedding?.length ?? 0)}`)
  }

  return embedding
}

export { embedText }

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SaveInsightArgs {
  summary: string
  detail: Record<string, unknown>
  /** Matches the agent_id enum: 'insight' | 'glucose' | etc. */
  agentId: NewAgentInsightRow['agentId']
  /** Matches the insight_type enum: 'weekly_summary' | 'pattern' | etc. */
  insightType: NewAgentInsightRow['insightType']
  /** 0–1 confidence score. Optional. */
  confidence?: number
  /** ISO 8601 expiry timestamp. Optional. */
  expiresAt?: Date
}

export interface SaveInsightResult {
  id: string
  skipped: boolean
  reason?: string
}

// ── saveInsight ───────────────────────────────────────────────────────────────

/**
 * Embeds the summary and writes a row to agent_insights.
 *
 * Returns { skipped: true } if DATABASE_URL or SYSTEM_USER_ID is unset
 * (graceful degradation for local dev without Neon).
 *
 * Throws only if embedding or the Drizzle insert hard-fails after setup is
 * confirmed — callers should try/catch and log, not crash the request.
 */
export async function saveInsight(args: SaveInsightArgs): Promise<SaveInsightResult> {
  const userId = process.env.SYSTEM_USER_ID
  if (!userId) {
    console.warn('[saveInsight] SYSTEM_USER_ID not set — skipping Neon write')
    return { id: '', skipped: true, reason: 'SYSTEM_USER_ID not set' }
  }

  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.warn('[saveInsight] DATABASE_URL not set — skipping Neon write')
    return { id: '', skipped: true, reason: 'DATABASE_URL not set' }
  }

  // Embed the summary text
  const embedding = await embedText(args.summary)

  const db = getNeonDb()

  const [row] = await db
    .insert(agentInsights)
    .values({
      userId,
      agentId: args.agentId,
      insightType: args.insightType,
      summary: args.summary,
      detail: args.detail,
      embedding,
      ...(args.confidence !== undefined ? { confidence: args.confidence } : {}),
      ...(args.expiresAt !== undefined ? { expiresAt: args.expiresAt } : {}),
      requiresApproval: false,
    } satisfies Omit<NewAgentInsightRow, 'id' | 'createdAt'>)
    .returning({ id: agentInsights.id })

  const id = row?.id
  if (!id) throw new Error('Neon insert returned no id')

  return { id, skipped: false }
}

/**
 * Embeds the query text and retrieves the top-5 most semantically similar
 * insights from agent_insights via PGVector cosine distance.
 *
 * Returns an empty string if SYSTEM_USER_ID, DATABASE_URL, or OPENAI_API_KEY
 * are not set — graceful degradation for local dev.
 *
 * Uses raw sql`<=>` operator with ::vector cast. Do NOT use cosineDistance()
 * from drizzle-orm — it does not work with the customType vector column
 * (drizzle-orm issue #5358: computed distance returns 0 on all rows).
 */
export async function retrieveMemoryContext(queryText: string, limit = 5): Promise<string> {
  const userId = process.env.SYSTEM_USER_ID
  if (!userId) return ''

  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) return ''

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return ''

  try {
    const embedding = await embedText(queryText)
    const queryVec = `[${embedding.join(',')}]`

    const db = getNeonDb()

    const rows = await db
      .select({
        id: agentInsights.id,
        summary: agentInsights.summary,
        insightType: agentInsights.insightType,
        createdAt: agentInsights.createdAt,
      })
      .from(agentInsights)
      .where(sql`${agentInsights.userId} = ${userId} AND ${agentInsights.embedding} IS NOT NULL`)
      .orderBy(sql`${agentInsights.embedding} <=> ${queryVec}::vector`)
      .limit(limit)

    if (rows.length === 0) return ''

    const lines = rows.map((row) => {
      const date = row.createdAt
        ? new Date(row.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })
        : ''
      return `[${row.insightType}${date ? ` · ${date}` : ''}] ${row.summary}`
    })

    return lines.join('\n')
  } catch (err) {
    console.error('[retrieveMemoryContext] failed:', err)
    return ''
  }
}
