import 'server-only'

import { getNeonDb, type ResearchCacheRow, researchCache } from '@t1copilot/db/neon'
import {
  GeminiResearchError,
  pollResearchInteraction,
  startResearchInteraction,
} from '@t1copilot/mcp-clients'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { embedText } from '@/lib/insight-store'

const AGENT_SUMMARY_MAX_LENGTH = 500

export const StartResearchInputSchema = z.object({
  query: z.string().min(1).describe('The research question or topic to investigate'),
})

export const ResearchCacheResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  query: z.string(),
  interactionId: z.string(),
  status: z.enum(['pending', 'complete', 'error']),
  sourceUrl: z.string().nullable(),
  content: z.string().nullable(),
  agentSummary: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type ResearchCacheResponse = z.infer<typeof ResearchCacheResponseSchema>

export type StartResearchResult =
  | {
      success: true
      interactionId: string
      cacheId: string
      status: 'pending'
    }
  | {
      success: false
      error: string
    }

function truncateSummary(text: string): string {
  if (text.length <= AGENT_SUMMARY_MAX_LENGTH) return text
  return text.slice(0, AGENT_SUMMARY_MAX_LENGTH)
}

function toResponse(row: ResearchCacheRow): ResearchCacheResponse {
  return ResearchCacheResponseSchema.parse({
    id: row.id,
    userId: row.userId,
    query: row.query,
    interactionId: row.interactionId,
    status: row.status,
    sourceUrl: row.sourceUrl,
    content: row.content,
    agentSummary: row.agentSummary,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })
}

function resolveUserId(): string | null {
  return process.env.SYSTEM_USER_ID ?? null
}

export async function executeStartResearch(query: string): Promise<StartResearchResult> {
  const userId = resolveUserId()
  if (!userId) {
    return { success: false, error: 'SYSTEM_USER_ID not set' }
  }

  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    return { success: false, error: 'DATABASE_URL not set' }
  }

  try {
    const { interactionId } = await startResearchInteraction(query)

    const db = getNeonDb()
    const [row] = await db
      .insert(researchCache)
      .values({
        userId,
        query,
        interactionId,
        status: 'pending',
      })
      .returning({ id: researchCache.id })

    const cacheId = row?.id
    if (!cacheId) {
      return { success: false, error: 'Neon insert returned no id' }
    }

    return {
      success: true,
      interactionId,
      cacheId,
      status: 'pending',
    }
  } catch (err) {
    if (err instanceof GeminiResearchError) {
      return { success: false, error: err.message }
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to start research',
    }
  }
}

export async function getResearchCacheById(id: string): Promise<ResearchCacheRow | null> {
  const db = getNeonDb()
  const [row] = await db.select().from(researchCache).where(eq(researchCache.id, id)).limit(1)
  return row ?? null
}

export async function pollResearchCacheById(id: string): Promise<ResearchCacheResponse | null> {
  const row = await getResearchCacheById(id)
  if (!row) return null

  if (row.status !== 'pending') {
    return toResponse(row)
  }

  const pollResult = await pollResearchInteraction(row.interactionId)

  if (
    pollResult.status === 'created' ||
    pollResult.status === 'in_progress' ||
    pollResult.status === 'requires_action'
  ) {
    return toResponse(row)
  }

  const db = getNeonDb()
  const now = new Date()

  if (pollResult.status === 'failed') {
    const [updated] = await db
      .update(researchCache)
      .set({
        status: 'error',
        updatedAt: now,
      })
      .where(eq(researchCache.id, id))
      .returning()

    return updated ? toResponse(updated) : toResponse({ ...row, status: 'error', updatedAt: now })
  }

  const content = pollResult.text
  const sourceUrl = pollResult.sources[0]?.url ?? null
  const agentSummary = content !== null ? truncateSummary(content) : null

  let embedding: number[] | null = null
  if (content !== null && content.length > 0) {
    embedding = await embedText(content)
  }

  const [updated] = await db
    .update(researchCache)
    .set({
      status: 'complete',
      sourceUrl,
      content,
      agentSummary,
      ...(embedding !== null ? { embedding } : {}),
      updatedAt: now,
    })
    .where(eq(researchCache.id, id))
    .returning()

  return updated ? toResponse(updated) : toResponse(row)
}

export { GeminiResearchError }
