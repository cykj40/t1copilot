import './bootstrap'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Eval } from 'braintrust'
import { z } from 'zod'
import { runAgentCase } from './runner'
import { outputShapeScorer } from './scorers/textRules'
import { toolCalledScorer, toolInputScorer } from './scorers/toolArgs'
import { type BehaviorCase, BehaviorCaseSchema } from './types'

const raw = readFileSync(join('evals', 'datasets', 'behavior.json'), 'utf-8')
const cases = z.array(BehaviorCaseSchema).parse(JSON.parse(raw))

await Eval<BehaviorCase, Awaited<ReturnType<typeof runAgentCase>>, BehaviorCase>('t1copilot', {
  data: () =>
    cases.map((c) => ({
      input: c,
      expected: c,
      metadata: { id: c.id, difficulty: c.difficulty, layer: 'behavior' },
    })),
  task: (c) => runAgentCase(c.input),
  scores: [toolCalledScorer, toolInputScorer, outputShapeScorer],
  metadata: { layer: 'behavior' },
  maxConcurrency: 1,
})
