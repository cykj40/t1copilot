'use server'

import { getNeonDb, researchCache } from '@t1copilot/db/neon'
import { type ResearchListItem, ResearchListItemSchema } from '@t1copilot/types'
import { desc, eq } from 'drizzle-orm'
import { unstable_noStore as noStore } from 'next/cache'
import { z } from 'zod'

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
