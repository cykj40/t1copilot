import { z } from 'zod'

export const GeminiInteractionCreateRequestSchema = z
  .object({
    input: z.string(),
    agent: z.literal('deep-research-preview-04-2026'),
    background: z.literal(true),
    agent_config: z.object({
      type: z.literal('deep-research'),
      thinking_summaries: z.literal('auto'),
    }),
  })
  .strict()

export type GeminiInteractionCreateRequest = z.infer<typeof GeminiInteractionCreateRequestSchema>

export const GeminiAnnotationSchema = z.object({
  type: z.string(),
  url: z.string().optional(),
  title: z.string().optional(),
})

export type GeminiAnnotation = z.infer<typeof GeminiAnnotationSchema>

export const GeminiContentBlockSchema = z.object({
  type: z.string(),
  text: z.string().optional(),
  annotations: z.array(GeminiAnnotationSchema).optional(),
})

export type GeminiContentBlock = z.infer<typeof GeminiContentBlockSchema>

export const GeminiStepSchema = z.object({
  type: z.string(),
  content: z.array(GeminiContentBlockSchema).optional(),
})

export type GeminiStep = z.infer<typeof GeminiStepSchema>

export const GeminiInteractionStatusSchema = z
  .enum(['created', 'in_progress', 'requires_action', 'completed', 'failed'])
  .catch('failed')

export type GeminiInteractionStatus = z.infer<typeof GeminiInteractionStatusSchema>

export const GeminiInteractionResponseSchema = z.object({
  id: z.string(),
  status: GeminiInteractionStatusSchema,
  steps: z.array(GeminiStepSchema).optional().default([]),
  object: z.string().optional(),
  model: z.string().optional(),
})

export type GeminiInteractionResponse = z.infer<typeof GeminiInteractionResponseSchema>

export interface ExtractedModelOutput {
  text: string | null
  sources: { url: string; title?: string }[]
}

export function extractModelOutputText(response: GeminiInteractionResponse): ExtractedModelOutput {
  const modelOutputSteps = response.steps.filter((step) => step.type === 'model_output')
  const lastStep = modelOutputSteps.at(-1)

  if (!lastStep?.content || lastStep.content.length === 0) {
    return { text: null, sources: [] }
  }

  const textParts: string[] = []
  const sources: { url: string; title?: string }[] = []

  for (const block of lastStep.content) {
    if (block.text !== undefined && block.text.length > 0) {
      textParts.push(block.text)
    }

    if (block.annotations !== undefined) {
      for (const annotation of block.annotations) {
        if (annotation.url !== undefined) {
          sources.push({
            url: annotation.url,
            ...(annotation.title !== undefined ? { title: annotation.title } : {}),
          })
        }
      }
    }
  }

  const text = textParts.length > 0 ? textParts.join('\n') : null
  return { text, sources }
}
