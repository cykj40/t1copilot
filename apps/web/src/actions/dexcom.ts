'use server'

import { callDexcomTool } from '@t1copilot/mcp-clients'
import { unstable_noStore as noStore } from 'next/cache'
import { z } from 'zod'

const GlucoseContextSchema = z
  .object({
    value: z.number(),
    trend: z.string(),
  })
  .nullable()

const TimelineEventSchema = z.object({
  timestamp: z.string(),
  type: z.enum(['insulin', 'carbs', 'exercise']),
  data: z.record(z.unknown()),
  glucoseContext: GlucoseContextSchema,
})

const SummaryNumberSchema = z.preprocess((value) => {
  if (typeof value === 'number') return Number.isNaN(value) ? 0 : value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  return 0
}, z.number())

const EventTimelineSchema = z.object({
  period: z
    .object({
      start: z.string(),
      end: z.string(),
    })
    .optional(),
  summary: z
    .object({
      totalEvents: SummaryNumberSchema,
      totalInsulin: SummaryNumberSchema,
      totalCarbs: SummaryNumberSchema,
      exerciseSessions: SummaryNumberSchema,
    })
    .optional(),
  timeline: z.array(TimelineEventSchema),
})

export type EventTimeline = z.infer<typeof EventTimelineSchema>
export type TimelineEvent = z.infer<typeof TimelineEventSchema>

export async function getEventTimeline(
  startTime: string,
  endTime: string,
): Promise<EventTimeline | null> {
  noStore()
  try {
    const raw = await callDexcomTool('get_event_timeline', {
      start_time: startTime,
      end_time: endTime,
    })
    return EventTimelineSchema.parse(raw)
  } catch (error) {
    console.error('[getEventTimeline] error:', error)
    return null
  }
}
