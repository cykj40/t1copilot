import { describe, expect, it } from 'vitest'
import { agentTools } from '@/lib/agent-core'

describe('render_glucose_chart', () => {
  it('preserves raw timestamps while providing configured local timestamps to the model', async () => {
    const result = await agentTools.render_glucose_chart.execute?.(
      { timeRange: '24h', title: 'Glucose Trend — Today' },
      { toolCallId: 'test-glucose-chart', messages: [] },
    )

    expect(result?.title).toBe('Glucose Trend — Last 24 Hours')
    expect(result?.readings[0]).toMatchObject({
      timestamp: '2026-05-23T12:00:00.000Z',
      localTimestamp: 'May 23, 8:00 AM EDT',
    })
  })
})
