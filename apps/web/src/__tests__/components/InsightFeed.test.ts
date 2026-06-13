// @vitest-environment happy-dom

import { render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { formatInsightType, InsightFeed } from '@/components/insights/InsightFeed'
import { memoryHandlerWithData } from '@/mocks/handlers/memory'
import { server } from '@/mocks/node'

describe('formatInsightType', () => {
  it('formats known insight types', () => {
    expect(formatInsightType('weekly_summary')).toBe('Weekly Summary')
    expect(formatInsightType('pattern')).toBe('Pattern')
    expect(formatInsightType('drift_alert')).toBe('Drift Alert')
    expect(formatInsightType('hypo_risk')).toBe('Hypo Risk')
  })

  it('returns the raw type for unknown values', () => {
    expect(formatInsightType('custom_type')).toBe('custom_type')
  })
})

describe('InsightFeed', () => {
  it('shows empty state when /api/memory returns no memories', async () => {
    server.use(memoryHandlerWithData([]))

    render(createElement(InsightFeed))

    await waitFor(() => {
      expect(
        screen.getByText(/No insights yet\. Ask the agent: "Give me a weekly insight summary"/),
      ).toBeTruthy()
    })
  })

  it('renders insight cards when memories are present', async () => {
    server.use(
      memoryHandlerWithData([
        {
          id: 'mem-1',
          summary: 'Time in range improved this week.',
          insightType: 'weekly_summary',
          confidence: 0.8,
          createdAt: '2026-06-13T12:00:00.000Z',
        },
        {
          id: 'mem-2',
          summary: 'Parameter drift detected in morning readings.',
          insightType: 'drift_alert',
          confidence: 0.75,
          createdAt: '2026-06-12T12:00:00.000Z',
        },
      ]),
    )

    render(createElement(InsightFeed))

    await waitFor(() => {
      expect(screen.getByText('Weekly Summary')).toBeTruthy()
      expect(screen.getByText('Time in range improved this week.')).toBeTruthy()
      expect(screen.getByText('Drift Alert')).toBeTruthy()
      expect(screen.getByText('Parameter drift detected in morning readings.')).toBeTruthy()
      expect(screen.getByText('Review with agent')).toBeTruthy()
    })
  })

  it('handles fetch errors gracefully', async () => {
    server.use(
      http.get('*/api/memory', () => HttpResponse.json({ success: false }, { status: 500 })),
    )

    render(createElement(InsightFeed))

    await waitFor(() => {
      expect(
        screen.getByText(/No insights yet\. Ask the agent: "Give me a weekly insight summary"/),
      ).toBeTruthy()
    })
  })
})
