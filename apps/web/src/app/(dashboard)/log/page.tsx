import { EventLoggerForm } from '@/components/data/EventLoggerForm'
import { Card, CardContent } from '@/components/ui/card'

const RECENT_LOGS = [
  { id: 'l1', icon: '💉', label: 'Insulin', value: '3u rapid', minutesAgo: 45 },
  { id: 'l2', icon: '🍞', label: 'Carbs', value: '32g', minutesAgo: 60 },
  { id: 'l3', icon: '💉', label: 'Insulin', value: '1u correction', minutesAgo: 180 },
]

export default function LogPage() {
  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h1 className="text-sm font-semibold text-foreground">Log Event</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          All events require explicit confirmation before logging.
        </p>
      </div>

      <EventLoggerForm />

      {/* Recent logs */}
      <Card className="bg-card border-border">
        <CardContent className="pt-4 pb-3 px-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Recent logs</p>
          <ul className="flex flex-col gap-2">
            {RECENT_LOGS.map((log) => (
              <li key={log.id} className="flex items-center gap-2">
                <span className="text-sm">{log.icon}</span>
                <span className="text-xs text-foreground">{log.label}</span>
                <span className="text-xs font-medium text-foreground tabular-nums">
                  {log.value}
                </span>
                <span className="ml-auto text-[10px] text-muted-foreground/60">
                  {String(log.minutesAgo)}m ago
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
