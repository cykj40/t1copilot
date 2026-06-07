import type { ArtifactData } from '@/types/artifacts'
import { BaselineSetupModal } from '../setup/BaselineSetupModal'
import { BaselineParametersArtifact } from './BaselineParametersArtifact'
import { ConfirmLogEventArtifact } from './ConfirmLogEventArtifact'
import { DoctorChecklistArtifact } from './DoctorChecklistArtifact'
import { GlucoseChartArtifact } from './GlucoseChartArtifact'
import { HtmlReportArtifact } from './HtmlReportArtifact'
import { InsightSummaryArtifact } from './InsightSummaryArtifact'
import { MarkdownDocArtifact } from './MarkdownDocArtifact'
import { PredictionArtifact } from './PredictionArtifact'
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
    case 'render_markdown_doc':
      return <MarkdownDocArtifact artifact={artifact} />
    case 'render_html_report':
      return <HtmlReportArtifact artifact={artifact} />
    case 'render_prediction':
      return <PredictionArtifact artifact={artifact} />
    case 'render_baseline_parameters':
      return <BaselineParametersArtifact artifact={artifact} />
    case 'render_baseline_setup':
      return <BaselineSetupModal />
    case 'render_insight_summary':
      return <InsightSummaryArtifact artifact={artifact} />
    default:
      return null
  }
}
