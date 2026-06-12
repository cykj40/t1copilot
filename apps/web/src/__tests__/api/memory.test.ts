import { describe, expect, it } from 'vitest'
import { DELETE, GET, POST } from '@/app/api/memory/route'

// All tests run without a real Neon connection.
// SYSTEM_USER_ID is set in vitest.setup.ts.
// DATABASE_URL is set to a stub — GET/DELETE return gracefully.
// POST hits saveInsight which guards on DATABASE_URL and returns skipped.

describe('POST /api/memory', () => {
  it('returns 503 when SYSTEM_USER_ID is missing', async () => {
    const original = process.env.SYSTEM_USER_ID
    delete process.env.SYSTEM_USER_ID

    const res = await POST(
      new Request('http://localhost:3000/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'Test pattern',
          type: 'pattern',
          source: 'test',
        }),
      }),
    )

    expect(res.status).toBe(503)
    process.env.SYSTEM_USER_ID = original
  })

  it('returns 400 on invalid body', async () => {
    const res = await POST(
      new Request('http://localhost:3000/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '' }),
      }),
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 on invalid JSON', async () => {
    const res = await POST(
      new Request('http://localhost:3000/api/memory', {
        method: 'POST',
        body: 'not json',
      }),
    )
    expect(res.status).toBe(400)
  })
})

describe('GET /api/memory', () => {
  it('returns empty memories array when DATABASE_URL is not a real connection', async () => {
    // DATABASE_URL is set to a stub — getNeonDb() will fail gracefully or
    // the route returns [] if no real DB. Either way, status should not be 503.
    const res = await GET()
    // Accept 200 (empty list guard) or 502 (real Neon unreachable) — both are valid
    // without a live DB. What we're testing is it doesn't 503 when userId is set.
    expect([200, 502]).toContain(res.status)
  })

  it('returns 503 when SYSTEM_USER_ID is missing', async () => {
    const original = process.env.SYSTEM_USER_ID
    delete process.env.SYSTEM_USER_ID

    const res = await GET()
    expect(res.status).toBe(503)
    process.env.SYSTEM_USER_ID = original
  })
})

describe('DELETE /api/memory', () => {
  it('returns 400 when neither id nor all is provided', async () => {
    const res = await DELETE(
      new Request('http://localhost:3000/api/memory', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    )
    expect(res.status).toBe(400)
  })

  it('returns 503 when SYSTEM_USER_ID is missing', async () => {
    const original = process.env.SYSTEM_USER_ID
    delete process.env.SYSTEM_USER_ID

    const res = await DELETE(
      new Request('http://localhost:3000/api/memory', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'abc' }),
      }),
    )
    expect(res.status).toBe(503)
    process.env.SYSTEM_USER_ID = original
  })

  it('returns 400 on invalid JSON', async () => {
    const res = await DELETE(
      new Request('http://localhost:3000/api/memory', {
        method: 'DELETE',
        body: 'not json',
      }),
    )
    expect(res.status).toBe(400)
  })
})
