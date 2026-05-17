import { ChatAnthropic } from '@langchain/anthropic'
import type { T1CopilotState } from '../state.js'
import { MEDICAL_DISCLAIMER } from '../state.js'
import {
  pelotonAnalyzeGlucoseCorrelation,
  pelotonDetectHypoglycemiaRisk,
  pelotonGetDisciplineInsights,
  pelotonGetWorkouts,
} from '../tools/peloton.js'

function createLlm(): ChatAnthropic {
  return new ChatAnthropic({ model: 'claude-haiku-4-5-20251001' })
}

export async function exerciseAgentNode(state: T1CopilotState): Promise<Partial<T1CopilotState>> {
  let toolContext = ''

  try {
    const [workouts, correlation, hypoRisk, disciplineInsights] = await Promise.all([
      pelotonGetWorkouts({ limit: 10 }),
      pelotonAnalyzeGlucoseCorrelation({ limit: 30 }),
      pelotonDetectHypoglycemiaRisk({ lookbackDays: 14 }),
      pelotonGetDisciplineInsights(),
    ])

    if (workouts !== null && workouts.length > 0) {
      toolContext += `Recent ${String(workouts.length)} workouts fetched.\n`
    }
    if (correlation !== null) {
      toolContext += `Glucose-exercise correlation: r=${String(correlation.correlationCoefficient)} (p=${String(correlation.pValue)})\n`
      toolContext += `Summary: ${correlation.summary}\n`
    }
    if (hypoRisk !== null) {
      toolContext += `Post-exercise hypo risk: ${hypoRisk.riskLevel} (score: ${String(hypoRisk.riskScore)})\n`
      if (hypoRisk.contributingFactors.length > 0) {
        toolContext += `Contributing factors: ${hypoRisk.contributingFactors.join(', ')}\n`
      }
    }
    if (disciplineInsights !== null && disciplineInsights.length > 0) {
      const topInsight = disciplineInsights[0]
      if (topInsight !== undefined) {
        toolContext += `Top discipline: ${topInsight.discipline}, avg glucose impact: ${String(topInsight.avgGlucoseImpactMgdl)} mg/dL\n`
      }
    }
    if (toolContext === '') {
      toolContext = 'No Peloton workout data available yet (Peloton MCP not connected).'
    }
  } catch (fetchError) {
    toolContext = `Data fetch error: ${fetchError instanceof Error ? fetchError.message : 'unknown'}`
  }

  const prompt = `You are the Exercise Correlation Analyst for T1Copilot, an AI assistant for Type 1 diabetes management.

User query: "${state.userQuery}"

Available exercise and glucose correlation data:
${toolContext}

Analyze how exercise affects this user's blood glucose. Highlight post-exercise hypoglycemia risk, best workout timing patterns, and discipline-specific glucose impacts. Do not recommend specific insulin doses. Keep response under 200 words.`

  try {
    const llm = createLlm()
    const result = await llm.invoke(prompt)
    const text =
      typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
    return {
      agentResponse: `${text}\n\n${MEDICAL_DISCLAIMER}`,
      activeAgent: 'exerciseAgent',
    }
  } catch (error) {
    return {
      agentResponse: `Exercise analysis unavailable. ${MEDICAL_DISCLAIMER}`,
      error: error instanceof Error ? error.message : 'Exercise agent failed',
      activeAgent: 'exerciseAgent',
    }
  }
}
