import type {
  AnalyzeTrendsResponse,
  BaselineParametersResponse,
  DetectParameterDriftResponse,
  GetAdaptiveInsightsResponse,
  PredictGlucoseImpactResponse,
} from '@t1copilot/mcp-clients'
import type { WorkoutCorrelation } from '@t1copilot/types'
import type { UIMessage } from 'ai'

// ── Legacy artifact types (kept for backward compat) ─────────────────────────

export interface GlucoseChartArtifact {
  artifactType: 'glucose_chart'
  currentValue: number
  currentTrend: string
  timeInRangePercent: number
  unit: string
}

export interface InsightCardArtifact {
  artifactType: 'insight_card'
  title: string
  summary: string
  confidence: number
  actionable: boolean
}

export interface WorkoutCardArtifact {
  artifactType: 'workout_card'
  discipline: string
  durationMinutes: number
  glucoseDropMgdl: number
  hypoRisk: 'low' | 'moderate' | 'high'
}

export interface EventLogConfirmationArtifact {
  artifactType: 'event_log_confirmation'
  eventType: 'insulin' | 'carbs' | 'exercise'
  details: string
  requiresApproval: boolean
}

export interface ParameterDisplayArtifact {
  artifactType: 'parameter_display'
  isf: number
  icr: number
  basalUnitsPerDay: number
}

// ── Tool-call artifact types (new generative UI system) ───────────────────────

export interface GlucoseChartReading {
  value: number
  trend: string
  timestamp: string
  localTimestamp?: string
}

export interface GlucoseChartStatistics {
  average: number
  min: number
  max: number
  timeInRange: number
  timeBelowRange: number
  timeAboveRange: number
  readingCount: number
  standardDeviation: number
  coefficientOfVariation: number
}

export interface RenderGlucoseChartArtifact {
  artifactType: 'render_glucose_chart'
  timeRange: string
  title: string
  readings?: GlucoseChartReading[]
  statistics?: GlucoseChartStatistics
}

export interface RenderWorkoutCorrelationArtifact {
  artifactType: 'render_workout_correlation'
  workoutId: string
  workoutName: string
  correlation?: WorkoutCorrelation
}

export interface RenderDoctorChecklistArtifact {
  artifactType: 'render_doctor_checklist'
  appointmentDate?: string
}

export interface ConfirmLogEventArtifact {
  artifactType: 'confirm_log_event'
  eventType: 'insulin' | 'carbs' | 'exercise'
  value: number
  unit: string
  subtype?: string
  food_description?: string
  timestamp?: string
  duration_minutes?: number
  notes?: string
}

export interface RenderMarkdownDocArtifact {
  artifactType: 'render_markdown_doc'
  title: string
  content: string
}

export interface RenderHtmlReportArtifact {
  artifactType: 'render_html_report'
  title: string
  html: string
}

export interface RenderPredictionArtifact {
  artifactType: 'render_prediction'
  predictionResult: PredictGlucoseImpactResponse
  actionType: 'insulin' | 'carbs' | 'both'
  disclaimer: string
}

export interface RenderBaselineParametersArtifact {
  artifactType: 'render_baseline_parameters'
  parameters: BaselineParametersResponse & {
    baselineParameters: BaselineParametersResponse['baselineParameters'] & {
      localUpdatedAt?: string
    }
  }
}

export interface RenderBaselineSetupArtifact {
  artifactType: 'render_baseline_setup'
}

export interface RenderInsightSummaryArtifact {
  artifactType: 'render_insight_summary'
  trends?: AnalyzeTrendsResponse
  drift?: DetectParameterDriftResponse
  adaptiveInsights?: GetAdaptiveInsightsResponse
  disciplineInsights?: string
  hypoRisk?: string
  weekLabel: string
  eventTimeline?: {
    period?: {
      start: string
      end: string
      localStartTime?: string
      localEndTime?: string
    }
    summary?: {
      totalEvents: number
      totalInsulin: number
      totalCarbs: number
      exerciseSessions: number
    }
    timeline: Array<{
      timestamp: string
      localTimestamp?: string
      type: 'insulin' | 'carbs' | 'exercise'
      data: Record<string, unknown>
      glucoseContext: { value: number; trend: string } | null
    }>
  }
}

export interface RenderResearchResultsArtifact {
  artifactType: 'render_research_results'
  id: string
  query: string
  status: 'pending' | 'complete' | 'error'
  sourceUrl: string | null
  content: string | null
  agentSummary: string | null
}

export type ArtifactData =
  | GlucoseChartArtifact
  | InsightCardArtifact
  | WorkoutCardArtifact
  | EventLogConfirmationArtifact
  | ParameterDisplayArtifact
  | RenderGlucoseChartArtifact
  | RenderWorkoutCorrelationArtifact
  | RenderDoctorChecklistArtifact
  | ConfirmLogEventArtifact
  | RenderMarkdownDocArtifact
  | RenderHtmlReportArtifact
  | RenderPredictionArtifact
  | RenderBaselineParametersArtifact
  | RenderBaselineSetupArtifact
  | RenderInsightSummaryArtifact
  | RenderResearchResultsArtifact

// ── T1 tool types for useChat generic ────────────────────────────────────────

export type T1Tools = {
  render_glucose_chart: {
    input: { timeRange: string; title: string }
    output: {
      timeRange: string
      title: string
      readings: GlucoseChartReading[]
      statistics: GlucoseChartStatistics
    }
  }
  render_workout_correlation: {
    input: {
      workoutId: string
      workoutName: string
      startTime?: string
      durationMinutes?: number
    }
    output: {
      workoutId: string
      workoutName: string
      correlation?: WorkoutCorrelation
    }
  }
  render_doctor_checklist: {
    input: { appointmentDate?: string }
    output: { appointmentDate?: string }
  }
  confirm_log_event: {
    input: {
      eventType: 'insulin' | 'carbs' | 'exercise'
      value: number
      unit: string
      subtype?: string
      food_description?: string
      timestamp?: string
      duration_minutes?: number
      notes?: string
    }
    output: {
      eventType: 'insulin' | 'carbs' | 'exercise'
      value: number
      unit: string
      subtype?: string
      food_description?: string
      timestamp?: string
      duration_minutes?: number
      notes?: string
      status: string
    }
  }
  render_markdown_doc: {
    input: { title: string; content: string }
    output: { title: string; content: string }
  }
  render_html_report: {
    input: { title: string; html: string }
    output: { title: string; html: string }
  }
  render_prediction: {
    input: {
      action_type: 'insulin' | 'carbs' | 'both'
      insulin_units?: number
      carb_grams?: number
      current_glucose?: number
    }
    output: {
      predictionResult?: PredictGlucoseImpactResponse
      actionType?: 'insulin' | 'carbs' | 'both'
      disclaimer?: string
      requiresSetup?: boolean
      error?: string
    }
  }
  render_baseline_parameters: {
    input: Record<string, never>
    output: {
      parameters: BaselineParametersResponse & {
        baselineParameters: BaselineParametersResponse['baselineParameters'] & {
          localUpdatedAt?: string
        }
      }
      error?: string
    }
  }
  render_glucose_stats: {
    input: { hours?: number }
    output: {
      timeRange: {
        start: string
        end: string
        hours: number
        localStartTime?: string
        localEndTime?: string
      }
      statistics: {
        average: number
        standardDeviation: number
        min: number
        max: number
        timeInRange: number
        timeBelowRange: number
        timeAboveRange: number
        readingCount: number
        coefficientOfVariation: number
      }
      error?: string
    }
  }
  compare_prediction_vs_actual: {
    input: {
      event_type: 'insulin' | 'carbs'
      event_timestamp: string
      event_value: number
      current_glucose: number
      window_hours?: number
    }
    output: {
      event: {
        type: string
        value: number
        timestamp: string
        startingGlucose: number
        localTimestamp?: string
      }
      prediction: {
        predictedGlucose: number
        predictedChange: number
        confidenceRange: { low: number; high: number }
      }
      actual: { readingsAnalyzed: number; finalGlucose: number }
      observation: {
        observationType: string
        expectedValue: number
        actualValue: number
        deviationPct: number
        context: { timeOfDay: string; hour: number; eventType: string }
        hypothesis: string
        timestamp: string
        id: number
        localTimestamp?: string
      }
      disclaimer: string
      error?: string
    }
  }
  render_insight_summary: {
    input: {
      days?: number
      weekLabel?: string
    }
    output: {
      trends?: AnalyzeTrendsResponse
      drift?: DetectParameterDriftResponse
      adaptiveInsights?: GetAdaptiveInsightsResponse
      disciplineInsights?: string
      hypoRisk?: string
      weekLabel: string
      eventTimeline?: RenderInsightSummaryArtifact['eventTimeline']
      error?: string
    }
  }
  start_research: {
    input: { query: string }
    output: {
      success: boolean
      interactionId?: string
      cacheId?: string
      status?: 'pending'
      error?: string
    }
  }
  view_artifact_panel: {
    input: Record<string, never>
    output: { image: string } | { error: string }
  }
}

export type T1UIMessage = UIMessage<unknown, Record<string, never>, T1Tools>
