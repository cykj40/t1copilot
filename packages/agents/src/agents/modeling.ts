import { ChatAnthropic } from '@langchain/anthropic'
import type { T1CopilotState } from '../state.js'
import { MEDICAL_DISCLAIMER } from '../state.js'
import {
  compareExpectedVsActual,
  detectParameterDrift,
  getBaselineParameters,
} from '../tools/dexcom.js'

function createLlm(): ChatAnthropic {
  return new ChatAnthropic({ model: 'claude-haiku-4-5-20251001' })
}

export async function modelingAgentNode(state: T1CopilotState): Promise<Partial<T1CopilotState>> {
  let toolContext = ''

  try {
    const [baseline, drift] = await Promise.all([getBaselineParameters(), detectParameterDrift()])

    if (baseline !== null) {
      toolContext += `Baseline parameters (READ-ONLY): ISF=${String(baseline.isf)}, ICR=1u/${String(baseline.icr)}g, Basal=${String(baseline.basalUnitsPerDay)}u/day\n`
    } else {
      toolContext +=
        'Baseline parameters: ISF=30 mg/dL/u, ICR=1u/4g carbs, Basal=30u/day (defaults)\n'
    }

    if (drift !== null) {
      if (drift.driftDetected) {
        toolContext += `Parameter drift detected: ${drift.affectedParameter ?? 'unknown'} by ${String(drift.magnitude ?? 0)} — ${drift.recommendation ?? ''}\n`
      } else {
        toolContext += 'No parameter drift detected in current period.\n'
      }
    }

    const today = new Date().toISOString().split('T')[0] ?? new Date().toISOString()
    const sevenDaysAgo = (() => {
      const d = new Date()
      d.setDate(d.getDate() - 7)
      return d.toISOString().split('T')[0] ?? d.toISOString()
    })()

    const comparison = await compareExpectedVsActual({ startDate: sevenDaysAgo, endDate: today })
    if (comparison !== null) {
      toolContext += `Model accuracy (MAPE): ${String(comparison.mape)}%\n`
    }
  } catch (fetchError) {
    toolContext = `Data fetch error: ${fetchError instanceof Error ? fetchError.message : 'unknown'}`
    if (toolContext === '') {
      toolContext =
        'Baseline: ISF=30, ICR=1u/4g, Basal=30u/day (defaults — Dexcom MCP not connected).'
    }
  }

  const prompt = `You are the Glucose Modeling Agent for T1Copilot, an AI assistant for Type 1 diabetes management.

User query: "${state.userQuery}"

Modeling context:
${toolContext}

Provide a glucose impact prediction or modeling analysis based on the user's query.
IMPORTANT CONSTRAINTS:
- Baseline parameters (ISF, ICR, basal) are READ-ONLY — never suggest changing them
- Frame predictions as estimates with uncertainty, not prescriptions
- Do not recommend specific insulin doses
Keep response under 200 words.`

  try {
    const llm = createLlm()
    const result = await llm.invoke(prompt)
    const text =
      typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
    return {
      agentResponse: `${text}\n\n${MEDICAL_DISCLAIMER}`,
      activeAgent: 'modelingAgent',
    }
  } catch (error) {
    return {
      agentResponse: `Glucose modeling unavailable. ${MEDICAL_DISCLAIMER}`,
      error: error instanceof Error ? error.message : 'Modeling agent failed',
      activeAgent: 'modelingAgent',
    }
  }
}
