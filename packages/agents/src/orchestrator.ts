import { ChatAnthropic } from '@langchain/anthropic'
import { END } from '@langchain/langgraph'
import { z } from 'zod'
import type { T1CopilotState } from './state.js'
import { MEDICAL_DISCLAIMER } from './state.js'

export const IntentSchema = z.object({
  intent: z.enum([
    'glucose_analysis',
    'exercise_correlation',
    'glucose_prediction',
    'log_event',
    'insight_synthesis',
    'multi_agent',
    'unknown',
  ]),
})

export type Intent = z.infer<typeof IntentSchema>['intent']

function createLlm(): ChatAnthropic {
  return new ChatAnthropic({ model: 'claude-haiku-4-5-20251001' })
}

export async function orchestratorNode(state: T1CopilotState): Promise<Partial<T1CopilotState>> {
  const llm = createLlm()
  const structuredLlm = llm.withStructuredOutput(IntentSchema)

  const prompt = `You are the orchestrator for T1Copilot, an AI system for Type 1 diabetes management.

Classify the user's intent into exactly one category:

User query: "${state.userQuery}"

Categories:
- glucose_analysis: Questions about current glucose, trends, time in range, or past glucose patterns
- exercise_correlation: Questions about how exercise (e.g. Peloton, workouts) affects blood glucose
- glucose_prediction: Questions about predicting glucose impact of food, insulin, or exercise
- log_event: Requests to log insulin, carbs, or an exercise session
- insight_synthesis: Requests for overall patterns, weekly summaries, or cross-domain insights
- multi_agent: Complex queries that need both glucose analysis AND exercise correlation together
- unknown: Cannot classify confidently

Return only the intent field.`

  try {
    const result = await structuredLlm.invoke(prompt)
    return {
      intent: result.intent,
      activeAgent: result.intent,
    }
  } catch (error) {
    return {
      intent: 'unknown',
      activeAgent: 'unknown',
      error: error instanceof Error ? error.message : 'Orchestrator classification failed',
    }
  }
}

export function routeFromOrchestrator(state: T1CopilotState): string {
  switch (state.intent) {
    case 'glucose_analysis':
      return 'glucoseAgent'
    case 'exercise_correlation':
      return 'exerciseAgent'
    case 'glucose_prediction':
      return 'modelingAgent'
    case 'log_event':
      return 'eventLoggerAgent'
    case 'insight_synthesis':
      return 'insightAgent'
    case 'multi_agent':
      return 'glucoseAgent'
    default:
      return END
  }
}

export function routeFromGlucoseAgent(state: T1CopilotState): string {
  return state.intent === 'multi_agent' ? 'exerciseAgent' : END
}

export function routeFromExerciseAgent(state: T1CopilotState): string {
  return state.intent === 'multi_agent' ? 'insightAgent' : END
}

export async function unknownIntentNode(_state: T1CopilotState): Promise<Partial<T1CopilotState>> {
  return {
    agentResponse: `I wasn't sure how to help with that. Try asking about your glucose trends, exercise impact, glucose predictions, or request to log an event.\n\n${MEDICAL_DISCLAIMER}`,
  }
}
