import { describe, expect, it } from 'vitest'
import { saveInsight } from '@/lib/insight-store'

describe('saveInsight — env guards', () => {
  it('skips write and returns skipped:true when SYSTEM_USER_ID is missing', async () => {
    const original = process.env.SYSTEM_USER_ID
    delete process.env.SYSTEM_USER_ID

    const result = await saveInsight({
      summary: 'Test insight',
      detail: { test: true },
      agentId: 'insight',
      insightType: 'weekly_summary',
    })

    expect(result.skipped).toBe(true)
    expect(result.reason).toContain('SYSTEM_USER_ID')

    process.env.SYSTEM_USER_ID = original
  })

  it('skips write and returns skipped:true when DATABASE_URL is missing', async () => {
    const originalDb = process.env.DATABASE_URL
    delete process.env.DATABASE_URL

    const result = await saveInsight({
      summary: 'Test insight',
      detail: { test: true },
      agentId: 'insight',
      insightType: 'weekly_summary',
    })

    expect(result.skipped).toBe(true)
    expect(result.reason).toContain('DATABASE_URL')

    process.env.DATABASE_URL = originalDb
  })
})
