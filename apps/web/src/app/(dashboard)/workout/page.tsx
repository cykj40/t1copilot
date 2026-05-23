import type { DisciplineInsight, HypoRisk } from '@t1copilot/types'
import { getDisciplineInsights, getWorkouts, type PelotonServerWorkout } from '@/actions/peloton'
import {
  WorkoutCorrelationCard,
  type WorkoutCorrelationCardProps,
} from '@/components/data/WorkoutCorrelationCard'
import { Card, CardContent } from '@/components/ui/card'

const RISK_PRIORITY: Record<HypoRisk, number> = { none: 0, low: 1, moderate: 2, high: 3 }

function mapWorkoutToCard(workout: PelotonServerWorkout): WorkoutCorrelationCardProps {
  return {
    id: workout.id,
    title: workout.title,
    discipline: workout.fitness_discipline,
    startTime: new Date(workout.start_time * 1000).toISOString(),
    durationSeconds: workout.duration_seconds,
    outputWatts: workout.output_watts ?? null,
    glucoseDelta: null,
    dropRate: null,
    hypoRisk: 'none',
    glucosePreWorkout: null,
    glucoseDuringWorkout: null,
    glucosePostWorkout: null,
    notes: null,
  }
}

function HypoRiskAlert({ workouts }: { workouts: WorkoutCorrelationCardProps[] }) {
  const top = workouts.reduce((a, b) =>
    RISK_PRIORITY[a.hypoRisk] >= RISK_PRIORITY[b.hypoRisk] ? a : b,
  )
  const hoursAgo = Math.max(
    0,
    Math.floor((Date.now() - new Date(top.startTime).getTime()) / (60 * 60 * 1000)),
  )

  return (
    <Card className="border-[#ef4444]/25 bg-[#ef4444]/5">
      <CardContent className="pt-3 pb-3 px-4">
        <p className="text-xs font-medium text-[#ef4444] mb-0.5">
          {top.hypoRisk === 'high' ? 'High' : 'Moderate'} hypo risk detected
        </p>
        <p className="text-xs text-muted-foreground">
          <span className="text-foreground font-medium">{top.discipline}</span> workout{' '}
          {String(hoursAgo)}h ago — post-workout glucose{' '}
          {top.glucosePostWorkout !== null ? (
            <span className="text-foreground font-medium tabular-nums">
              {String(top.glucosePostWorkout)} mg/dL
            </span>
          ) : (
            'data unavailable'
          )}
          . Ask the agent for a full correlation analysis.
        </p>
        <p className="mt-1.5 text-[10px] text-muted-foreground/60">
          T1Copilot provides analysis only. All treatment decisions are yours.
        </p>
      </CardContent>
    </Card>
  )
}

function DisciplineInsightsSection({ insights }: { insights: DisciplineInsight[] }) {
  if (insights.length === 0) return null
  return (
    <div>
      <h2 className="text-xs font-semibold text-foreground mb-2">Discipline breakdown</h2>
      <div className="grid grid-cols-2 gap-2">
        {insights.map((insight) => (
          <Card key={insight.discipline} className="bg-card border-border">
            <CardContent className="pt-3 pb-3 px-3">
              <p className="text-xs font-medium text-foreground">{insight.discipline}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {String(insight.workoutCount)} workouts
              </p>
              <p className="text-lg font-bold text-foreground tabular-nums mt-1">
                -{String(Math.abs(insight.avgGlucoseDrop))}
                <span className="text-[10px] font-normal text-muted-foreground ml-1">
                  mg/dL avg
                </span>
              </p>
              <p className="text-[10px] text-muted-foreground capitalize">
                {insight.avgHypoRisk} risk
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <Card className="border-border bg-card">
      <CardContent className="pt-6 pb-6 px-4 text-center">
        <p className="text-sm text-muted-foreground">No workout data available.</p>
        <p className="text-xs text-muted-foreground mt-1">
          Peloton data may be unavailable. Check your connection.
        </p>
      </CardContent>
    </Card>
  )
}

export default async function WorkoutPage() {
  const [rawWorkouts, insights] = await Promise.all([getWorkouts(), getDisciplineInsights()])
  const workouts = rawWorkouts.map(mapWorkoutToCard)

  const alertWorkouts = workouts.filter((w) => w.hypoRisk === 'high' || w.hypoRisk === 'moderate')

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h1 className="text-sm font-semibold text-foreground">Workouts</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Glucose correlation by session.</p>
      </div>

      {alertWorkouts.length > 0 && <HypoRiskAlert workouts={alertWorkouts} />}

      {workouts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-2">
          {workouts.map((workout) => (
            <WorkoutCorrelationCard key={workout.id} {...workout} />
          ))}
        </div>
      )}

      <DisciplineInsightsSection insights={insights} />
    </div>
  )
}
