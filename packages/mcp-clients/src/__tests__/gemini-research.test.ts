import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import {
  GeminiResearchError,
  pollResearchInteraction,
  startResearchInteraction,
} from '../gemini-research.js'
import {
  GEMINI_INTERACTIONS_URL,
  geminiHandlerWithPollError,
  geminiHandlerWithPollResponse,
  geminiHandlerWithPostError,
  MOCK_COMPLETED_RESPONSE,
  MOCK_FAILED_RESPONSE,
  MOCK_IN_PROGRESS_RESPONSE,
  MOCK_INTERACTION_ID,
  MOCK_START_RESPONSE,
  MOCK_UNKNOWN_STATUS_RESPONSE,
} from './gemini-research.handlers.js'
import { server } from './server.js'

describe('startResearchInteraction', () => {
  it('returns interactionId and status on successful start', async () => {
    const result = await startResearchInteraction('Research CGM outcomes in T1D')

    expect(result.interactionId).toBe(MOCK_INTERACTION_ID)
    expect(result.status).toBe(MOCK_START_RESPONSE.status)
  })

  it('throws GeminiResearchError when GEMINI_API_KEY is missing', async () => {
    const original = process.env.GEMINI_API_KEY
    delete process.env.GEMINI_API_KEY

    await expect(startResearchInteraction('test query')).rejects.toBeInstanceOf(GeminiResearchError)

    process.env.GEMINI_API_KEY = original
  })

  it('throws GeminiResearchError on non-2xx POST response', async () => {
    server.use(geminiHandlerWithPostError(500, 'Internal server error'))

    const err = await startResearchInteraction('test query').catch((e: unknown) => e)
    expect(err).toBeInstanceOf(GeminiResearchError)
    expect((err as GeminiResearchError).message).toContain('500')
  })
})

describe('pollResearchInteraction', () => {
  it('returns completed status with extracted text and sources', async () => {
    server.use(geminiHandlerWithPollResponse(MOCK_COMPLETED_RESPONSE))

    const result = await pollResearchInteraction(MOCK_INTERACTION_ID)

    expect(result.status).toBe('completed')
    expect(result.text).toContain('continuous glucose monitoring')
    expect(result.sources).toEqual([
      {
        url: 'https://example.com/cgm-study',
        title: 'CGM Outcomes Study',
      },
    ])
  })

  it('returns in_progress status without text', async () => {
    server.use(geminiHandlerWithPollResponse(MOCK_IN_PROGRESS_RESPONSE))

    const result = await pollResearchInteraction(MOCK_INTERACTION_ID)

    expect(result.status).toBe('in_progress')
    expect(result.text).toBeNull()
    expect(result.sources).toEqual([])
  })

  it('returns failed status for failed interactions', async () => {
    server.use(geminiHandlerWithPollResponse(MOCK_FAILED_RESPONSE))

    const result = await pollResearchInteraction(MOCK_INTERACTION_ID)

    expect(result.status).toBe('failed')
    expect(result.text).toBeNull()
    expect(result.sources).toEqual([])
  })

  it('maps unknown status values to failed via .catch()', async () => {
    server.use(geminiHandlerWithPollResponse(MOCK_UNKNOWN_STATUS_RESPONSE))

    const result = await pollResearchInteraction(MOCK_INTERACTION_ID)

    expect(result.status).toBe('failed')
  })

  it('throws GeminiResearchError when GEMINI_API_KEY is missing', async () => {
    const original = process.env.GEMINI_API_KEY
    delete process.env.GEMINI_API_KEY

    await expect(pollResearchInteraction(MOCK_INTERACTION_ID)).rejects.toBeInstanceOf(
      GeminiResearchError,
    )

    process.env.GEMINI_API_KEY = original
  })

  it('throws GeminiResearchError on non-2xx GET response', async () => {
    server.use(geminiHandlerWithPollError(502, 'Bad gateway'))

    const err = await pollResearchInteraction(MOCK_INTERACTION_ID).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(GeminiResearchError)
    expect((err as GeminiResearchError).message).toContain('502')
  })
})

describe('Gemini Interactions API request shape', () => {
  it('POSTs to the interactions endpoint with Api-Revision header', async () => {
    let capturedRevision: string | null = null

    server.use(
      http.post(GEMINI_INTERACTIONS_URL, ({ request }) => {
        capturedRevision = request.headers.get('Api-Revision')
        return HttpResponse.json(MOCK_START_RESPONSE)
      }),
    )

    await startResearchInteraction('test query')
    expect(capturedRevision).toBe('2026-05-20')
  })
})
