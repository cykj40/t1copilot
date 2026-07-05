import type { AgentRunOutput, BehaviorCase } from '../types'

interface BehaviorScorerArgs {
  input: BehaviorCase
  expected?: BehaviorCase
  output: AgentRunOutput
}

function leafKeyPaths(obj: Record<string, unknown>, prefix = ''): string[] {
  const paths: string[] = []
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      paths.push(...leafKeyPaths(value as Record<string, unknown>, path))
    } else {
      paths.push(path)
    }
  }
  return paths
}

function getAtPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined
    }
    return (current as Record<string, unknown>)[segment]
  }, obj)
}

export function toolCalledScorer(args: BehaviorScorerArgs) {
  const expectedCase = args.expected ?? args.input
  const called = args.output.toolCalls.some((c) => c.toolName === expectedCase.expectedTool)
  return {
    name: 'toolCalledScorer',
    score: called ? 1 : 0,
    metadata: {
      expectedTool: expectedCase.expectedTool,
      calledTools: args.output.toolCalls.map((c) => c.toolName),
    },
  }
}

export function toolInputScorer(args: BehaviorScorerArgs) {
  const expectedCase = args.expected ?? args.input
  if (!expectedCase.expectedInput) {
    return null
  }

  const matchingCall = args.output.toolCalls.find((c) => c.toolName === expectedCase.expectedTool)
  if (!matchingCall) {
    return {
      name: 'toolInputScorer',
      score: 0,
      metadata: { reason: `Tool ${expectedCase.expectedTool} was not called` },
    }
  }

  const leafPaths = leafKeyPaths(expectedCase.expectedInput)
  if (leafPaths.length === 0) {
    return { name: 'toolInputScorer', score: 1, metadata: {} }
  }

  let matched = 0
  const mismatches: string[] = []
  for (const path of leafPaths) {
    const expectedValue = getAtPath(expectedCase.expectedInput, path)
    const actualValue = getAtPath(matchingCall.input, path)
    if (actualValue === expectedValue) {
      matched++
    } else {
      mismatches.push(path)
    }
  }

  return {
    name: 'toolInputScorer',
    score: matched / leafPaths.length,
    metadata: {
      mismatches,
      expectedInput: expectedCase.expectedInput,
      actualInput: matchingCall.input,
    },
  }
}
