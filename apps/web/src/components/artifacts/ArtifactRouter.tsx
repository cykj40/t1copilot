import type { ArtifactData } from '@/types/artifacts'
import { ConfirmLogEventArtifact } from './ConfirmLogEventArtifact'
import { DoctorChecklistArtifact } from './DoctorChecklistArtifact'
import { GlucoseChartArtifact } from './GlucoseChartArtifact'
import { WeeklySummaryArtifact } from './WeeklySummaryArtifact'
import { WorkoutCorrelationArtifact } from './WorkoutCorrelationArtifact'

interface ArtifactRouterProps {
  artifact: ArtifactData
}

export function ArtifactRouter({ artifact }: ArtifactRouterProps) {
  switch (artifact.artifactType) {
    case 'render_glucose_chart':
      return <GlucoseChartArtifact artifact={artifact} />
    case 'render_workout_correlation':
      return <WorkoutCorrelationArtifact artifact={artifact} />
    case 'render_weekly_summary':
      return <WeeklySummaryArtifact artifact={artifact} />
    case 'render_doctor_checklist':
      return <DoctorChecklistArtifact artifact={artifact} />
    case 'confirm_log_event':
      return <ConfirmLogEventArtifact artifact={artifact} />
    default:
      return null
  }
}
