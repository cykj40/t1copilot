'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { RenderInsightSummaryArtifact } from '@/types/artifacts'

interface InsightSummaryArtifactProps {
  artifact: RenderInsightSummaryArtifact
}

function DarkCard({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={`bg-[#111113] border-[#232326] ${className ?? ''}`}>
      <CardHeader className="pb-1 pt-3 px-4">
        <p className="text-xs font-medium text-foreground">{title}</p>
      </CardHeader>
      <CardContent className="px-4 pb-3">{children}</CardContent>
    </Card>
  )
}

function formatHypoRiskDisplay(hypoRisk: string | undefined): string | undefined {
  if (hypoRisk === undefined) return undefined
  if (hypoRisk.includes('unrecognized_keys') || hypoRisk.startsWith('Error')) {
    return 'No hypoglycemia risk data available yet.'
  }
  return hypoRisk
}

export function InsightSummaryArtifact({ artifact }: InsightSummaryArtifactProps) {
  const { trends, drift, adaptiveInsights, disciplineInsights, hypoRisk, weekLabel } = artifact
  const hypoRiskDisplay = formatHypoRiskDisplay(hypoRisk)
  const disclaimer = trends?.disclaimer ?? drift?.disclaimer ?? adaptiveInsights?.disclaimer ?? null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[#a3a3a3]">Insight Summary</p>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
          {weekLabel}
        </span>
      </div>

      {trends?.overallStatistics && (
        <DarkCard title="Overall stats">
          <div className="space-y-2">
            <div>
              <p className="text-[10px] text-[#a3a3a3]">Time in Range</p>
              <div className="flex items-baseline gap-1">
                <span className="font-bold text-2xl text-[#22c55e] tabular-nums">
                  {String(trends.overallStatistics.timeInRange)}
                </span>
                <span className="text-sm text-[#a3a3a3]">%</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-[10px] text-[#a3a3a3]">Avg</p>
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {String(trends.overallStatistics.average)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#a3a3a3]">CV</p>
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {String(trends.overallStatistics.coefficientOfVariation)}%
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#a3a3a3]">Readings</p>
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {String(trends.overallStatistics.readingCount)}
                </p>
              </div>
            </div>
            {trends.overnightPattern?.note && (
              <p className="text-[10px] text-[#a3a3a3] mt-1">{trends.overnightPattern.note}</p>
            )}
          </div>
        </DarkCard>
      )}

      {drift && (
        <DarkCard title="Parameter drift">
          <div
            className={`rounded-lg px-3 py-2 mb-2 ${
              drift.driftDetected
                ? 'bg-[#eab308]/10 border border-[#eab308]/30'
                : 'bg-[#22c55e]/10 border border-[#22c55e]/30'
            }`}
          >
            <p
              className={`text-xs font-medium ${
                drift.driftDetected ? 'text-[#eab308]' : 'text-[#22c55e]'
              }`}
            >
              {drift.driftDetected ? 'Drift detected' : 'No drift detected'}
            </p>
            <p className="text-[10px] text-[#a3a3a3] mt-1">{drift.recommendation}</p>
          </div>
          {drift.recentObservations.length > 0 && (
            <ul className="space-y-2">
              {drift.recentObservations.map((obs) => (
                <li key={`${obs.timestamp}-${obs.type}`} className="text-[10px] text-[#a3a3a3]">
                  <span className="text-foreground font-medium">{obs.type}</span>
                  {' · '}
                  {obs.deviation}
                  {' — '}
                  {obs.hypothesis}
                </li>
              ))}
            </ul>
          )}
        </DarkCard>
      )}

      {adaptiveInsights && (
        <DarkCard title="Adaptive insights">
          <p className="text-[10px] text-[#a3a3a3] mb-2">{adaptiveInsights.observationsSummary}</p>
          {adaptiveInsights.recentObservations.length > 0 && (
            <ul className="space-y-2 mb-2">
              {adaptiveInsights.recentObservations.map((obs) => (
                <li key={`${obs.timestamp}-${obs.type}`} className="text-[10px] text-[#a3a3a3]">
                  <span className="text-foreground font-medium">{obs.type}</span>
                  {' · '}
                  {obs.deviation}
                  {' — '}
                  {obs.hypothesis}
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-foreground">{adaptiveInsights.recommendation}</p>
        </DarkCard>
      )}

      {trends?.exerciseImpact && (
        <DarkCard title="Exercise patterns">
          <p className="text-[10px] text-[#a3a3a3] mb-2">
            {String(trends.exerciseImpact.sessionsAnalyzed)} sessions analyzed
          </p>
          {trends.exerciseImpact.recentSessions.length > 0 && (
            <ul className="space-y-1.5 mb-2">
              {trends.exerciseImpact.recentSessions.map((session) => (
                <li
                  key={session.timestamp}
                  className="flex justify-between text-[10px] text-[#a3a3a3]"
                >
                  <span>
                    {session.exerciseData?.activityType ?? 'Exercise'} ·{' '}
                    {new Date(session.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="tabular-nums text-foreground">
                    −{String(session.drop)} mg/dL
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-[10px] text-[#a3a3a3]">{trends.exerciseImpact.note}</p>
        </DarkCard>
      )}

      {trends?.postMealPatterns && (
        <DarkCard title="Post-meal patterns">
          <p className="text-[10px] text-[#a3a3a3] mb-2">
            Avg spike:{' '}
            <span className="text-foreground font-medium tabular-nums">
              +{String(trends.postMealPatterns.averageSpike)} mg/dL
            </span>
            {' · '}
            {String(trends.postMealPatterns.mealsAnalyzed)} meals
          </p>
          {trends.postMealPatterns.recentMeals.length > 0 && (
            <ul className="space-y-1.5 mb-2">
              {trends.postMealPatterns.recentMeals.map((meal) => (
                <li
                  key={meal.timestamp}
                  className="flex justify-between text-[10px] text-[#a3a3a3]"
                >
                  <span>
                    {meal.carbData?.foodDescription ?? 'Meal'} ·{' '}
                    {new Date(meal.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="tabular-nums text-foreground">+{String(meal.spike)} mg/dL</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-[10px] text-[#a3a3a3]">{trends.postMealPatterns.note}</p>
        </DarkCard>
      )}

      {disciplineInsights && (
        <DarkCard title="Exercise discipline insights">
          <p className="text-[10px] text-[#a3a3a3] whitespace-pre-wrap">{disciplineInsights}</p>
        </DarkCard>
      )}

      {hypoRiskDisplay && (
        <DarkCard title="Hypoglycemia risk scan">
          <p className="text-[10px] text-[#a3a3a3] whitespace-pre-wrap">{hypoRiskDisplay}</p>
        </DarkCard>
      )}

      {disclaimer && <p className="text-[10px] text-muted-foreground/70 px-1">{disclaimer}</p>}
    </div>
  )
}
