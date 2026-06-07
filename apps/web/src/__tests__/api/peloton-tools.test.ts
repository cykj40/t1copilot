import { callPelotonTool, extractText } from '@t1copilot/mcp-clients'
import { describe, expect, it } from 'vitest'
import { MOCK_PELOTON_SYNC_TEXT } from '@/mocks/handlers/peloton'

describe('sync_peloton_workouts', () => {
  it('returns sync confirmation text', async () => {
    const response = await callPelotonTool('peloton_sync_workouts', { limit: 50 })
    const message = extractText(response)

    expect(message).toContain('Synced 10 workouts')
    expect(message).toContain('Database now contains 10 total workouts')
    expect(message).toBe(MOCK_PELOTON_SYNC_TEXT)
  })
})
