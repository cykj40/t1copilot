'use server'

import { getNeonDb, researchCache } from '@t1copilot/db/neon'
import { desc, eq } from 'drizzle-orm'
import { unstable_noStore as noStore } from 'next/cache'
import { z } from 'zod'

export const ResearchListItemSchema = z.object({
  id: z.string(),
  query: z.string(),
  status: z.enum(['pending', 'complete', 'error']),
  sourceUrl: z.string().nullable(),
  content: z.string().nullable(),
  agentSummary: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type ResearchListItem = z.infer<typeof ResearchListItemSchema>

export async function getRecentResearch(limit = 10): Promise<ResearchListItem[]> {
  noStore()

  const userId = process.env.SYSTEM_USER_ID
  if (!userId || !process.env.DATABASE_URL) {
    return []
  }

  try {
    const db = getNeonDb()
    const rows = await db
      .select({
        id: researchCache.id,
        query: researchCache.query,
        status: researchCache.status,
        sourceUrl: researchCache.sourceUrl,
        content: researchCache.content,
        agentSummary: researchCache.agentSummary,
        createdAt: researchCache.createdAt,
        updatedAt: researchCache.updatedAt,
      })
      .from(researchCache)
      .where(eq(researchCache.userId, userId))
      .orderBy(desc(researchCache.createdAt))
      .limit(limit)

    return z.array(ResearchListItemSchema).parse(rows)
  } catch (error) {
    console.error('[getRecentResearch] error:', error)
    return []
  }
}
