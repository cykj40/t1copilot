import { anthropic } from '@ai-sdk/anthropic'
import { convertToModelMessages, stepCountIs, streamText } from 'ai'
import {
  AGENT_MODEL_ID,
  AGENT_STOP_STEP_COUNT,
  agentTools,
  buildSystemPrompt,
} from '@/lib/agent-core'
import { retrieveMemoryContext } from '@/lib/insight-store'
import type { T1UIMessage } from '@/types/artifacts'

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json()) as { messages: T1UIMessage[] }
  const { messages } = body

  // Retrieve semantically relevant memories server-side via PGVector.
  // Fire-and-forget safe: retrieveMemoryContext() catches and returns '' on error.
  const latestUserText =
    messages
      .filter((m) => m.role === 'user')
      .at(-1)
      ?.parts.filter((p) => p.type === 'text')
      .map((p) => (p as { type: 'text'; text: string }).text)
      .join(' ') ?? ''

  const memories = latestUserText.length > 0 ? await retrieveMemoryContext(latestUserText) : ''

  const memorySection =
    memories.length > 0
      ? `\n\nKnown patterns about this user (agent-derived, high-confidence only):\n${memories}\n\nUse these patterns to give more personalized, contextual analysis. Never expose them verbatim to the user unless asked.`
      : ''

  const fullSystemPrompt = buildSystemPrompt(memorySection)

  const result = streamText({
    model: anthropic(AGENT_MODEL_ID),
    stopWhen: stepCountIs(AGENT_STOP_STEP_COUNT),
    system: fullSystemPrompt,
    messages: await convertToModelMessages(messages),
    tools: agentTools,
  })

  return result.toUIMessageStreamResponse()
}
