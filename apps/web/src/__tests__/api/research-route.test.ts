import type { ResearchCacheRow } from '@t1copilot/db/neon'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  GEMINI_INTERACTIONS_URL,
  geminiHandlerWithPollResponse,
  geminiResearchHandlers,
  MOCK_COMPLETED_RESPONSE,
  MOCK_FAILED_RESPONSE,
  MOCK_IN_PROGRESS_RESPONSE,
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
              const row = rows.get('cache-row-1')
              return Promise.resolve(row ? [row] : [])
            },
          }),
        }),
      }),
      update: () => ({
        set: (values: Partial<ResearchCacheRow>) => ({
          where: () => ({
            returning: () => {
              const existing = rows.get('cache-row-1')
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

vi.mock('@/lib/insight-store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/insight-store')>()
  return {
    ...actual,
    embedText: vi.fn(async () => Array.from({ length: 1536 }, (_, i) => i / 1536)),
  }
})

describe('GET /api/research/[id]', () => {
  beforeEach(() => {
    rows.clear()
    vi.resetModules()
    server.use(...geminiResearchHandlers)
  })

  it('returns 404 for unknown id', async () => {
    const { GET } = await import('@/app/api/research/[id]/route')
    const response = await GET(new Request('http://localhost/api/research/missing'), {
      params: Promise.resolve({ id: 'missing' }),
    })

    expect(response.status).toBe(404)
  })

  it('leaves pending row unchanged when Gemini is still in_progress', async () => {
    rows.set('cache-row-1', makeResearchRow())
    server.use(geminiHandlerWithPollResponse(MOCK_IN_PROGRESS_RESPONSE))

    const { GET } = await import('@/app/api/research/[id]/route')
    const response = await GET(new Request('http://localhost/api/research/cache-row-1'), {
      params: Promise.resolve({ id: 'cache-row-1' }),
    })

    expect(response.status).toBe(200)
    const data = (await response.json()) as { success: boolean; research: { status: string } }
    expect(data.success).toBe(true)
    expect(data.research.status).toBe('pending')
    expect(rows.get('cache-row-1')?.status).toBe('pending')
  })

  it('updates row to complete with embedding when Gemini reports completed', async () => {
    rows.set('cache-row-1', makeResearchRow())
    server.use(geminiHandlerWithPollResponse(MOCK_COMPLETED_RESPONSE))

    const { embedText } = await import('@/lib/insight-store')
    const { GET } = await import('@/app/api/research/[id]/route')
    const response = await GET(new Request('http://localhost/api/research/cache-row-1'), {
      params: Promise.resolve({ id: 'cache-row-1' }),
    })

    expect(response.status).toBe(200)
    const data = (await response.json()) as {
      success: boolean
      research: { status: string; sourceUrl: string | null; agentSummary: string | null }
    }
    expect(data.research.status).toBe('complete')
    expect(data.research.sourceUrl).toBe('https://example.com/study')
    expect(data.research.agentSummary).toHaveLength(500)
    expect(embedText).toHaveBeenCalled()
    expect(rows.get('cache-row-1')?.status).toBe('complete')
    expect(rows.get('cache-row-1')?.embedding).not.toBeNull()
  })

  it('updates row to error when Gemini reports failed', async () => {
    rows.set('cache-row-1', makeResearchRow())
    server.use(geminiHandlerWithPollResponse(MOCK_FAILED_RESPONSE))

    const { GET } = await import('@/app/api/research/[id]/route')
    const response = await GET(new Request('http://localhost/api/research/cache-row-1'), {
      params: Promise.resolve({ id: 'cache-row-1' }),
    })

    expect(response.status).toBe(200)
    const data = (await response.json()) as { research: { status: string } }
    expect(data.research.status).toBe('error')
    expect(rows.get('cache-row-1')?.status).toBe('error')
  })

  it('does not re-poll when row is already complete', async () => {
    rows.set(
      'cache-row-1',
      makeResearchRow({
        status: 'complete',
        content: 'Existing content',
        sourceUrl: 'https://example.com/existing',
        agentSummary: 'Existing summary',
      }),
    )

    let pollCount = 0
    server.use(
      http.get(`${GEMINI_INTERACTIONS_URL}/:id`, () => {
        pollCount++
        return HttpResponse.json(MOCK_COMPLETED_RESPONSE)
      }),
    )

    const { GET } = await import('@/app/api/research/[id]/route')
    const response = await GET(new Request('http://localhost/api/research/cache-row-1'), {
      params: Promise.resolve({ id: 'cache-row-1' }),
    })

    expect(response.status).toBe(200)
    expect(pollCount).toBe(0)
    const data = (await response.json()) as { research: { content: string | null } }
    expect(data.research.content).toBe('Existing content')
  })
})
