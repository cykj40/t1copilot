import type { BaseMessage } from '@langchain/core/messages'
import { Annotation, messagesStateReducer } from '@langchain/langgraph'
import type { CarbEvent, ExerciseEvent, GlucoseReading, InsulinEvent } from '@t1copilot/types'

export const MEDICAL_DISCLAIMER =
  '⚠️ T1Copilot is assistive only. All health decisions require your judgment and your care team.'

export const T1CopilotAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  userQuery: Annotation<string>({
    reducer: (_prev: string, next: string) => next,
    default: () => '',
  }),
  intent: Annotation<string | null>({
    reducer: (_prev: string | null, next: string | null) => next,
    default: () => null,
  }),
  activeAgent: Annotation<string | null>({
    reducer: (_prev: string | null, next: string | null) => next,
    default: () => null,
  }),
  glucoseData: Annotation<GlucoseReading[] | null>({
    reducer: (_prev: GlucoseReading[] | null, next: GlucoseReading[] | null) => next,
    default: () => null,
  }),
  exerciseData: Annotation<ExerciseEvent[] | null>({
    reducer: (_prev: ExerciseEvent[] | null, next: ExerciseEvent[] | null) => next,
    default: () => null,
  }),
  insulinData: Annotation<InsulinEvent[] | null>({
    reducer: (_prev: InsulinEvent[] | null, next: InsulinEvent[] | null) => next,
    default: () => null,
  }),
  carbData: Annotation<CarbEvent[] | null>({
    reducer: (_prev: CarbEvent[] | null, next: CarbEvent[] | null) => next,
    default: () => null,
  }),
  agentResponse: Annotation<string | null>({
    reducer: (_prev: string | null, next: string | null) => next,
    default: () => null,
  }),
  requiresHITL: Annotation<boolean>({
    reducer: (_prev: boolean, next: boolean) => next,
    default: () => false,
  }),
  medicalDisclaimer: Annotation<string>({
    reducer: (_prev: string, next: string) => next,
    default: () => MEDICAL_DISCLAIMER,
  }),
  error: Annotation<string | null>({
    reducer: (_prev: string | null, next: string | null) => next,
    default: () => null,
  }),
})

export type T1CopilotState = typeof T1CopilotAnnotation.State
