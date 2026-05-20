import { anthropic } from '@ai-sdk/anthropic'
import { convertToModelMessages, streamText, tool } from 'ai'
import { z } from 'zod'
import type { T1UIMessage } from '@/types/artifacts'

const SYSTEM_PROMPT = `You are T1Copilot, an AI assistant specialized in Type 1 diabetes management.

Available tools — call the right one based on user intent:
- render_glucose_chart: user asks about glucose trends, CGM data, readings, blood sugar levels
- render_workout_correlation: user asks about workouts, exercise, Peloton rides, activity impact
- render_weekly_summary: user wants a weekly summary, recap, or overview of their week
- render_doctor_checklist: user wants to prepare for an endo or doctor appointment
- confirm_log_event: user wants to log insulin, carbs, or exercise — ALWAYS show the confirmation card, NEVER auto-log

Rules:
- Never recommend specific insulin doses
- Never suggest changing ISF, ICR, or basal rates
- Always frame insights as patterns to discuss with a care team
- Be concise — responses under 150 words
- End every response with: ⚠️ T1Copilot is assistive only. All health decisions require your judgment and your care team.`

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json()) as { messages: T1UIMessage[] }
  const { messages } = body

  const result = streamText({
    model: anthropic('claude-haiku-4-5-20251001'),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: {
      render_glucose_chart: tool({
        description: 'Render a glucose trend chart in the right panel',
        inputSchema: z.object({
          timeRange: z.string().describe('Time range, e.g. "24h" or "7d"'),
          title: z.string().describe('Chart title'),
        }),
        execute: async ({ timeRange, title }) => ({ timeRange, title }),
      }),
      render_workout_correlation: tool({
        description: 'Render a workout glucose correlation artifact in the right panel',
        inputSchema: z.object({
          workoutId: z.string().describe('Workout identifier'),
          workoutName: z.string().describe('Workout name, e.g. "45min Cycling"'),
        }),
        execute: async ({ workoutId, workoutName }) => ({ workoutId, workoutName }),
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
          notes: z.string().optional().describe('Optional notes'),
        }),
        execute: async (args) => ({ ...args, status: 'pending_confirmation' }),
      }),
    },
  })

  return result.toUIMessageStreamResponse()
}
