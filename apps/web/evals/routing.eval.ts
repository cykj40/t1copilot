import './bootstrap'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Eval } from 'braintrust'
import { z } from 'zod'
import { runAgentCase } from './runner'
import { toolSelectionScorer } from './scorers/toolSelection'
import { type RoutingCase, RoutingCaseSchema } from './types'

const raw = readFileSync(join('evals', 'datasets', 'routing.json'), 'utf-8')
const cases = z.array(RoutingCaseSchema).parse(JSON.parse(raw))

await Eval<RoutingCase, Awaited<ReturnType<typeof runAgentCase>>, RoutingCase>('t1copilot', {
  data: () =>
    cases.map((c) => ({
      input: c,
      expected: c,
      metadata: { id: c.id, difficulty: c.difficulty, layer: 'routing' },
    })),
  task: (c) => runAgentCase(c.input),
  scores: [toolSelectionScorer],
  metadata: { layer: 'routing' },
  maxConcurrency: 1,
})
