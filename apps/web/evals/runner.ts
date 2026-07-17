import { anthropic } from '@ai-sdk/anthropic'
import { generateText, stepCountIs, tool } from 'ai'
import { z } from 'zod'
import {
  AGENT_MODEL_ID,
  AGENT_STOP_STEP_COUNT,
  agentTools,
  buildSystemPrompt,
  ViewArtifactPanelOutputSchema,
} from '@/lib/agent-core'
import type { AgentRunOutput } from './types'

/**
 * view_artifact_panel has no execute — it's resolved client-side in the
 * browser via addToolOutput (see AgentChat.tsx). generateText here runs
 * headless with no browser, so if the model calls it, nothing would ever
 * resolve the tool call and the step loop would stall. Give it a stub
 * execute for eval runs only. Description is duplicated as a literal
 * (rather than read from agentTools.view_artifact_panel.description,
 * which is `string | undefined`) — exactOptionalPropertyTypes rejects
 * assigning that to an optional `description?: string` field.
 */
const viewArtifactPanelEvalStub = tool({
  description:
    'See a screenshot of what is currently rendered in the artifact panel, to verify a chart ' +
    'or other visual artifact actually rendered as intended.',
  inputSchema: z.object({}),
  outputSchema: ViewArtifactPanelOutputSchema,
  execute: async (): Promise<{ image: string } | { error: string }> => ({
    error: 'view_artifact_panel is not available in the eval environment (no browser).',
  }),
})

const evalTools = {
  ...agentTools,
  view_artifact_panel: viewArtifactPanelEvalStub,
}

/**
 * Runs one eval case through the real agent: same model, same system
 * prompt, same 17 tools as /api/chat — but via generateText so we get a
 * settled result with per-step tool calls, instead of a UI stream.
 * Memory section is '' — evals are context-free by design.
 */
export async function runAgentCase(input: string): Promise<AgentRunOutput> {
  const result = await generateText({
    model: anthropic(AGENT_MODEL_ID),
    stopWhen: stepCountIs(AGENT_STOP_STEP_COUNT),
    system: buildSystemPrompt(''),
    messages: [{ role: 'user', content: input }],
    tools: evalTools,
  })

  const toolCalls = result.steps.flatMap((s) =>
    s.toolCalls.map((c) => ({ toolName: c.toolName, input: c.input as unknown })),
  )
  const toolResults = result.steps.flatMap((s) =>
    s.toolResults.map((r) => ({ toolName: r.toolName, output: r.output as unknown })),
  )

  return { text: result.text, toolCalls, toolResults }
}
