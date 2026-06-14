import {
  extractModelOutputText,
  GeminiInteractionCreateRequestSchema,
  GeminiInteractionResponseSchema,
  type GeminiInteractionStatus,
} from './schemas/gemini-research.js'

export * from './schemas/gemini-research.js'

const GEMINI_INTERACTIONS_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions'
const API_REVISION = '2026-05-20'
const DEEP_RESEARCH_AGENT = 'deep-research-preview-04-2026' as const

export class GeminiResearchError extends Error {
  constructor(
    message: string,
    public override readonly cause?: unknown,
  ) {
    super(message, cause !== undefined ? { cause } : undefined)
    this.name = 'GeminiResearchError'
  }
}

function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new GeminiResearchError('GEMINI_API_KEY is not set')
  }
  return apiKey
}

async function readErrorBody(response: Response): Promise<string> {
  try {
    const text = await response.text()
    return text.length > 0 ? text : response.statusText
  } catch {
    return response.statusText
  }
}

export async function startResearchInteraction(
  query: string,
): Promise<{ interactionId: string; status: string }> {
  const apiKey = getGeminiApiKey()

  const body = GeminiInteractionCreateRequestSchema.parse({
    input: query,
    agent: DEEP_RESEARCH_AGENT,
    background: true,
    agent_config: {
      type: 'deep-research',
      thinking_summaries: 'auto',
    },
  })

  try {
    const response = await fetch(GEMINI_INTERACTIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
        'Api-Revision': API_REVISION,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorBody = await readErrorBody(response)
      throw new GeminiResearchError(
        `Gemini Interactions API POST failed (${String(response.status)}): ${errorBody}`,
      )
    }

    const json: unknown = await response.json()
    const parsed = GeminiInteractionResponseSchema.parse(json)

    return {
      interactionId: parsed.id,
      status: parsed.status,
    }
  } catch (err) {
    if (err instanceof GeminiResearchError) throw err
    throw new GeminiResearchError(
      err instanceof Error ? err.message : 'Failed to start research interaction',
      err,
    )
  }
}

export async function pollResearchInteraction(interactionId: string): Promise<{
  status: GeminiInteractionStatus
  text: string | null
  sources: { url: string; title?: string }[]
}> {
  const apiKey = getGeminiApiKey()

  try {
    const response = await fetch(`${GEMINI_INTERACTIONS_URL}/${interactionId}`, {
      method: 'GET',
      headers: {
        'x-goog-api-key': apiKey,
      },
    })

    if (!response.ok) {
      const errorBody = await readErrorBody(response)
      throw new GeminiResearchError(
        `Gemini Interactions API GET failed (${String(response.status)}): ${errorBody}`,
      )
    }

    const json: unknown = await response.json()
    const parsed = GeminiInteractionResponseSchema.parse(json)
    const { text, sources } = extractModelOutputText(parsed)

    return {
      status: parsed.status,
      text,
      sources,
    }
  } catch (err) {
    if (err instanceof GeminiResearchError) throw err
    throw new GeminiResearchError(
      err instanceof Error ? err.message : 'Failed to poll research interaction',
      err,
    )
  }
}
