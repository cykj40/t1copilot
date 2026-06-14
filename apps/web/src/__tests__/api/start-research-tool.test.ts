import type { ResearchCacheRow } from '@t1copilot/db/neon'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  GEMINI_INTERACTIONS_URL,
  geminiHandlerWithPostError,
  geminiResearchHandlers,
  MOCK_INTERACTION_ID,
} from '@/mocks/handlers/gemini-research'
import { server } from '@/mocks/node'

const { rows } = vi.hoisted(() => ({
  rows: new Map<string, ResearchCacheRow>(),
}))

function makeResearchRow(overrides: Partial<ResearchCacheRow> = {}): ResearchCacheRow {
  return {
    id: 'cache-row-1',
    userId: 'test-user-id',
    query: 'CGM accuracy during exercise',
    interactionId: MOCK_INTERACTION_ID,
    status: 'pending',
    sourceUrl: null,
    content: null,
    agentSummary: null,
    embedding: null,
    createdAt: new Date('2026-06-14T12:00:00.000Z'),
    updatedAt: new Date('2026-06-14T12:00:00.000Z'),
    ...overrides,
  }
}

vi.mock('@t1copilot/db/neon', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@t1copilot/db/neon')>()

  return {
    ...actual,
    getNeonDb: () => ({
      insert: () => ({
        values: (values: Partial<ResearchCacheRow>) => ({
          returning: () => {
            const row = makeResearchRow(values)
            rows.set(row.id, row)
            return Promise.resolve([{ id: row.id }])
          },
        }),
      }),
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => {
              const row = [...rows.values()][0]
              return Promise.resolve(row ? [row] : [])
            },
          }),
        }),
      }),
      update: () => ({
        set: (values: Partial<ResearchCacheRow>) => ({
          where: () => ({
            returning: () => {
              const existing = [...rows.values()][0]
              if (!existing) return Promise.resolve([])
              const updated = makeResearchRow({ ...existing, ...values })
              rows.set(updated.id, updated)
              return Promise.resolve([updated])
            },
          }),
        }),
      }),
    }),
  }
})

describe('executeStartResearch', () => {
  beforeEach(() => {
    rows.clear()
    vi.resetModules()
    server.use(...geminiResearchHandlers)
  })

  it('returns pending cache row on happy path', async () => {
    const { executeStartResearch } = await import('@/lib/research-store')
    const result = await executeStartResearch('Latest evidence on hybrid closed loop systems')

    expect(result).toEqual({
      success: true,
      interactionId: MOCK_INTERACTION_ID,
      cacheId: 'cache-row-1',
      status: 'pending',
    })
    expect(rows.size).toBe(1)
    expect(rows.get('cache-row-1')?.status).toBe('pending')
  })

  it('returns success:false on GeminiResearchError without inserting a row', async () => {
    server.use(geminiHandlerWithPostError(500, 'Gemini unavailable'))

    const { executeStartResearch } = await import('@/lib/research-store')
    const result = await executeStartResearch('test query')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('500')
    }
    expect(rows.size).toBe(0)
  })

  it('returns success:false when SYSTEM_USER_ID is missing', async () => {
    const original = process.env.SYSTEM_USER_ID
    delete process.env.SYSTEM_USER_ID

    const { executeStartResearch } = await import('@/lib/research-store')
    const result = await executeStartResearch('test query')

    expect(result).toEqual({ success: false, error: 'SYSTEM_USER_ID not set' })
    expect(rows.size).toBe(0)

    process.env.SYSTEM_USER_ID = original
  })

  it('fires Gemini Interactions POST when starting research', async () => {
    let postCount = 0
    server.use(
      http.post(GEMINI_INTERACTIONS_URL, () => {
        postCount++
        return HttpResponse.json({ id: MOCK_INTERACTION_ID, status: 'created' })
      }),
    )

    const { executeStartResearch } = await import('@/lib/research-store')
    await executeStartResearch('CGM accuracy in exercise')

    expect(postCount).toBe(1)
  })
})
