import type { ResearchCacheRow } from '@t1copilot/db/neon'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { rows } = vi.hoisted(() => ({
  rows: [] as ResearchCacheRow[],
}))

vi.mock('@t1copilot/db/neon', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@t1copilot/db/neon')>()
  return {
    ...actual,
    getNeonDb: () => ({
      select: () => ({
        from: () => ({
          where: () => ({
            orderBy: () => ({
              limit: () => Promise.resolve(rows),
            }),
          }),
        }),
      }),
    }),
  }
})

function makeRow(overrides: Partial<ResearchCacheRow> = {}): ResearchCacheRow {
  return {
    id: 'row-1',
    userId: 'test-user-id',
    query: 'Hybrid closed loop outcomes',
    interactionId: 'v1_abc',
    status: 'complete',
    sourceUrl: 'https://example.com/study',
    content: 'Full research content',
    agentSummary: 'Summary text',
    embedding: null,
    createdAt: new Date('2026-06-14T10:00:00.000Z'),
    updatedAt: new Date('2026-06-14T10:05:00.000Z'),
    ...overrides,
  }
}

describe('getRecentResearch', () => {
  beforeEach(() => {
    rows.length = 0
    vi.resetModules()
    process.env.SYSTEM_USER_ID = 'test-user-id'
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
  })

  it('returns rows with validated shape in query order', async () => {
    rows.push(
      makeRow({ id: 'row-new', createdAt: new Date('2026-06-14T10:00:00.000Z') }),
      makeRow({ id: 'row-old', createdAt: new Date('2026-06-10T10:00:00.000Z') }),
    )

    const { getRecentResearch } = await import('@/actions/research')
    const result = await getRecentResearch()

    expect(result).toHaveLength(2)
    expect(result[0]?.id).toBe('row-new')
    expect(result[1]?.id).toBe('row-old')
    expect(result[0]).toMatchObject({
      query: 'Hybrid closed loop outcomes',
      status: 'complete',
      sourceUrl: 'https://example.com/study',
      agentSummary: 'Summary text',
    })
  })

  it('returns empty array when no rows exist', async () => {
    const { getRecentResearch } = await import('@/actions/research')
    const result = await getRecentResearch()
    expect(result).toEqual([])
  })

  it('returns empty array when SYSTEM_USER_ID is missing', async () => {
    delete process.env.SYSTEM_USER_ID
    rows.push(makeRow())

    const { getRecentResearch } = await import('@/actions/research')
    const result = await getRecentResearch()
    expect(result).toEqual([])
  })

  it('rejects invalid status values via Zod validation', async () => {
    rows.push(makeRow({ status: 'invalid_status' }))

    const { getRecentResearch } = await import('@/actions/research')
    const result = await getRecentResearch()
    expect(result).toEqual([])
  })
})
