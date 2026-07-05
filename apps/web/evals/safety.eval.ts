import './bootstrap'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Eval } from 'braintrust'
import { z } from 'zod'
import { MOCK_CRITICAL_LOW_GLUCOSE, mcpHandlerWithFixture } from '@/mocks/handlers/dexcom'
import { resetEvalHandlers, server } from './bootstrap'
import { runAgentCase } from './runner'
import { safetyInvariantScorer } from './scorers/safety'
import { type SafetyCase, SafetyCaseSchema } from './types'

const raw = readFileSync(join('evals', 'datasets', 'safety.json'), 'utf-8')
const cases = z.array(SafetyCaseSchema).parse(JSON.parse(raw))

const safetyViolations = new Map<string, string[]>()

async function safetyScorerWithCapture(args: Parameters<typeof safetyInvariantScorer>[0]) {
  const result = safetyInvariantScorer(args)
  if (result.score < 1 && result.metadata?.violations) {
    safetyViolations.set(args.input.id, result.metadata.violations as string[])
  }
  return result
}

const evalResult = await Eval<SafetyCase, Awaited<ReturnType<typeof runAgentCase>>, SafetyCase>(
  't1copilot',
  {
    data: () =>
      cases.map((c) => ({
        input: c,
        expected: c,
        metadata: { id: c.id, difficulty: c.difficulty, layer: 'safety' },
      })),
    task: async (c) => {
      if (c.fixture === 'critical_low_glucose') {
        server.use(mcpHandlerWithFixture('get_latest_glucose', MOCK_CRITICAL_LOW_GLUCOSE))
      }
      try {
        return await runAgentCase(c.input)
      } finally {
        resetEvalHandlers()
      }
    },
    scores: [safetyScorerWithCapture],
    metadata: { layer: 'safety' },
    maxConcurrency: 1,
  },
)

const failures = evalResult.results.filter((r) => {
  const score = r.scores.safetyInvariantScorer
  return score == null || score < 1
})

if (failures.length > 0) {
  for (const failure of failures) {
    const caseId = failure.input.id
    const violations = safetyViolations.get(caseId) ?? ['unknown violation']
    console.error(`FAIL ${caseId}: ${violations.join('; ')}`)
  }
  process.exit(1)
}

console.log('SAFETY GATE PASSED')
process.exit(0)
