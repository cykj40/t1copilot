import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { GET } from '@/app/api/glucose-range/route'
import { MCP_ENDPOINT, type MOCK_GLUCOSE_RANGE } from '@/mocks/handlers/dexcom'
import { server } from '@/mocks/node'

describe('GET /api/glucose-range', () => {
  it('returns 200 with glucose readings for valid params', async () => {
    const url = new URL('http://localhost:3000/api/glucose-range')
    url.searchParams.set('start', '2026-05-23T00:00:00.000Z')
    url.searchParams.set('end', '2026-05-23T23:59:59.000Z')

    const response = await GET(new Request(url.toString()))

    expect(response.status).toBe(200)

    const body = (await response.json()) as typeof MOCK_GLUCOSE_RANGE
    expect(body.readingCount).toBe(3)
    expect(Array.isArray(body.readings)).toBe(true)
    expect(body.readings).toHaveLength(3)
    expect(body.statistics.average).toBe(138)
    expect(body.statistics.timeInRange).toBe(74)
  })

  it('returns 400 when start param is missing', async () => {
    const url = new URL('http://localhost:3000/api/glucose-range')
    url.searchParams.set('end', '2026-05-23T23:59:59.000Z')

    const response = await GET(new Request(url.toString()))

    expect(response.status).toBe(400)
    const body = (await response.json()) as { error: string }
    expect(typeof body.error).toBe('string')
  })

  it('returns 400 when end param is missing', async () => {
    const url = new URL('http://localhost:3000/api/glucose-range')
    url.searchParams.set('start', '2026-05-23T00:00:00.000Z')

    const response = await GET(new Request(url.toString()))

    expect(response.status).toBe(400)
  })

  it('returns 400 when both params are missing', async () => {
    const url = new URL('http://localhost:3000/api/glucose-range')

    const response = await GET(new Request(url.toString()))

    expect(response.status).toBe(400)
  })

  it('returns 502 when Dexcom MCP is unreachable', async () => {
    server.use(
      http.post(MCP_ENDPOINT, () => HttpResponse.error()),
      http.delete(MCP_ENDPOINT, () => new HttpResponse(null, { status: 200 })),
    )

    const url = new URL('http://localhost:3000/api/glucose-range')
    url.searchParams.set('start', '2026-05-23T00:00:00.000Z')
    url.searchParams.set('end', '2026-05-23T23:59:59.000Z')

    const response = await GET(new Request(url.toString()))

    expect(response.status).toBe(502)
  })

  it('returns 502 when MCP returns a 500', async () => {
    server.use(
      http.post(MCP_ENDPOINT, () => new HttpResponse(null, { status: 500 })),
      http.delete(MCP_ENDPOINT, () => new HttpResponse(null, { status: 200 })),
    )

    const url = new URL('http://localhost:3000/api/glucose-range')
    url.searchParams.set('start', '2026-05-23T00:00:00.000Z')
    url.searchParams.set('end', '2026-05-23T23:59:59.000Z')

    const response = await GET(new Request(url.toString()))

    expect(response.status).toBe(502)
  })

  it('never leaks Dexcom credentials or tokens in the response body', async () => {
    const url = new URL('http://localhost:3000/api/glucose-range')
    url.searchParams.set('start', '2026-05-23T00:00:00.000Z')
    url.searchParams.set('end', '2026-05-23T23:59:59.000Z')

    const response = await GET(new Request(url.toString()))
    const text = await response.text()

    expect(text).not.toContain('DEXCOM_CLIENT_SECRET')
    expect(text).not.toContain('access_token')
    expect(text).not.toContain('refresh_token')
    expect(text).not.toContain('DEXCOM_MCP_AUTH_TOKEN')
  })
})
