import { z } from 'zod'

const ParameterValueSchema = z
  .object({
    value: z.number(),
    description: z.string(),
  })
  .strict()

const ConfidenceRangeSchema = z
  .object({
    low: z.number(),
    high: z.number(),
  })
  .strict()

const EffectBlockSchema = z
  .object({
    currentGlucose: z.number(),
    predictedChange: z.number(),
    predictedGlucose: z.number(),
    confidenceRange: ConfidenceRangeSchema,
    timeHorizonMinutes: z.number(),
    factors: z.array(z.string()),
    disclaimer: z.string(),
  })
  .strict()

const CombinedBlockSchema = z
  .object({
    insulinEffect: z.number(),
    carbEffect: z.number(),
    netChange: z.number(),
    predictedGlucose: z.number(),
    confidenceRange: ConfidenceRangeSchema,
    timeHorizonMinutes: z.number(),
  })
  .strict()

const GlucoseStatisticsSchema = z
  .object({
    average: z.number(),
    standardDeviation: z.number(),
    min: z.number(),
    max: z.number(),
    timeInRange: z.number(),
    timeBelowRange: z.number(),
    timeAboveRange: z.number(),
    readingCount: z.number(),
    coefficientOfVariation: z.number(),
  })
  .strict()

export const BaselineParametersResponseSchema = z
  .object({
    baselineParameters: z
      .object({
        insulinSensitivityFactor: ParameterValueSchema,
        insulinToCarbRatio: ParameterValueSchema,
        basalDose: ParameterValueSchema,
        basalTiming: z.string(),
        updatedAt: z.string(),
      })
      .strict(),
    note: z.string(),
  })
  .strict()

export const PredictGlucoseImpactResponseSchema = z
  .object({
    currentGlucose: z.number(),
    baselineParameters: z
      .object({
        isf: z.number(),
        icr: z.number(),
      })
      .strict(),
    insulin: EffectBlockSchema.optional(),
    carbs: EffectBlockSchema.optional(),
    combined: CombinedBlockSchema.optional(),
    disclaimer: z.string(),
  })
  .strict()

export const CompareExpectedVsActualResponseSchema = z
  .object({
    event: z
      .object({
        type: z.string(),
        value: z.number(),
        timestamp: z.string(),
        startingGlucose: z.number(),
      })
      .strict(),
    prediction: z
      .object({
        predictedGlucose: z.number(),
        predictedChange: z.number(),
        confidenceRange: ConfidenceRangeSchema,
      })
      .strict(),
    actual: z
      .object({
        readingsAnalyzed: z.number(),
        finalGlucose: z.number(),
      })
      .strict(),
    observation: z
      .object({
        observationType: z.string(),
        expectedValue: z.number(),
        actualValue: z.number(),
        deviationPct: z.number(),
        context: z
          .object({
            timeOfDay: z.string(),
            hour: z.number(),
            eventType: z.string(),
          })
          .strict(),
        hypothesis: z.string(),
        timestamp: z.string(),
        id: z.number(),
      })
      .strict(),
    disclaimer: z.string(),
  })
  .strict()

export const GlucoseStatisticsResponseSchema = z
  .object({
    timeRange: z
      .object({
        start: z.string(),
        end: z.string(),
        hours: z.number(),
      })
      .strict(),
    statistics: GlucoseStatisticsSchema,
  })
  .strict()

export type BaselineParametersResponse = z.infer<typeof BaselineParametersResponseSchema>
export type PredictGlucoseImpactResponse = z.infer<typeof PredictGlucoseImpactResponseSchema>
export type CompareExpectedVsActualResponse = z.infer<typeof CompareExpectedVsActualResponseSchema>
export type GlucoseStatisticsResponse = z.infer<typeof GlucoseStatisticsResponseSchema>

export type PredictGlucoseImpactArgs = {
  action_type: 'insulin' | 'carbs' | 'both'
  insulin_units?: number
  carb_grams?: number
  current_glucose?: number
}

export type CompareExpectedVsActualArgs = {
  event_type: 'insulin' | 'carbs'
  event_timestamp: string
  event_value: number
  current_glucose: number
  window_hours?: number
}

export const UpdateBaselineParametersArgsSchema = z
  .object({
    correction_factor: z.number().positive().optional(),
    insulin_to_carb_ratio: z.number().positive().optional(),
    basal_dose: z.number().positive().optional(),
    basal_timing: z.string().optional(),
    notes: z.string().optional(),
    confirmed: z.literal(true).optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.correction_factor !== undefined ||
      data.insulin_to_carb_ratio !== undefined ||
      data.basal_dose !== undefined ||
      data.basal_timing !== undefined ||
      data.notes !== undefined,
    { message: 'At least one parameter field is required' },
  )

export const UpdateBaselineParametersResponseSchema = z
  .object({
    success: z.literal(true),
    updatedParameters: z
      .object({
        insulinSensitivityFactor: ParameterValueSchema,
        insulinToCarbRatio: ParameterValueSchema,
        basalDose: ParameterValueSchema,
        basalTiming: z.string(),
        updatedAt: z.string(),
      })
      .strict(),
    note: z.string(),
  })
  .strict()

export type UpdateBaselineParametersArgs = z.infer<typeof UpdateBaselineParametersArgsSchema>
export type UpdateBaselineParametersResponse = z.infer<
  typeof UpdateBaselineParametersResponseSchema
>
