import { ChatAnthropic } from '@langchain/anthropic'
import type { T1CopilotState } from '../state.js'
import { MEDICAL_DISCLAIMER } from '../state.js'
import { analyzeTrends, getAdaptiveInsights } from '../tools/dexcom.js'
import {
  pelotonAnalyzeGlucoseCorrelation,
  pelotonDetectHypoglycemiaRisk,
} from '../tools/peloton.js'

function createLlm(): ChatAnthropic {
  return new ChatAnthropic({ model: 'claude-sonnet-4-6' })
}

export async function insightAgentNode(state: T1CopilotState): Promise<Partial<T1CopilotState>> {
  let toolContext = ''

  const today = new Date().toISOString().split('T')[0] ?? new Date().toISOString()
  const sevenDaysAgo = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().split('T')[0] ?? d.toISOString()
  })()

  try {
    const [trends, adaptive, exerciseCorr, hypoRisk] = await Promise.all([
      analyzeTrends({ startDate: sevenDaysAgo, endDate: today }),
      getAdaptiveInsights(),
      pelotonAnalyzeGlucoseCorrelation({ limit: 30 }),
      pelotonDetectHypoglycemiaRisk({ lookbackDays: 14 }),
    ])

    if (trends !== null) {
      toolContext += `7-day glucose: avg ${String(trends.averageMgdl)} mg/dL, TIR ${String(trends.timeInRangePercent)}%, StdDev ${String(trends.standardDeviation)}, hyper ${String(trends.hyperPercent)}%, hypo ${String(trends.hypoPercent)}%\n`
    }
    if (adaptive !== null && adaptive.length > 0) {
      toolContext += `Adaptive insights:\n`
      for (const insight of adaptive) {
        toolContext += `  - [${insight.category}] ${insight.summary} (confidence: ${String(insight.confidence)})\n`
      }
    }
    if (exerciseCorr !== null) {
      toolContext += `Exercise-glucose correlation: r=${String(exerciseCorr.correlationCoefficient)}\n`
    }
    if (hypoRisk !== null) {
      toolContext += `Post-exercise hypo risk: ${hypoRisk.riskLevel}\n`
    }
    if (toolContext === '') {
      toolContext = 'No data available yet. MCP connections not yet established.'
    }
  } catch (fetchError) {
    toolContext = `Data fetch error: ${fetchError instanceof Error ? fetchError.message : 'unknown'}`
  }

  // If we arrived here via multi_agent, include the prior agent's response
  const priorContext =
    state.agentResponse !== null && state.agentResponse !== ''
      ? `\nPrior agent analysis:\n${state.agentResponse}\n`
      : ''

  const prompt = `You are the Insight Synthesis Agent for T1Copilot, an AI assistant for Type 1 diabetes management.

User query: "${state.userQuery}"
${priorContext}
Cross-domain data:
${toolContext}

Synthesize a holistic insight connecting glucose patterns, exercise impact, and any other relevant data. Highlight the most actionable observations. Surface patterns the user might not have noticed. Do not recommend specific doses or parameter changes. Keep response under 300 words.`

  try {
    const llm = createLlm()
    const result = await llm.invoke(prompt)
    const text =
      typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
    return {
      agentResponse: `${text}\n\n${MEDICAL_DISCLAIMER}`,
      activeAgent: 'insightAgent',
    }
  } catch (error) {
    return {
      agentResponse: `Insight synthesis unavailable. ${MEDICAL_DISCLAIMER}`,
      error: error instanceof Error ? error.message : 'Insight agent failed',
      activeAgent: 'insightAgent',
    }
  }
}
