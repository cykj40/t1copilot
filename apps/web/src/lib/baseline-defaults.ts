import type { BaselineParametersResponse } from '@t1copilot/mcp-clients'

// These are the hardcoded server defaults — never safe to use for predictions
// without the user explicitly confirming they are correct for them.
export const SERVER_DEFAULT_ISF = 30
export const SERVER_DEFAULT_ICR = 4
export const SERVER_DEFAULT_BASAL = 30

export function isDefaultParameters(params: BaselineParametersResponse): boolean {
  const p = params.baselineParameters
  return (
    p.insulinSensitivityFactor.value === SERVER_DEFAULT_ISF &&
    p.insulinToCarbRatio.value === SERVER_DEFAULT_ICR &&
    p.basalDose.value === SERVER_DEFAULT_BASAL
  )
}
