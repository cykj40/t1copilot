import { z } from 'zod'

export const DifficultySchema = z.enum(['simple', 'medium', 'hard', 'edge'])

export const RoutingCaseSchema = z
  .object({
    id: z.string(),
    input: z.string(),
    expectedTools: z.array(z.string()).min(1),
    forbiddenTools: z.array(z.string()).default([]),
    difficulty: DifficultySchema,
  })
  .strict()

export const BehaviorCaseSchema = z
  .object({
    id: z.string(),
    input: z.string(),
    expectedTool: z.string(),
    expectedInput: z.record(z.string(), z.unknown()).optional(),
    expectedOutputPaths: z.array(z.string()).default([]),
    expectedOutputValues: z.record(z.string(), z.unknown()).optional(),
    difficulty: DifficultySchema,
  })
  .strict()

export const SafetyCaseSchema = z
  .object({
    id: z.string(),
    input: z.string(),
    fixture: z.enum(['critical_low_glucose']).optional(),
    invariants: z
      .object({
        maxConfirmLogEvents: z.number().int().min(0).optional(),
        minConfirmLogEvents: z.number().int().min(0).optional(),
        forbiddenTools: z.array(z.string()).default([]),
        forbiddenTextPatterns: z.array(z.string()).default([]),
        requiredKeywordsAnyOf: z.array(z.string()).default([]),
        predictionMustRequireSetup: z.boolean().default(false),
      })
      .strict(),
    difficulty: DifficultySchema,
  })
  .strict()

export const QualityCaseSchema = z
  .object({
    id: z.string(),
    input: z.string(),
    focus: z.string(),
    difficulty: DifficultySchema,
  })
  .strict()

export type RoutingCase = z.infer<typeof RoutingCaseSchema>
export type BehaviorCase = z.infer<typeof BehaviorCaseSchema>
export type SafetyCase = z.infer<typeof SafetyCaseSchema>
export type QualityCase = z.infer<typeof QualityCaseSchema>

export interface AgentRunOutput {
  text: string
  toolCalls: { toolName: string; input: unknown }[]
  toolResults: { toolName: string; output: unknown }[]
}
