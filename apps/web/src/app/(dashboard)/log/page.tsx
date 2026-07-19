import { getEventTimeline } from '@/actions/dexcom'
import { EventLoggerForm } from '@/components/data/EventLoggerForm'
import { Card, CardContent } from '@/components/ui/card'

const EVENT_ICONS: Record<string, string> = {
  insulin: '💉',
  carbs: '🍞',
  exercise: '🏃',
}

function describeEvent(type: string, data: Record<string, unknown>): string {
  if (type === 'insulin') {
    return `${String(data.units ?? '')}u ${String(data.type ?? 'rapid')} insulin`
  }
  if (type === 'carbs') {
    const food = data.foodDescription ? ` — ${String(data.foodDescription)}` : ''
    return `${String(data.grams ?? '')}g carbs${food}`
  }
  if (type === 'exercise') {
    return `${String(data.durationMinutes ?? '')}min ${String(data.activityType ?? 'exercise')}`
  }
  return type
}

export default async function LogPage() {
  const now = new Date()
  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const timeline = await getEventTimeline(start.toISOString(), now.toISOString())

  const events = timeline?.timeline ?? []

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h1 className="text-sm font-semibold text-foreground">Log Event</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          All events require explicit confirmation before logging.
        </p>
      </div>

      <EventLoggerForm />

      <Card className="bg-card border-border">
        <CardContent className="pt-4 pb-3 px-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Recent logs — last 7 days
          </p>
          {events.length === 0 ? (
            <p className="text-xs text-muted-foreground/60">No events in the last 7 days</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {events.map((event, i) => {
                const minutesAgo = Math.round(
                  (now.getTime() - new Date(event.timestamp).getTime()) / 60000,
                )
                return (
                  <li key={`${event.timestamp}-${String(i)}`} className="flex items-center gap-2">
                    <span className="text-sm">{EVENT_ICONS[event.type] ?? '📝'}</span>
                    <span className="text-xs text-foreground capitalize">{event.type}</span>
                    <span className="text-xs font-medium text-foreground tabular-nums">
                      {describeEvent(event.type, event.data)}
                    </span>
                    <span className="ml-auto text-[10px] text-muted-foreground/60">
                      {String(minutesAgo)}m ago
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
