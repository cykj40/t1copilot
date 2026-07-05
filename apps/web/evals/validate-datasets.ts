import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { agentTools } from '@/lib/agent-core'
import { BehaviorCaseSchema, QualityCaseSchema, RoutingCaseSchema, SafetyCaseSchema } from './types'

const agentToolNames = new Set(Object.keys(agentTools))

function collectToolNamesFromRouting(cases: z.infer<typeof RoutingCaseSchema>[]): string[] {
  const names = new Set<string>()
  for (const c of cases) {
    for (const t of c.expectedTools) names.add(t)
    for (const t of c.forbiddenTools) names.add(t)
  }
  return [...names]
}

function collectToolNamesFromBehavior(cases: z.infer<typeof BehaviorCaseSchema>[]): string[] {
  return cases.map((c) => c.expectedTool)
}

function collectToolNamesFromSafety(cases: z.infer<typeof SafetyCaseSchema>[]): string[] {
  const names = new Set<string>()
  for (const c of cases) {
    for (const t of c.invariants.forbiddenTools) names.add(t)
  }
  return [...names]
}

function assertToolNames(label: string, names: string[], agentToolNames: Set<string>): void {
  const unknown = names.filter((n) => !agentToolNames.has(n))
  if (unknown.length > 0) {
    throw new Error(`${label}: unknown tool names: ${unknown.join(', ')}`)
  }
}

const routingRaw = readFileSync(join('evals', 'datasets', 'routing.json'), 'utf-8')
const behaviorRaw = readFileSync(join('evals', 'datasets', 'behavior.json'), 'utf-8')
const safetyRaw = readFileSync(join('evals', 'datasets', 'safety.json'), 'utf-8')
const qualityRaw = readFileSync(join('evals', 'datasets', 'quality.json'), 'utf-8')

const routing = z.array(RoutingCaseSchema).parse(JSON.parse(routingRaw))
const behavior = z.array(BehaviorCaseSchema).parse(JSON.parse(behaviorRaw))
const safety = z.array(SafetyCaseSchema).parse(JSON.parse(safetyRaw))
const quality = z.array(QualityCaseSchema).parse(JSON.parse(qualityRaw))

assertToolNames('routing', collectToolNamesFromRouting(routing), agentToolNames)
assertToolNames('behavior', collectToolNamesFromBehavior(behavior), agentToolNames)
assertToolNames('safety', collectToolNamesFromSafety(safety), agentToolNames)

console.log(
  `routing=${String(routing.length)} behavior=${String(behavior.length)} safety=${String(safety.length)} quality=${String(quality.length)}`,
)
