import { HttpResponse, http } from 'msw'

export const GEMINI_INTERACTIONS_URL =
  'https://generativelanguage.googleapis.com/v1beta/interactions'

export const MOCK_INTERACTION_ID = 'v1_abc123'
export const MOCK_CACHE_ID = 'cache-row-1'

export const MOCK_START_RESPONSE = {
  id: MOCK_INTERACTION_ID,
  status: 'created',
  object: 'interaction',
}

export const MOCK_COMPLETED_RESPONSE = {
  id: MOCK_INTERACTION_ID,
  status: 'completed',
  steps: [
    {
      type: 'model_output',
      content: [
        {
          type: 'text',
          text: 'A'.repeat(600),
          annotations: [
            {
              type: 'url_citation',
              url: 'https://example.com/study',
              title: 'Study',
            },
          ],
        },
      ],
    },
  ],
  object: 'interaction',
}

export const MOCK_IN_PROGRESS_RESPONSE = {
  id: MOCK_INTERACTION_ID,
  status: 'in_progress',
  object: 'interaction',
}

export const MOCK_FAILED_RESPONSE = {
  id: MOCK_INTERACTION_ID,
  status: 'failed',
  object: 'interaction',
}

export const geminiResearchHandlers = [
  http.post(GEMINI_INTERACTIONS_URL, async () => HttpResponse.json(MOCK_START_RESPONSE)),
  http.get(`${GEMINI_INTERACTIONS_URL}/:id`, () => HttpResponse.json(MOCK_IN_PROGRESS_RESPONSE)),
]

export function geminiHandlerWithPostError(status: number, body = 'Gemini error') {
  return http.post(GEMINI_INTERACTIONS_URL, () => new HttpResponse(body, { status }))
}

export function geminiHandlerWithPollResponse(body: Record<string, unknown>) {
  return http.get(`${GEMINI_INTERACTIONS_URL}/:id`, () => HttpResponse.json(body))
}
