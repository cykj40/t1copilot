import { anthropic } from '@ai-sdk/anthropic'
import { generateText, stepCountIs } from 'ai'
import {
  AGENT_MODEL_ID,
  AGENT_STOP_STEP_COUNT,
  agentTools,
  buildSystemPrompt,
} from '@/lib/agent-core'
import type { AgentRunOutput } from './types'

/**
 * Runs one eval case through the real agent: same model, same system
 * prompt, same 16 tools as /api/chat — but via generateText so we get a
 * settled result with per-step tool calls, instead of a UI stream.
 * Memory section is '' — evals are context-free by design.
 */
export async function runAgentCase(input: string): Promise<AgentRunOutput> {
  const result = await generateText({
    model: anthropic(AGENT_MODEL_ID),
    stopWhen: stepCountIs(AGENT_STOP_STEP_COUNT),
    system: buildSystemPrompt(''),
    messages: [{ role: 'user', content: input }],
    tools: agentTools,
  })

  const toolCalls = result.steps.flatMap((s) =>
    s.toolCalls.map((c) => ({ toolName: c.toolName, input: c.input as unknown })),
  )
  const toolResults = result.steps.flatMap((s) =>
    s.toolResults.map((r) => ({ toolName: r.toolName, output: r.output as unknown })),
  )

  return { text: result.text, toolCalls, toolResults }
}
