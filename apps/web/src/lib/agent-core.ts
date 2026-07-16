import {
  analyzeTrends,
  type CompareExpectedVsActualArgs,
  callPelotonTool,
  compareExpectedVsActual,
  detectParameterDrift,
  extractJson,
  extractText,
  getAdaptiveInsights,
  getBaselineParameters,
  getGlucoseStatistics,
  PelotonMcpError,
  type PredictGlucoseImpactArgs,
  predictGlucoseImpact,
} from '@t1copilot/mcp-clients'
import type { WorkoutCorrelation } from '@t1copilot/types'
import { tool } from 'ai'
import { z } from 'zod'
import { type EventTimeline, getEventTimeline } from '@/actions/dexcom'
import { isDefaultParameters } from '@/lib/baseline-defaults'
import { getGlucoseRange, getLatestGlucose } from '@/lib/dexcom-mcp'
import { saveInsight } from '@/lib/insight-store'
import { executeStartResearch, StartResearchInputSchema } from '@/lib/research-store'
import { T1_SYSTEM_PROMPT } from '@/lib/system-prompt'

/** Single pinned model id for the agent — route and evals must always agree. */
export const AGENT_MODEL_ID = 'claude-sonnet-4-6'

/** Max agent loop steps — pass to stepCountIs() at the call site. */
export const AGENT_STOP_STEP_COUNT = 5

const SyncWorkoutsInputSchema = z.object({
  limit: z.number().int().min(1).max(200).optional().default(50),
})

const BulkCorrelateInputSchema = z.object({
  limit: z.number().int().min(1).max(50).optional().default(20),
})

function getTemporalContext(): string {
  const now = new Date()
  const localDateTime = now.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  })

  return `\n\nCurrent date/time context: Today is ${localDateTime}. Interpret bare times like "at 10:00 AM" as occurring today unless the user explicitly says another date. Interpret "today" using this date. Never infer dates from examples.`
}

/**
 * Assembles the full system prompt exactly as the chat route does.
 * Pass '' for memorySection when no memory context applies (evals).
 */
export function buildSystemPrompt(memorySection: string): string {
  return T1_SYSTEM_PROMPT + getTemporalContext() + memorySection
}

/**
 * The complete agent tool set. Single source of truth — used by the
 * /api/chat route (streamText) and by the Braintrust eval suite
 * (generateText). Behavior must be identical in both.
 */
export const agentTools = {
  render_glucose_chart: tool({
    description: 'Render a glucose trend chart in the right panel',
    inputSchema: z.object({
      timeRange: z.string().describe('Time range, e.g. "24h" or "7d"'),
      title: z.string().describe('Chart title'),
    }),
    execute: async ({ timeRange, title }) => {
      const now = new Date()
      const msBack = timeRange === '7d' ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
      const start = new Date(now.getTime() - msBack).toISOString()
      try {
        const range = await getGlucoseRange(start, now.toISOString())
        return {
          timeRange,
          title,
          readings: range.readings,
          statistics: range.statistics,
        }
      } catch (error) {
        console.error('[render_glucose_chart] MCP call failed:', error)
        return { timeRange, title, readings: [], statistics: null }
      }
    },
  }),
  render_workout_correlation: tool({
    description: 'Render a workout glucose correlation artifact in the right panel',
    inputSchema: z.object({
      workoutId: z.string().describe('Workout identifier'),
      workoutName: z.string().describe('Workout name, e.g. "45min Cycling"'),
      startTime: z.string().optional().describe('ISO 8601 workout start time'),
      durationMinutes: z.number().optional().describe('Workout duration in minutes'),
    }),
    execute: async ({ workoutId, workoutName, startTime, durationMinutes }) => {
      try {
        const workoutStart = startTime
          ? new Date(startTime)
          : new Date(Date.now() - 2 * 60 * 60 * 1000)
        const windowStart = new Date(workoutStart.getTime() - 60 * 60 * 1000).toISOString()
        const workoutEnd = new Date(workoutStart.getTime() + (durationMinutes ?? 60) * 60 * 1000)
        const windowEnd = new Date(workoutEnd.getTime() + 120 * 60 * 1000).toISOString()

        const glucoseRange = await getGlucoseRange(windowStart, windowEnd)

        const correlationResponse = await callPelotonTool('peloton_analyze_glucose_correlation', {
          workout_id: workoutId,
          glucose_readings: glucoseRange.readings.map((r) => ({
            timestamp: r.timestamp,
            value: r.value,
            trend: r.trend,
          })),
        })
        const correlation = extractJson<WorkoutCorrelation>(correlationResponse)
        return { workoutId, workoutName, correlation }
      } catch (err) {
        if (err instanceof PelotonMcpError) {
          console.error('[render_workout_correlation] Peloton MCP error:', err.message)
        } else {
          console.error('[render_workout_correlation] Error:', err)
        }
        return { workoutId, workoutName }
      }
    },
  }),
  render_weekly_summary: tool({
    description: 'Render a weekly glucose summary artifact in the right panel',
    inputSchema: z.object({
      weekLabel: z.string().describe('Week label, e.g. "May 12–18"'),
    }),
    execute: async ({ weekLabel }) => ({ weekLabel }),
  }),
  render_doctor_checklist: tool({
    description: 'Render an endocrinologist appointment prep checklist in the right panel',
    inputSchema: z.object({
      appointmentDate: z.string().optional().describe('Optional appointment date string'),
    }),
    execute: async ({ appointmentDate }) => ({ appointmentDate }),
  }),
  confirm_log_event: tool({
    description:
      'Show a HITL confirmation card for logging a medical event. User must explicitly confirm before anything is logged.',
    inputSchema: z.object({
      eventType: z.enum(['insulin', 'carbs', 'exercise']),
      value: z.number().describe('Numeric value (units, grams, or minutes)'),
      unit: z.string().describe('Unit string, e.g. "units", "g", "min"'),
      subtype: z
        .string()
        .optional()
        .describe('For insulin: insulin type (rapid, long_acting, or correction)'),
      food_description: z
        .string()
        .optional()
        .describe('For carbs: food description if mentioned by the user'),
      timestamp: z
        .string()
        .optional()
        .describe('ISO 8601 timestamp when the event occurred — omit for now'),
      duration_minutes: z
        .number()
        .optional()
        .describe('For exercise: duration in minutes if mentioned by the user'),
      notes: z.string().optional().describe('Optional notes'),
    }),
    execute: async (args) => ({ ...args, status: 'pending_confirmation' }),
  }),
  render_markdown_doc: tool({
    description: 'Generate a formatted markdown document — summaries, reports, analysis',
    inputSchema: z.object({
      title: z.string().describe('Document title'),
      content: z.string().describe('Full markdown content to render'),
    }),
    execute: async ({ title, content }) => ({ title, content }),
  }),
  render_html_report: tool({
    description: 'Generate an HTML report with rich formatting and layout',
    inputSchema: z.object({
      title: z.string().describe('Report title'),
      html: z.string().describe('Complete HTML document string'),
    }),
    execute: async ({ title, html }) => ({ title, html }),
  }),
  render_prediction: tool({
    description:
      'Predict glucose impact of insulin and/or carbs. MANDATORY for any request about predicted or expected glucose impact — including when baseline parameters may be unconfigured; this tool checks them itself and returns requiresSetup if they are still defaults. Shows prediction artifact only — never recommend doses.',
    inputSchema: z.object({
      action_type: z.enum(['insulin', 'carbs', 'both']),
      insulin_units: z.number().optional(),
      carb_grams: z.number().optional(),
      current_glucose: z.number().optional(),
    }),
    execute: async (args) => {
      try {
        const baseline = await getBaselineParameters()
        if (isDefaultParameters(baseline)) {
          return { requiresSetup: true }
        }

        let currentGlucose = args.current_glucose
        if (currentGlucose === undefined) {
          const latest = await getLatestGlucose()
          currentGlucose = latest.value
        }
        const predictArgs: PredictGlucoseImpactArgs = {
          action_type: args.action_type,
          current_glucose: currentGlucose,
        }
        if (args.insulin_units !== undefined) predictArgs.insulin_units = args.insulin_units
        if (args.carb_grams !== undefined) predictArgs.carb_grams = args.carb_grams
        const predictionResult = await predictGlucoseImpact(predictArgs)
        return {
          predictionResult,
          actionType: args.action_type,
          disclaimer: predictionResult.disclaimer,
        }
      } catch (error) {
        console.error('[render_prediction] MCP call failed:', error)
        return {
          error: error instanceof Error ? error.message : 'Prediction failed',
        }
      }
    },
  }),
  render_baseline_parameters: tool({
    description:
      'Show baseline ISF, ICR, basal dose, and timing in the right panel. Not for prediction requests — for glucose-impact questions call render_prediction instead, even if parameters may be unconfigured.',
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const parameters = await getBaselineParameters()
        return { parameters }
      } catch (error) {
        console.error('[render_baseline_parameters] MCP call failed:', error)
        return {
          error: error instanceof Error ? error.message : 'Failed to load baseline parameters',
        }
      }
    },
  }),
  render_glucose_stats: tool({
    description: 'Fetch glucose statistics for a time window — summarize in text',
    inputSchema: z.object({
      hours: z.number().optional().describe('Hours to analyze — default 24, use 168 for weekly'),
    }),
    execute: async (args) => {
      try {
        const result = await getGlucoseStatistics(
          args.hours !== undefined ? { hours: args.hours } : undefined,
        )
        return result
      } catch (error) {
        console.error('[render_glucose_stats] MCP call failed:', error)
        return {
          error: error instanceof Error ? error.message : 'Failed to load glucose statistics',
        }
      }
    },
  }),
  compare_prediction_vs_actual: tool({
    description: 'Compare expected vs actual glucose response for a past insulin or carb event',
    inputSchema: z.object({
      event_type: z.enum(['insulin', 'carbs']),
      event_timestamp: z.string().describe('ISO 8601 event timestamp'),
      event_value: z.number(),
      current_glucose: z.number(),
      window_hours: z.number().optional(),
    }),
    execute: async (args) => {
      try {
        const compareArgs: CompareExpectedVsActualArgs = {
          event_type: args.event_type,
          event_timestamp: args.event_timestamp,
          event_value: args.event_value,
          current_glucose: args.current_glucose,
        }
        if (args.window_hours !== undefined) compareArgs.window_hours = args.window_hours
        return await compareExpectedVsActual(compareArgs)
      } catch (error) {
        console.error('[compare_prediction_vs_actual] MCP call failed:', error)
        return {
          error: error instanceof Error ? error.message : 'Comparison failed',
        }
      }
    },
  }),
  get_event_timeline: tool({
    description:
      'Fetch logged insulin, carb, and exercise events (with glucose context) for a recent ' +
      "window. Use this to look up the user's own past events — e.g. their last insulin dose — " +
      'instead of asking them for details that are already logged.',
    inputSchema: z.object({
      days: z.number().optional().describe('Days to search — default 7'),
    }),
    execute: async ({ days }) => {
      try {
        const now = new Date()
        const start = new Date(now.getTime() - (days ?? 7) * 24 * 60 * 60 * 1000)
        const timeline = await getEventTimeline(start.toISOString(), now.toISOString())
        return timeline ?? { timeline: [] }
      } catch (error) {
        console.error('[get_event_timeline] MCP call failed:', error)
        return {
          error: error instanceof Error ? error.message : 'Failed to load event timeline',
        }
      }
    },
  }),
  sync_peloton_workouts: tool({
    description:
      'Force-sync the latest workouts from the Peloton API into the local database. ' +
      'Run this when the user wants to refresh their workout data before correlation analysis. ' +
      'Returns how many workouts were synced and the total count now in the database.',
    inputSchema: SyncWorkoutsInputSchema,
    execute: async ({ limit }) => {
      try {
        const result = await callPelotonTool('peloton_sync_workouts', { limit })
        return { success: true, message: extractText(result) }
      } catch (err) {
        return {
          success: false,
          message: `Sync failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        }
      }
    },
  }),
  bulk_correlate_workouts: tool({
    description:
      'Backfill glucose correlation records for recent Peloton workouts. ' +
      'For each workout, fetches the matching Dexcom glucose window and calls ' +
      'peloton_analyze_glucose_correlation to write the correlation record. ' +
      'Call this when discipline insights or hypoglycemia risk scan show no data. ' +
      'Returns a summary of how many workouts were processed, skipped (no CGM data), and failed.',
    inputSchema: BulkCorrelateInputSchema,
    execute: async ({ limit }) => {
      try {
        await callPelotonTool('peloton_sync_workouts', { limit })

        const workoutsRaw = await callPelotonTool('peloton_get_workouts', {
          limit,
          json_response: true,
        })
        const workouts = extractJson<Array<{ id: string; start_time: number }>>(workoutsRaw)

        let processed = 0
        let skipped = 0
        let failed = 0

        // Sequential — avoid hammering both MCP servers and partial-write noise in the correlation DB.
        for (const workout of workouts) {
          try {
            const workoutMs = workout.start_time * 1000
            const windowStart = new Date(workoutMs - 4 * 60 * 60 * 1000).toISOString()
            const windowEnd = new Date(workoutMs + 4 * 60 * 60 * 1000).toISOString()

            const glucoseRange = await getGlucoseRange(windowStart, windowEnd)
            if (glucoseRange.readings.length === 0) {
              skipped++
              continue
            }

            await callPelotonTool('peloton_analyze_glucose_correlation', {
              workout_id: workout.id,
              glucose_readings: glucoseRange.readings.map((r) => ({
                timestamp: r.timestamp,
                value: r.value,
                trend: r.trend,
              })),
            })
            processed++
          } catch {
            failed++
          }
        }

        return {
          success: failed === 0,
          message:
            (failed === 0
              ? `Correlation backfill complete. `
              : `Correlation backfill completed with failures. `) +
            `Processed: ${processed}, Skipped (no CGM data): ${skipped}, Failed: ${failed}. ` +
            (failed === 0
              ? `Discipline insights and hypoglycemia risk scan now have data.`
              : `Some correlation data may be unavailable.`),
        }
      } catch (err) {
        return {
          success: false,
          message: `Bulk correlation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        }
      }
    },
  }),
  render_insight_summary: tool({
    description:
      'Synthesize a weekly insight summary — trends, drift, adaptive insights, exercise patterns',
    inputSchema: z.object({
      days: z.number().optional().describe('Days to analyze — default 7'),
      weekLabel: z.string().optional().describe('Week label e.g. "Jun 1–7"'),
    }),
    execute: async ({ days, weekLabel }) => {
      const label =
        weekLabel ??
        (() => {
          const now = new Date()
          const start = new Date(now.getTime() - (days ?? 7) * 24 * 60 * 60 * 1000)
          return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        })()

      // Sequential — parallel MCP connections race and cross-wire responses on the Dexcom server.
      let trendsResult: PromiseSettledResult<Awaited<ReturnType<typeof analyzeTrends>>>
      try {
        trendsResult = { status: 'fulfilled', value: await analyzeTrends({ days: days ?? 7 }) }
      } catch (reason) {
        console.error('[render_insight_summary] analyze_trends failed:', reason)
        trendsResult = { status: 'rejected', reason }
      }

      let driftResult: PromiseSettledResult<Awaited<ReturnType<typeof detectParameterDrift>>>
      try {
        driftResult = {
          status: 'fulfilled',
          value: await detectParameterDrift({ days: (days ?? 7) * 2 }),
        }
      } catch (reason) {
        console.error('[render_insight_summary] detect_parameter_drift failed:', reason)
        driftResult = { status: 'rejected', reason }
      }

      let adaptiveResult: PromiseSettledResult<Awaited<ReturnType<typeof getAdaptiveInsights>>>
      try {
        adaptiveResult = {
          status: 'fulfilled',
          value: await getAdaptiveInsights({ days: (days ?? 7) * 2 }),
        }
      } catch (reason) {
        console.error('[render_insight_summary] get_adaptive_insights failed:', reason)
        adaptiveResult = { status: 'rejected', reason }
      }

      let disciplineInsights: string | undefined
      let hypoRisk: string | undefined
      try {
        const discRes = await callPelotonTool('peloton_get_discipline_insights', {
          json_response: false,
        })
        disciplineInsights = extractText(discRes)
      } catch (err) {
        if (err instanceof PelotonMcpError) {
          console.error('[render_insight_summary] discipline insights error:', err.message)
        }
      }
      try {
        const hypoRes = await callPelotonTool('peloton_detect_hypoglycemia_risk', {})
        hypoRisk = extractText(hypoRes)
      } catch (err) {
        if (err instanceof PelotonMcpError) {
          console.error('[render_insight_summary] hypo risk error:', err.message)
        }
      }

      let eventTimeline: EventTimeline | null = null
      try {
        const now = new Date()
        const start = new Date(now.getTime() - (days ?? 7) * 24 * 60 * 60 * 1000)
        eventTimeline = await getEventTimeline(start.toISOString(), now.toISOString())
      } catch (err) {
        console.error('[render_insight_summary] get_event_timeline failed:', err)
      }

      const result = {
        weekLabel: label,
        ...(trendsResult.status === 'fulfilled' ? { trends: trendsResult.value } : {}),
        ...(driftResult.status === 'fulfilled' ? { drift: driftResult.value } : {}),
        ...(adaptiveResult.status === 'fulfilled'
          ? { adaptiveInsights: adaptiveResult.value }
          : {}),
        ...(disciplineInsights !== undefined ? { disciplineInsights } : {}),
        ...(hypoRisk !== undefined ? { hypoRisk } : {}),
        ...(eventTimeline !== null ? { eventTimeline } : {}),
      }

      // Persist to Neon agent_insights + embed the summary — fire-and-forget.
      // A write failure must never propagate into the streaming response.
      const summaryParts: string[] = [`Insight summary for ${label}.`]
      if (trendsResult.status === 'fulfilled') {
        const tir = trendsResult.value.overallStatistics.timeInRange
        const avg = trendsResult.value.overallStatistics.average
        summaryParts.push(`Time in range: ${String(tir)}%. Average glucose: ${String(avg)} mg/dL.`)
      }
      if (driftResult.status === 'fulfilled' && driftResult.value.driftDetected) {
        summaryParts.push(`Parameter drift detected. ${driftResult.value.recommendation}`)
      }
      if (hypoRisk !== undefined) {
        summaryParts.push(`Hypo risk: ${hypoRisk}`)
      }
      const summaryText = summaryParts.join(' ')

      void saveInsight({
        summary: summaryText,
        detail: result as Record<string, unknown>,
        agentId: 'insight',
        insightType: 'weekly_summary',
        confidence: trendsResult.status === 'fulfilled' ? 0.8 : 0.5,
      }).catch((err: unknown) => {
        console.error('[render_insight_summary] saveInsight failed:', err)
      })

      return result
    },
  }),
  start_research: tool({
    description:
      'Start a background deep-research job on a medical or nutritional literature question. ' +
      "Use for current evidence and research — not for the user's own logged Dexcom/Peloton data.",
    inputSchema: StartResearchInputSchema,
    execute: async ({ query }) => executeStartResearch(query),
  }),
}
