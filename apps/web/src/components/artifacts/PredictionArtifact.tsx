'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { RenderPredictionArtifact } from '@/types/artifacts'

interface PredictionArtifactProps {
  artifact: RenderPredictionArtifact
}

function glucoseColorClass(value: number): string {
  if (value >= 70 && value <= 180) return 'text-[#22c55e]'
  if ((value >= 181 && value <= 250) || (value >= 55 && value <= 69)) return 'text-[#eab308]'
  return 'text-[#ef4444]'
}

interface EffectSectionProps {
  title: string
  changeLabel: string
  effect: {
    predictedChange: number
    predictedGlucose: number
    confidenceRange: { low: number; high: number }
    timeHorizonMinutes: number
    factors: string[]
    disclaimer: string
  }
}

function EffectSection({ title, changeLabel, effect }: EffectSectionProps) {
  return (
    <Card className="bg-[#111113] border-[#232326]">
      <CardHeader className="pb-1 pt-3 px-4">
        <p className="text-xs font-medium text-foreground">{title}</p>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] text-[#a3a3a3]">{changeLabel}</span>
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {effect.predictedChange > 0 ? '+' : ''}
            {String(effect.predictedChange)} mg/dL
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] text-[#a3a3a3]">Predicted glucose</span>
          <span
            className={`text-lg font-bold tabular-nums ${glucoseColorClass(effect.predictedGlucose)}`}
          >
            {String(effect.predictedGlucose)} mg/dL
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] text-[#a3a3a3]">Confidence range</span>
          <span className="text-xs tabular-nums text-foreground">
            {String(effect.confidenceRange.low)}–{String(effect.confidenceRange.high)} mg/dL
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] text-[#a3a3a3]">Time horizon</span>
          <span className="text-xs text-foreground">{String(effect.timeHorizonMinutes)} min</span>
        </div>
        {effect.factors.length > 0 && (
          <ul className="mt-1 space-y-0.5">
            {effect.factors.map((factor) => (
              <li key={factor} className="text-[10px] text-[#a3a3a3]">
                • {factor}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function PredictionArtifact({ artifact }: PredictionArtifactProps) {
  const { predictionResult, actionType, disclaimer } = artifact
  const { currentGlucose, insulin, carbs, combined } = predictionResult

  return (
    <div className="flex flex-col gap-3">
      <Card className="bg-[#111113] border-[#232326]">
        <CardContent className="pt-4 pb-3 px-4">
          <p className="text-[10px] text-[#a3a3a3] mb-1">Current glucose</p>
          <p className={`text-3xl font-bold tabular-nums ${glucoseColorClass(currentGlucose)}`}>
            {String(currentGlucose)}
            <span className="text-sm font-normal text-[#a3a3a3] ml-1">mg/dL</span>
          </p>
        </CardContent>
      </Card>

      {(actionType === 'insulin' || actionType === 'both') && insulin && (
        <EffectSection title="Insulin effect" changeLabel="Predicted drop" effect={insulin} />
      )}

      {(actionType === 'carbs' || actionType === 'both') && carbs && (
        <EffectSection title="Carb effect" changeLabel="Predicted rise" effect={carbs} />
      )}

      {actionType === 'both' && combined && (
        <Card className="bg-[#111113] border-[#232326]">
          <CardHeader className="pb-1 pt-3 px-4">
            <p className="text-xs font-medium text-foreground">Combined net effect</p>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-[#a3a3a3]">Insulin</p>
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {String(combined.insulinEffect)} mg/dL
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#a3a3a3]">Carbs</p>
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  +{String(combined.carbEffect)} mg/dL
                </p>
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] text-[#a3a3a3]">Net change</span>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {combined.netChange > 0 ? '+' : ''}
                {String(combined.netChange)} mg/dL
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] text-[#a3a3a3]">Predicted glucose</span>
              <span
                className={`text-lg font-bold tabular-nums ${glucoseColorClass(combined.predictedGlucose)}`}
              >
                {String(combined.predictedGlucose)} mg/dL
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] text-[#a3a3a3]">Confidence range</span>
              <span className="text-xs tabular-nums text-foreground">
                {String(combined.confidenceRange.low)}–{String(combined.confidenceRange.high)} mg/dL
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-[10px] text-muted-foreground/70 px-1">{disclaimer}</p>
    </div>
  )
}
