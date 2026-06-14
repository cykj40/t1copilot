import { describe, expect, it, vi } from 'vitest'
import { getEventTimeline } from '@/actions/dexcom'
import {
  MOCK_EVENT_TIMELINE,
  mcpHandlerCapturingToolCalls,
  mcpHandlerWithPersistentColdStartFailure,
  mcpHandlerWithTimeoutOnce,
} from '@/mocks/handlers/dexcom'
import { server } from '@/mocks/node'

describe('getEventTimeline', () => {
  const start = '2026-06-06T12:00:00.000Z'
  const end = '2026-06-13T12:00:00.000Z'

  it('retries once after MCP -32001 timeout and returns timeline', async () => {
    vi.useFakeTimers()
    server.use(mcpHandlerWithTimeoutOnce('get_event_timeline', MOCK_EVENT_TIMELINE))

    const promise = getEventTimeline(start, end)
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result?.timeline).toHaveLength(3)
    expect(result?.summary?.totalEvents).toBe(5)
    vi.useRealTimers()
  })

  it('returns null when both attempts fail with cold-start errors', async () => {
    vi.useFakeTimers()
    server.use(mcpHandlerWithPersistentColdStartFailure('get_event_timeline'))

    const promise = getEventTimeline(start, end)
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toBeNull()
    vi.useRealTimers()
  })

  it('returns null immediately on validation failure without retrying', async () => {
    const capturedCalls: string[] = []
    server.use(
      mcpHandlerCapturingToolCalls(
        ({ name }) => {
          capturedCalls.push(name)
        },
        { timeline: 'not-an-array' },
      ),
    )

    const result = await getEventTimeline(start, end)
    expect(result).toBeNull()
    expect(capturedCalls).toEqual(['get_event_timeline'])
  })
})
