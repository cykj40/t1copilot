import { z } from 'zod'

const GlucoseStatsBlockSchema = z
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

const RecentMealSchema = z
  .object({
    timestamp: z.string(),
    preGlucose: z.number(),
    maxGlucose: z.number(),
    spike: z.number(),
    carbData: z
      .object({
        id: z.number(),
        grams: z.number(),
        foodDescription: z.string().optional(),
        estimatedGi: z.string().optional(),
        timestamp: z.string(),
        createdAt: z.string(),
      })
      .strict()
      .optional(),
  })
  .strict()

const RecentExerciseSchema = z
  .object({
    timestamp: z.string(),
    preGlucose: z.number(),
    minGlucose: z.number(),
    drop: z.number(),
    exerciseData: z
      .object({
        id: z.number(),
        activityType: z.string(),
        durationMinutes: z.number(),
        intensity: z.string().optional(),
        timestamp: z.string(),
        notes: z.string().optional(),
        createdAt: z.string(),
      })
      .strict()
      .optional(),
  })
  .strict()

export const AnalyzeTrendsResponseSchema = z
  .object({
    period: z
      .object({
        start: z.string(),
        end: z.string(),
        days: z.number(),
      })
      .strict(),
    overallStatistics: GlucoseStatsBlockSchema,
    overnightPattern: z
      .object({
        statistics: GlucoseStatsBlockSchema,
        readingCount: z.number(),
        note: z.string(),
      })
      .strict(),
    postMealPatterns: z
      .object({
        mealsAnalyzed: z.number(),
        averageSpike: z.number(),
        recentMeals: z.array(RecentMealSchema),
        note: z.string(),
      })
      .strict(),
    exerciseImpact: z
      .object({
        sessionsAnalyzed: z.number(),
        recentSessions: z.array(RecentExerciseSchema),
        note: z.string(),
      })
      .strict(),
    disclaimer: z.string(),
  })
  .strict()

const ObservationSchema = z
  .object({
    type: z.string(),
    deviation: z.string(),
    hypothesis: z.string(),
    timestamp: z.string(),
  })
  .strict()

export const DetectParameterDriftResponseSchema = z
  .object({
    analysisWindow: z.string(),
    observationCount: z.number(),
    driftDetected: z.boolean(),
    findings: z
      .object({
        isfDrift: z.unknown().nullable(),
        icrDrift: z.unknown().nullable(),
        patterns: z.array(z.unknown()),
      })
      .strict(),
    recentObservations: z.array(ObservationSchema),
    recommendation: z.string(),
    disclaimer: z.string(),
  })
  .strict()

export const GetAdaptiveInsightsResponseSchema = z
  .object({
    analysisWindow: z.string(),
    baselineParameters: z
      .object({
        isf: z.number(),
        icr: z.number(),
        basalDose: z.number(),
        basalTiming: z.string(),
        updatedAt: z.string(),
      })
      .strict(),
    observationsSummary: z.string(),
    detectedDrift: z
      .object({
        isfDrift: z.unknown().nullable(),
        icrDrift: z.unknown().nullable(),
        patterns: z.array(z.unknown()),
      })
      .strict(),
    recentObservations: z.array(ObservationSchema),
    recommendation: z.string(),
    disclaimer: z.string(),
  })
  .strict()

export type AnalyzeTrendsResponse = z.infer<typeof AnalyzeTrendsResponseSchema>
export type DetectParameterDriftResponse = z.infer<typeof DetectParameterDriftResponseSchema>
export type GetAdaptiveInsightsResponse = z.infer<typeof GetAdaptiveInsightsResponseSchema>
