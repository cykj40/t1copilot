import { HttpResponse, http } from 'msw'

export const GEMINI_INTERACTIONS_URL =
  'https://generativelanguage.googleapis.com/v1beta/interactions'

export const MOCK_INTERACTION_ID = 'v1_abc123'

export const MOCK_START_RESPONSE = {
  id: MOCK_INTERACTION_ID,
  status: 'created',
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

export const MOCK_COMPLETED_RESPONSE = {
  id: MOCK_INTERACTION_ID,
  status: 'completed',
  usage: { total_tokens: 0, total_input_tokens: 0, total_output_tokens: 0 },
  steps: [
    {
      type: 'model_output',
      content: [
        {
          type: 'text',
          text: 'Evidence suggests continuous glucose monitoring improves outcomes.',
          annotations: [
            {
              type: 'url_citation',
              url: 'https://example.com/cgm-study',
              title: 'CGM Outcomes Study',
            },
          ],
        },
      ],
    },
  ],
  object: 'interaction',
  model: 'gemini-3.5-flash',
}

export const MOCK_UNKNOWN_STATUS_RESPONSE = {
  id: MOCK_INTERACTION_ID,
  status: 'cancelled_by_user',
  object: 'interaction',
}

export const geminiResearchHandlers = [
  http.post(GEMINI_INTERACTIONS_URL, async () => {
    return HttpResponse.json(MOCK_START_RESPONSE)
  }),
  http.get(`${GEMINI_INTERACTIONS_URL}/:id`, ({ params }) => {
    const id = params.id
    if (id === MOCK_INTERACTION_ID) {
      return HttpResponse.json(MOCK_COMPLETED_RESPONSE)
    }
    return HttpResponse.json({ error: 'not found' }, { status: 404 })
  }),
]

export function geminiHandlerWithPostResponse(body: Record<string, unknown>) {
  return http.post(GEMINI_INTERACTIONS_URL, () => HttpResponse.json(body))
}

export function geminiHandlerWithPollResponse(body: Record<string, unknown>) {
  return http.get(`${GEMINI_INTERACTIONS_URL}/:id`, () => HttpResponse.json(body))
}

export function geminiHandlerWithPostError(status: number, body = 'Gemini error') {
  return http.post(GEMINI_INTERACTIONS_URL, () => new HttpResponse(body, { status }))
}

export function geminiHandlerWithPollError(status: number, body = 'Gemini error') {
  return http.get(`${GEMINI_INTERACTIONS_URL}/:id`, () => new HttpResponse(body, { status }))
}
