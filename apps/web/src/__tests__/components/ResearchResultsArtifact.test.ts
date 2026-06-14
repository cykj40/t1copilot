// @vitest-environment happy-dom

import { render, screen, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ResearchResultsArtifact } from '@/components/artifacts/ResearchResultsArtifact'
import type { RenderResearchResultsArtifact } from '@/types/artifacts'

const FAST_POLL_MS = 50

const BASE_ARTIFACT: RenderResearchResultsArtifact = {
  artifactType: 'render_research_results',
  id: 'cache-1',
  query: 'CGM accuracy during high-intensity exercise',
  status: 'pending',
  sourceUrl: null,
  content: null,
  agentSummary: null,
}

const COMPLETE_RESPONSE = {
  success: true,
  research: {
    id: 'cache-1',
    userId: 'user-1',
    query: 'CGM accuracy during high-intensity exercise',
    interactionId: 'v1_abc',
    status: 'complete' as const,
    sourceUrl: 'https://example.com/study',
    content: `${'A'.repeat(600)} full research body`,
    agentSummary: 'A'.repeat(500),
    createdAt: '2026-06-14T12:00:00.000Z',
    updatedAt: '2026-06-14T12:05:00.000Z',
  },
}

describe('ResearchResultsArtifact', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders pending state with query and starts polling', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        research: { ...COMPLETE_RESPONSE.research, status: 'pending' },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    render(
      createElement(ResearchResultsArtifact, {
        artifact: BASE_ARTIFACT,
        pollIntervalMs: FAST_POLL_MS,
      }),
    )

    expect(screen.getByText(BASE_ARTIFACT.query)).toBeTruthy()
    expect(screen.getByText(/Deep research is running/)).toBeTruthy()
    expect(screen.getByText(/In progress/)).toBeTruthy()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/research/cache-1')
    })
  })

  it('renders complete state with summary, source link, and disclaimer', () => {
    render(
      createElement(ResearchResultsArtifact, {
        artifact: {
          ...BASE_ARTIFACT,
          status: 'complete',
          sourceUrl: 'https://example.com/study',
          content: `${'A'.repeat(600)} full body`,
          agentSummary: 'Summary of CGM accuracy findings.',
        },
        poll: false,
      }),
    )

    expect(screen.getByText('Summary of CGM accuracy findings.')).toBeTruthy()
    expect(screen.getByText('https://example.com/study')).toBeTruthy()
    expect(
      screen.getByText(
        'This is general information, not medical advice. Discuss findings with your care team.',
      ),
    ).toBeTruthy()
    expect(screen.getByText('Show full research')).toBeTruthy()
  })

  it('renders error state with query context', () => {
    render(
      createElement(ResearchResultsArtifact, {
        artifact: { ...BASE_ARTIFACT, status: 'error' },
        poll: false,
      }),
    )

    expect(screen.getByText(BASE_ARTIFACT.query)).toBeTruthy()
    expect(screen.getByText(/Research could not be completed/)).toBeTruthy()
  })

  it('stops polling when status changes to complete', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          research: { ...COMPLETE_RESPONSE.research, status: 'pending' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => COMPLETE_RESPONSE,
      })
      .mockResolvedValue({
        ok: true,
        json: async () => COMPLETE_RESPONSE,
      })
    vi.stubGlobal('fetch', fetchMock)

    render(
      createElement(ResearchResultsArtifact, {
        artifact: BASE_ARTIFACT,
        pollIntervalMs: FAST_POLL_MS,
      }),
    )

    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2)
    })

    await waitFor(() => {
      expect(screen.getByText('Show full research')).toBeTruthy()
    })

    const callsAfterComplete = fetchMock.mock.calls.length
    await new Promise((resolve) => setTimeout(resolve, FAST_POLL_MS * 3))
    expect(fetchMock.mock.calls.length).toBe(callsAfterComplete)
  })

  it('clears polling interval on unmount', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        research: { ...COMPLETE_RESPONSE.research, status: 'pending' },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { unmount } = render(
      createElement(ResearchResultsArtifact, {
        artifact: BASE_ARTIFACT,
        pollIntervalMs: FAST_POLL_MS,
      }),
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    unmount()
    const callsBefore = fetchMock.mock.calls.length
    await new Promise((resolve) => setTimeout(resolve, FAST_POLL_MS * 4))
    expect(fetchMock.mock.calls.length).toBe(callsBefore)
  })

  it('does not poll when poll=false', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    render(
      createElement(ResearchResultsArtifact, {
        artifact: BASE_ARTIFACT,
        poll: false,
      }),
    )

    await new Promise((resolve) => setTimeout(resolve, FAST_POLL_MS * 3))
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
