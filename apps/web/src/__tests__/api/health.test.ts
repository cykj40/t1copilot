import { delay, HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/health/route'
import { MCP_BASE_URL } from '@/mocks/handlers/dexcom'
import { PELOTON_MCP_BASE_URL } from '@/mocks/handlers/peloton'
import { server } from '@/mocks/node'

describe('GET /api/health', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns connected for both servers when both /health endpoints succeed', async () => {
    const response = await GET()
    expect(response.status).toBe(200)

    const body = (await response.json()) as { dexcom: string; peloton: string }
    expect(body).toEqual({ dexcom: 'connected', peloton: 'connected' })
  })

  it('returns dexcom disconnected when Dexcom /health returns 500, peloton unaffected', async () => {
    server.use(http.get(`${MCP_BASE_URL}/health`, () => new HttpResponse(null, { status: 500 })))

    const response = await GET()
    expect(response.status).toBe(200)

    const body = (await response.json()) as { dexcom: string; peloton: string }
    expect(body.dexcom).toBe('disconnected')
    expect(body.peloton).toBe('connected')
  })

  it('returns both disconnected when both /health endpoints time out', async () => {
    vi.useFakeTimers()

    server.use(
      http.get(`${MCP_BASE_URL}/health`, async () => {
        await delay(6000)
        return new HttpResponse(null, { status: 200 })
      }),
      http.get(`${PELOTON_MCP_BASE_URL}/health`, async () => {
        await delay(6000)
        return new HttpResponse(null, { status: 200 })
      }),
    )

    const responsePromise = GET()
    await vi.advanceTimersByTimeAsync(5001)
    const response = await responsePromise

    expect(response.status).toBe(200)
    const body = (await response.json()) as { dexcom: string; peloton: string }
    expect(body).toEqual({ dexcom: 'disconnected', peloton: 'disconnected' })
  })

  it('never leaks auth token substrings in the response body', async () => {
    const response = await GET()
    const text = await response.text()

    expect(text).not.toContain('DEXCOM_MCP_AUTH_TOKEN')
    expect(text).not.toContain('PELOTON_MCP_AUTH_TOKEN')
    expect(text).not.toContain('test-token')
    expect(text).not.toContain('access_token')
    expect(text).not.toContain('refresh_token')
  })
})
