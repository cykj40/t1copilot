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

export interface RenderWeeklySummaryArtifact {
  artifactType: 'render_weekly_summary'
  weekLabel: string
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

export type ArtifactData =
  | GlucoseChartArtifact
  | InsightCardArtifact
  | WorkoutCardArtifact
  | EventLogConfirmationArtifact
  | ParameterDisplayArtifact
  | RenderGlucoseChartArtifact
  | RenderWorkoutCorrelationArtifact
  | RenderWeeklySummaryArtifact
  | RenderDoctorChecklistArtifact
  | ConfirmLogEventArtifact
  | RenderMarkdownDocArtifact
  | RenderHtmlReportArtifact

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
  render_weekly_summary: {
    input: { weekLabel: string }
    output: { weekLabel: string }
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
      notes?: string
    }
    output: {
      eventType: 'insulin' | 'carbs' | 'exercise'
      value: number
      unit: string
      subtype?: string
      food_description?: string
      timestamp?: string
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
}

export type T1UIMessage = UIMessage<unknown, Record<string, never>, T1Tools>
