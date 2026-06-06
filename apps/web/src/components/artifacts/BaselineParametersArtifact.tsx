'use client'

import type { BaselineParametersResponse } from '@t1copilot/mcp-clients'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { RenderBaselineParametersArtifact } from '@/types/artifacts'

interface BaselineParametersArtifactProps {
  artifact?: RenderBaselineParametersArtifact
  parameters?: BaselineParametersResponse
}

interface ParamRowProps {
  label: string
  value: string
  unit: string
  description: string
}

function ParamRow({ label, value, unit, description }: ParamRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#232326] last:border-0">
      <div>
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="flex items-baseline gap-1 shrink-0 ml-4">
        <span className="font-bold tabular-nums text-foreground text-sm">{value}</span>
        <span className="text-[10px] text-muted-foreground">{unit}</span>
      </div>
    </div>
  )
}

export function BaselineParametersArtifact({
  artifact,
  parameters,
}: BaselineParametersArtifactProps) {
  const data = parameters ?? artifact?.parameters
  if (!data) return null

  const { baselineParameters, note } = data

  return (
    <Card className="bg-[#111113] border-[#232326]">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-foreground">Baseline Parameters</p>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            Read-only
          </span>
        </div>
        {note && <p className="text-[10px] text-muted-foreground/70 mt-1">{note}</p>}
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <ParamRow
          label="Insulin Sensitivity Factor (ISF)"
          value={String(baselineParameters.insulinSensitivityFactor.value)}
          unit="mg/dL per unit"
          description={baselineParameters.insulinSensitivityFactor.description}
        />
        <ParamRow
          label="Insulin-to-Carb Ratio (ICR)"
          value={String(baselineParameters.insulinToCarbRatio.value)}
          unit="g per unit"
          description={baselineParameters.insulinToCarbRatio.description}
        />
        <ParamRow
          label="Basal Dose"
          value={String(baselineParameters.basalDose.value)}
          unit="units/day"
          description={baselineParameters.basalDose.description}
        />
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-xs font-medium text-foreground">Basal Timing</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              When basal dose is administered
            </p>
          </div>
          <span className="text-sm font-semibold text-foreground capitalize">
            {baselineParameters.basalTiming}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-2">
          Last updated: {baselineParameters.updatedAt}
        </p>
      </CardContent>
    </Card>
  )
}
