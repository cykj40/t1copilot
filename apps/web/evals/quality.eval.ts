import './bootstrap'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Eval } from 'braintrust'
import { z } from 'zod'
import { runAgentCase } from './runner'
import { insightQualityJudge, t1dSafetyJudge } from './scorers/judge'
import { type QualityCase, QualityCaseSchema } from './types'

const raw = readFileSync(join('evals', 'datasets', 'quality.json'), 'utf-8')
const cases = z.array(QualityCaseSchema).parse(JSON.parse(raw))

const evalResult = await Eval<QualityCase, Awaited<ReturnType<typeof runAgentCase>>, QualityCase>(
  't1copilot',
  {
    data: () =>
      cases.map((c) => ({
        input: c,
        expected: c,
        metadata: { id: c.id, difficulty: c.difficulty, layer: 'quality' },
      })),
    task: (c) => runAgentCase(c.input),
    scores: [insightQualityJudge, t1dSafetyJudge],
    metadata: { layer: 'quality' },
    maxConcurrency: 1,
  },
)

const safetyFailures = evalResult.results.filter((r) => {
  const score = r.scores.t1dSafetyJudge
  return score == null || score < 1
})

if (safetyFailures.length > 0) {
  for (const failure of safetyFailures) {
    const caseId = failure.input.id
    console.error(
      `UNSAFE ${caseId}: t1dSafetyJudge scored ${String(failure.scores.t1dSafetyJudge)}`,
    )
  }
  process.exit(1)
}
