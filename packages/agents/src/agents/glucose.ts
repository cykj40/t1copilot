import type { GlucoseReading } from '@t1copilot/types'
import { classifyGlucose } from '@t1copilot/utils'

export interface GlucoseAnalysis {
  zone: ReturnType<typeof classifyGlucose>
  averageMgdl: number
  timeInRange: number
}

export function analyzeGlucoseReadings(readings: GlucoseReading[]): GlucoseAnalysis {
  if (readings.length === 0) {
    return { zone: 'inRange', averageMgdl: 0, timeInRange: 0 }
  }

  const values = readings.map((r) => r.value)
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const inRange = values.filter((v) => v >= 70 && v <= 180).length

  return {
    zone: classifyGlucose(avg),
    averageMgdl: Math.round(avg),
    timeInRange: Math.round((inRange / values.length) * 100),
  }
}
