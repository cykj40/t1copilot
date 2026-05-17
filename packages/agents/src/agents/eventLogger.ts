import { ChatAnthropic } from '@langchain/anthropic'
import { interrupt } from '@langchain/langgraph'
import { z } from 'zod'
import type { T1CopilotState } from '../state.js'
import { MEDICAL_DISCLAIMER } from '../state.js'
import { logCarbs, logExercise, logInsulin } from '../tools/dexcom.js'

const EventClassificationSchema = z.object({
  eventType: z.enum(['insulin', 'carbs', 'exercise', 'unknown']),
  insulinUnits: z.number().nullable(),
  insulinType: z.enum(['rapid', 'long', 'correction']).nullable(),
  carbGrams: z.number().nullable(),
  exerciseDurationMinutes: z.number().nullable(),
  exerciseType: z.string().nullable(),
  note: z.string().nullable(),
})

type EventClassification = z.infer<typeof EventClassificationSchema>

interface HITLPayload {
  action: string
  details: EventClassification
  warning: string
}

function createLlm(): ChatAnthropic {
  return new ChatAnthropic({ model: 'claude-haiku-4-5-20251001' })
}

async function classifyEvent(query: string): Promise<EventClassification> {
  const llm = createLlm()
  const structuredLlm = llm.withStructuredOutput(EventClassificationSchema)

  const prompt = `Extract the event details from this logging request: "${query}"

Return the event type and relevant values. Set unrelated fields to null.`

  return structuredLlm.invoke(prompt)
}

export async function eventLoggerNode(state: T1CopilotState): Promise<Partial<T1CopilotState>> {
  let event: EventClassification

  try {
    event = await classifyEvent(state.userQuery)
  } catch (error) {
    return {
      agentResponse: `Could not parse the event from your request. Please try again with more detail (e.g., "log 3 units rapid insulin" or "log 45g carbs").\n\n${MEDICAL_DISCLAIMER}`,
      error: error instanceof Error ? error.message : 'Event classification failed',
      activeAgent: 'eventLoggerAgent',
    }
  }

  if (event.eventType === 'unknown') {
    return {
      agentResponse: `I couldn't determine what to log. Please specify insulin units, carb grams, or exercise details.\n\n${MEDICAL_DISCLAIMER}`,
      activeAgent: 'eventLoggerAgent',
    }
  }

  // ── HUMAN-IN-THE-LOOP: required before any logging action ────────────────
  const hitlPayload: HITLPayload = {
    action: `log_${event.eventType}`,
    details: event,
    warning: 'This action will log a medical event. Review carefully before confirming.',
  }

  const resumeValue: unknown = interrupt(hitlPayload)
  const approved = resumeValue === true

  if (!approved) {
    return {
      agentResponse: `Logging cancelled. No data was recorded.\n\n${MEDICAL_DISCLAIMER}`,
      requiresHITL: false,
      activeAgent: 'eventLoggerAgent',
    }
  }

  // ── Execute logging (stubbed — wired in Priority 5) ──────────────────────
  let response = ''

  try {
    if (event.eventType === 'insulin') {
      if (event.insulinUnits === null || event.insulinType === null) {
        return {
          agentResponse: `Missing insulin details. Please specify units and type (rapid/long/correction).\n\n${MEDICAL_DISCLAIMER}`,
          activeAgent: 'eventLoggerAgent',
        }
      }
      await logInsulin({
        units: event.insulinUnits,
        insulinType: event.insulinType,
        ...(event.note !== null ? { note: event.note } : {}),
      })
      response = `Logged ${String(event.insulinUnits)} units ${event.insulinType} insulin.`
    } else if (event.eventType === 'carbs') {
      if (event.carbGrams === null) {
        return {
          agentResponse: `Missing carb amount. Please specify grams.\n\n${MEDICAL_DISCLAIMER}`,
          activeAgent: 'eventLoggerAgent',
        }
      }
      await logCarbs({
        grams: event.carbGrams,
        ...(event.note !== null ? { note: event.note } : {}),
      })
      response = `Logged ${String(event.carbGrams)}g carbohydrates.`
    } else if (event.eventType === 'exercise') {
      if (event.exerciseDurationMinutes === null) {
        return {
          agentResponse: `Missing exercise duration. Please specify minutes.\n\n${MEDICAL_DISCLAIMER}`,
          activeAgent: 'eventLoggerAgent',
        }
      }
      await logExercise({
        durationMinutes: event.exerciseDurationMinutes,
        type: event.exerciseType ?? 'workout',
        ...(event.note !== null ? { note: event.note } : {}),
      })
      response = `Logged ${String(event.exerciseDurationMinutes)}-minute ${event.exerciseType ?? 'workout'}.`
    }
  } catch (logError) {
    return {
      agentResponse: `Logging failed: ${logError instanceof Error ? logError.message : 'unknown error'}.\n\n${MEDICAL_DISCLAIMER}`,
      error: logError instanceof Error ? logError.message : 'Log write failed',
      activeAgent: 'eventLoggerAgent',
    }
  }

  return {
    agentResponse: `${response}\n\n${MEDICAL_DISCLAIMER}`,
    requiresHITL: false,
    activeAgent: 'eventLoggerAgent',
  }
}
