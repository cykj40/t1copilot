import type { AgentRunOutput, RoutingCase } from '../types'

interface ToolSelectionScorerArgs {
  input: RoutingCase
  expected?: RoutingCase
  output: AgentRunOutput
}

export function toolSelectionScorer(args: ToolSelectionScorerArgs) {
  const expectedCase = args.expected ?? args.input
  const called = args.output.toolCalls.map((c) => c.toolName)
  const expected = expectedCase.expectedTools
  const forbidden = expectedCase.forbiddenTools

  const forbiddenHit = forbidden.filter((t) => called.includes(t))
  if (forbiddenHit.length > 0) {
    return {
      name: 'toolSelectionScorer',
      score: 0,
      metadata: {
        called,
        expected,
        forbidden,
        missing: expected.filter((t) => !called.includes(t)),
        reason: `Forbidden tools called: ${forbiddenHit.join(', ')}`,
      },
    }
  }

  const matched = expected.filter((t) => called.includes(t))
  const missing = expected.filter((t) => !called.includes(t))
  const score = expected.length === 0 ? 1 : matched.length / expected.length

  return {
    name: 'toolSelectionScorer',
    score,
    metadata: { called, expected, forbidden, missing },
  }
}
