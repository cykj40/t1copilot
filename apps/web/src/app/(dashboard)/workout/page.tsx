import { WorkoutCorrelationCard } from '@/components/data/WorkoutCorrelationCard'
import { Card, CardContent } from '@/components/ui/card'
import { PLACEHOLDER_LAST_WORKOUT } from '@/lib/placeholder'

const MOCK_WORKOUTS = [
  {
    id: 'w1',
    discipline: 'Cycling',
    durationMinutes: 45,
    hoursAgo: 2,
    glucoseDropMgdl: 28,
    hypoRisk: 'moderate' as const,
  },
  {
    id: 'w2',
    discipline: 'Running',
    durationMinutes: 30,
    hoursAgo: 26,
    glucoseDropMgdl: 18,
    hypoRisk: 'low' as const,
  },
  {
    id: 'w3',
    discipline: 'Strength',
    durationMinutes: 60,
    hoursAgo: 50,
    glucoseDropMgdl: 12,
    hypoRisk: 'low' as const,
  },
]

export default function WorkoutPage() {
  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h1 className="text-sm font-semibold text-foreground">Workouts</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Glucose correlation by session.</p>
      </div>

      {/* Pattern callout */}
      <Card className="border-[#f59e0b]/25 bg-[#f59e0b]/5">
        <CardContent className="pt-3 pb-3 px-4">
          <p className="text-xs font-medium text-[#f59e0b] mb-0.5">Pattern detected</p>
          <p className="text-xs text-muted-foreground">
            Post-{PLACEHOLDER_LAST_WORKOUT.name.toLowerCase()} lows averaging{' '}
            <span className="text-foreground font-medium tabular-nums">
              -{String(PLACEHOLDER_LAST_WORKOUT.glucoseDropMgdl)} mg/dL
            </span>{' '}
            in the 2–4h window. Ask the agent for a full correlation analysis.
          </p>
        </CardContent>
      </Card>

      {/* Workout list */}
      <div className="flex flex-col gap-2">
        {MOCK_WORKOUTS.map((workout) => (
          <WorkoutCorrelationCard
            key={workout.id}
            discipline={workout.discipline}
            durationMinutes={workout.durationMinutes}
            hoursAgo={workout.hoursAgo}
            glucoseDropMgdl={workout.glucoseDropMgdl}
            hypoRisk={workout.hypoRisk}
          />
        ))}
      </div>
    </div>
  )
}
