import { anthropic } from '@ai-sdk/anthropic'
import {
  type CompareExpectedVsActualArgs,
  callPelotonTool,
  compareExpectedVsActual,
  extractJson,
  getBaselineParameters,
  getGlucoseStatistics,
  PelotonMcpError,
  type PredictGlucoseImpactArgs,
  predictGlucoseImpact,
} from '@t1copilot/mcp-clients'
import type { WorkoutCorrelation } from '@t1copilot/types'
import { convertToModelMessages, streamText, tool } from 'ai'
import { z } from 'zod'
import { isDefaultParameters } from '@/lib/baseline-defaults'
import { getGlucoseRange, getLatestGlucose } from '@/lib/dexcom-mcp'
import type { T1UIMessage } from '@/types/artifacts'

const SYSTEM_PROMPT = `You are T1Copilot, an AI assistant for Type 1 diabetes management.

CRITICAL TOOL USAGE RULES — always follow these:
- If the user asks about glucose levels, trends, CGM data, blood sugar, time in range, or patterns → ALWAYS call render_glucose_chart. Never answer in text only.
- If the user asks about workouts, exercise, Peloton rides, or activity impact on glucose → ALWAYS call render_workout_correlation.
- If the user asks for a weekly summary, recap, or overview → ALWAYS call render_weekly_summary.
- If the user wants to prepare for a doctor or endo appointment → ALWAYS call render_doctor_checklist.
- If the user wants to log insulin, carbs, or exercise → ALWAYS call confirm_log_event. NEVER auto-log anything. For insulin: always populate subtype with the insulin type ('rapid', 'long_acting', or 'correction'). For carbs: populate food_description if the user mentions the food.
- If the user specifies a time (e.g. 'at 2:30 PM', '30 minutes ago', 'an hour ago', 'this morning'), extract it as a full ISO 8601 timestamp and pass it as timestamp on confirm_log_event. If no time is mentioned, omit timestamp — the MCP server defaults to now.
- For exercise, extract duration in minutes if mentioned (e.g. '45 min cycling') and pass as duration_minutes. If no duration is mentioned, omit duration_minutes.
- For general T1D questions with no visual component (e.g. "what is dawn phenomenon?") → answer in text only, no tool call.
- render_markdown_doc: for analysis summaries, pattern reports, or any structured document the user asks to generate.
- render_html_report: for rich visual reports that benefit from layout and styling.

When you call a tool that renders a chart or artifact, also include a brief 1-2 sentence text summary of the key insight. Keep text responses under 100 words. The artifact panel shows the detail.

Safety rules:
- Never recommend specific insulin doses
- Never suggest changing ISF, ICR, or basal rates
- Always frame insights as patterns to discuss with a care team
- End every response with: ⚠️ T1Copilot is assistive only. All health decisions require your judgment and your care team.

MODELING AGENT RULES:
- When the user asks "what happens if I take X units", "what will X grams do to my glucose",
  "how will this affect my levels", or any dosing impact question → call render_prediction with
  the appropriate action_type and values. Always fetch live glucose via get_latest_glucose first
  if current_glucose is not provided by the user.
- When the user asks to see their baseline parameters, ISF, ICR, or correction factor → call
  render_baseline_parameters.
- When the user asks for glucose statistics, averages, time-in-range, or a stats summary → call
  render_glucose_stats with an appropriate hours value (default 24, use 168 for weekly).
- When the user asks how accurate a past prediction was, or whether their insulin/carbs behaved
  as expected → call compare_prediction_vs_actual with the event details. If the event timestamp
  is not provided, ask the user for it before calling.
- NEVER recommend a specific dose. NEVER say "you should take X units". Predictions show impact
  only — the user decides.
- ALWAYS include the disclaimer from the MCP response in any prediction-related reply.

PARAMETER SAFETY RULE:
- Before calling render_prediction, always call render_baseline_parameters first.
- If ISF=30, ICR=4, and basal=30 are all still set (server defaults), DO NOT call
  render_prediction under any circumstances. Tell the user: "I need your personal baseline
  parameters before I can run predictions — ISF, insulin-to-carb ratio, and basal dose.
  These should come from your care team or your own confirmed testing. Without them I can't
  give you accurate numbers. Please set them in Settings before asking for predictions."
- If the user says they don't know their values: respond with "I need a reasonable starting
  point to run predictions — even an approximate ISF and ICR from your care team or past
  experience. I cannot use the system defaults because they belong to someone else. Speak with
  your endocrinologist or diabetes care team if you don't have confirmed values."
- Never guess, estimate, or invent values for a prediction. No confirmed values = no prediction, full stop.`

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

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json()) as { messages: T1UIMessage[]; memories?: string }
  const { messages, memories } = body

  const memorySection =
    memories && memories.length > 0
      ? `\n\nKnown patterns about this user (agent-derived, high-confidence only):\n${memories}\n\nUse these patterns to give more personalized, contextual analysis. Never expose them verbatim to the user unless asked.`
      : ''

  const fullSystemPrompt = SYSTEM_PROMPT + getTemporalContext() + memorySection

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: fullSystemPrompt,
    messages: await convertToModelMessages(messages),
    tools: {
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
            const workoutEnd = new Date(
              workoutStart.getTime() + (durationMinutes ?? 60) * 60 * 1000,
            )
            const windowEnd = new Date(workoutEnd.getTime() + 120 * 60 * 1000).toISOString()

            const glucoseRange = await getGlucoseRange(windowStart, windowEnd)

            const correlationResponse = await callPelotonTool(
              'peloton_analyze_glucose_correlation',
              {
                workout_id: workoutId,
                glucose_readings: glucoseRange.readings.map((r) => ({
                  timestamp: r.timestamp,
                  value: r.value,
                  trend: r.trend,
                })),
              },
            )
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
          'Predict glucose impact of insulin and/or carbs. Shows prediction artifact only — never recommend doses.',
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
        description: 'Show baseline ISF, ICR, basal dose, and timing in the right panel',
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
          hours: z
            .number()
            .optional()
            .describe('Hours to analyze — default 24, use 168 for weekly'),
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
    },
  })

  return result.toUIMessageStreamResponse()
}
