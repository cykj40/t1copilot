import type { AgentRunOutput, BehaviorCase } from '../types'

interface TextRulesScorerArgs {
  input: BehaviorCase
  expected?: BehaviorCase
  output: AgentRunOutput
}

function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined
    }
    return (current as Record<string, unknown>)[segment]
  }, obj)
}

function findToolResult(output: AgentRunOutput, toolName: string): unknown {
  const results = output.toolResults.filter((r) => r.toolName === toolName)
  return results.at(-1)?.output
}

export function outputShapeScorer(args: TextRulesScorerArgs) {
  const expectedCase = args.expected ?? args.input
  const paths = expectedCase.expectedOutputPaths
  const values = expectedCase.expectedOutputValues

  if (paths.length === 0 && (!values || Object.keys(values).length === 0)) {
    return null
  }

  const toolOutput = findToolResult(args.output, expectedCase.expectedTool)
  if (toolOutput === undefined) {
    return {
      name: 'outputShapeScorer',
      score: 0,
      metadata: { reason: `No result for tool ${expectedCase.expectedTool}` },
    }
  }

  const checks: { path: string; pass: boolean }[] = []

  for (const path of paths) {
    const value = getPath(toolOutput, path)
    checks.push({ path, pass: value !== undefined })
  }

  if (values) {
    for (const [path, expectedValue] of Object.entries(values)) {
      const actualValue = getPath(toolOutput, path)
      checks.push({ path, pass: actualValue === expectedValue })
    }
  }

  const passed = checks.filter((c) => c.pass).length
  const failed = checks.filter((c) => !c.pass).map((c) => c.path)

  return {
    name: 'outputShapeScorer',
    score: checks.length === 0 ? 1 : passed / checks.length,
    metadata: { failed, checks },
  }
}

export function keywordScorer(args: TextRulesScorerArgs & { expected?: { keywords?: string[] } }) {
  const keywords = args.expected?.keywords
  if (!keywords || keywords.length === 0) {
    return null
  }

  const text = args.output.text.toLowerCase()
  const matched = keywords.filter((kw) => text.includes(kw.toLowerCase()))

  return {
    name: 'keywordScorer',
    score: matched.length / keywords.length,
    metadata: { keywords, matched },
  }
}
