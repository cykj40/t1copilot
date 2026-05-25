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

const EventTimelineSchema = z.object({
  period: z
    .object({
      start: z.string(),
      end: z.string(),
    })
    .optional(),
  summary: z
    .object({
      totalEvents: z.coerce.number(),
      totalInsulin: z.coerce.number(),
      totalCarbs: z.coerce.number(),
      exerciseSessions: z.coerce.number(),
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
