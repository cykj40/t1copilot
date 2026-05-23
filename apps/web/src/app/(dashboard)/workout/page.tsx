import type { DisciplineInsight, HypoRisk, WorkoutCorrelation } from '@t1copilot/types'
import { getDisciplineInsights, getWorkouts } from '@/actions/peloton'
import { WorkoutCorrelationCard } from '@/components/data/WorkoutCorrelationCard'
import { Card, CardContent } from '@/components/ui/card'

const RISK_PRIORITY: Record<HypoRisk, number> = { none: 0, low: 1, moderate: 2, high: 3 }

function HypoRiskAlert({ workouts }: { workouts: WorkoutCorrelation[] }) {
  const top = workouts.reduce((a, b) =>
    (RISK_PRIORITY[a.hypoRisk] ?? 0) >= (RISK_PRIORITY[b.hypoRisk] ?? 0) ? a : b,
  )
  return (
    <Card className="border-[#ef4444]/25 bg-[#ef4444]/5">
      <CardContent className="pt-3 pb-3 px-4">
        <p className="text-xs font-medium text-[#ef4444] mb-0.5">
          {top.hypoRisk === 'high' ? 'High' : 'Moderate'} hypo risk detected
        </p>
        <p className="text-xs text-muted-foreground">
          <span className="text-foreground font-medium">{top.discipline}</span> workout{' '}
          {String(top.hoursAgo)}h ago — post-workout glucose{' '}
          {top.postWorkoutGlucose !== undefined ? (
            <span className="text-foreground font-medium tabular-nums">
              {String(top.postWorkoutGlucose)} mg/dL
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
  const [workouts, insights] = await Promise.all([getWorkouts(), getDisciplineInsights()])

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
      )}

      <DisciplineInsightsSection insights={insights} />
    </div>
  )
}
