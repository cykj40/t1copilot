import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { PLACEHOLDER_LAST_WORKOUT } from '@/lib/placeholder'
import type { RenderWorkoutCorrelationArtifact } from '@/types/artifacts'

interface WorkoutCorrelationArtifactProps {
  artifact: RenderWorkoutCorrelationArtifact
}

const PHASE_DATA = [
  { label: 'Pre-workout', value: 148, color: '#22c55e', note: '2h before' },
  { label: 'During', value: 132, color: '#f59e0b', note: 'at 22 min' },
  { label: '1h Post', value: 118, color: '#f59e0b', note: 'rising slowly' },
  { label: '3h Post', value: 96, color: '#22c55e', note: 'back in range' },
]

export function WorkoutCorrelationArtifact({ artifact }: WorkoutCorrelationArtifactProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[#a3a3a3]">{artifact.workoutName}</p>
        <Badge
          variant="outline"
          className="border-[#f59e0b]/40 bg-[#f59e0b]/10 text-[#f59e0b] text-[10px]"
        >
          MODERATE RISK
        </Badge>
      </div>

      {/* Glucose by phase */}
      <Card className="bg-[#111113] border-[#232326]">
        <CardHeader className="pb-2 pt-3 px-4">
          <p className="text-xs text-[#a3a3a3]">Glucose by phase</p>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="grid grid-cols-4 gap-1">
            {PHASE_DATA.map((phase) => (
              <div key={phase.label} className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-[#a3a3a3] text-center leading-tight">
                  {phase.label}
                </span>
                <span className="text-lg font-bold tabular-nums" style={{ color: phase.color }}>
                  {String(phase.value)}
                </span>
                <span className="text-[9px] text-[#6b6b6b]">{phase.note}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Drop summary */}
      <Card className="bg-[#111113] border-[#232326]">
        <CardContent className="pt-4 pb-3 px-4">
          <p className="text-xs text-[#a3a3a3] mb-1">Last {PLACEHOLDER_LAST_WORKOUT.name}</p>
          <p className="text-sm font-medium text-[#e5e5e5]">
            {String(PLACEHOLDER_LAST_WORKOUT.durationMinutes)}min session
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-2xl font-bold text-[#f59e0b] tabular-nums">
              -{String(PLACEHOLDER_LAST_WORKOUT.glucoseDropMgdl)}
            </span>
            <span className="text-xs text-[#a3a3a3]">mg/dL avg drop</span>
          </div>
          <p className="mt-2 text-[11px] text-[#a3a3a3]">
            Peak drop typically 2–4h post-ride. Keep a fast-acting carb snack nearby.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
