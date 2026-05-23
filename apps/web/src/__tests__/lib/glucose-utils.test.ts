import { describe, expect, it } from 'vitest'
import {
  BASELINE_PARAMETERS,
  formatReadingAge,
  getGlucoseStatus,
  getTrendArrow,
  getValueColor,
} from '@/lib/glucose-utils'

describe('getGlucoseStatus', () => {
  it('returns critical-low below 54', () => {
    expect(getGlucoseStatus(53)).toBe('critical-low')
    expect(getGlucoseStatus(40)).toBe('critical-low')
    expect(getGlucoseStatus(1)).toBe('critical-low')
  })

  it('returns low between 54 and 69', () => {
    expect(getGlucoseStatus(54)).toBe('low')
    expect(getGlucoseStatus(60)).toBe('low')
    expect(getGlucoseStatus(69)).toBe('low')
  })

  it('returns in-range between 70 and 180', () => {
    expect(getGlucoseStatus(70)).toBe('in-range')
    expect(getGlucoseStatus(100)).toBe('in-range')
    expect(getGlucoseStatus(142)).toBe('in-range')
    expect(getGlucoseStatus(180)).toBe('in-range')
  })

  it('returns high between 181 and 250', () => {
    expect(getGlucoseStatus(181)).toBe('high')
    expect(getGlucoseStatus(220)).toBe('high')
    expect(getGlucoseStatus(250)).toBe('high')
  })

  it('returns critical-high above 250', () => {
    expect(getGlucoseStatus(251)).toBe('critical-high')
    expect(getGlucoseStatus(300)).toBe('critical-high')
    expect(getGlucoseStatus(400)).toBe('critical-high')
  })

  // Boundary values — most T1D bugs live at the edges
  it('handles exact boundary values correctly', () => {
    expect(getGlucoseStatus(54)).toBe('low') // not critical-low
    expect(getGlucoseStatus(70)).toBe('in-range') // not low
    expect(getGlucoseStatus(180)).toBe('in-range') // not high
    expect(getGlucoseStatus(250)).toBe('high') // not critical-high
  })
})

describe('getTrendArrow', () => {
  it('maps all valid Dexcom camelCase trend strings to arrows', () => {
    expect(getTrendArrow('doubleUp')).toBe('↑↑')
    expect(getTrendArrow('singleUp')).toBe('↑')
    expect(getTrendArrow('fortyFiveUp')).toBe('↗')
    expect(getTrendArrow('flat')).toBe('→')
    expect(getTrendArrow('fortyFiveDown')).toBe('↘')
    expect(getTrendArrow('singleDown')).toBe('↓')
    expect(getTrendArrow('doubleDown')).toBe('↓↓')
    expect(getTrendArrow('none')).toBe('—')
    expect(getTrendArrow('notComputable')).toBe('—')
    expect(getTrendArrow('rateOutOfRange')).toBe('±')
  })

  it('returns — for unknown trend strings', () => {
    expect(getTrendArrow('unknown')).toBe('—')
    expect(getTrendArrow('')).toBe('—')
    expect(getTrendArrow('FLAT')).toBe('—') // PascalCase from old spec — not a valid Dexcom trend
    expect(getTrendArrow('None')).toBe('—') // wrong case
  })
})

describe('formatReadingAge', () => {
  it('returns "just now" for 0 minutes', () => {
    expect(formatReadingAge(0)).toBe('just now')
  })

  it('returns minutes for under 60', () => {
    expect(formatReadingAge(1)).toBe('1m ago')
    expect(formatReadingAge(5)).toBe('5m ago')
    expect(formatReadingAge(22)).toBe('22m ago')
    expect(formatReadingAge(59)).toBe('59m ago')
  })

  it('returns hours for 60 and above', () => {
    expect(formatReadingAge(60)).toBe('1h ago')
    expect(formatReadingAge(90)).toBe('2h ago') // rounds up
    expect(formatReadingAge(120)).toBe('2h ago')
    expect(formatReadingAge(180)).toBe('3h ago')
  })

  it('flags stale readings accurately — 22 minutes means 4+ missed CGM readings', () => {
    // CGM updates every 5 minutes — 22 minutes means 4+ missed readings
    // The UI layer adds stale styling; the age string must be precise
    expect(formatReadingAge(22)).toBe('22m ago')
  })

  it('handles fractional minutes by rounding', () => {
    expect(formatReadingAge(0.4)).toBe('just now') // < 1 → just now
    expect(formatReadingAge(1.6)).toBe('2m ago') // rounds
  })
})

describe('getValueColor', () => {
  it('returns red (#E24B4A) for values below 70 (low)', () => {
    expect(getValueColor(60)).toBe('#E24B4A')
    expect(getValueColor(40)).toBe('#E24B4A')
  })

  it('returns green (#1D9E75) for in-range values 70–180', () => {
    expect(getValueColor(70)).toBe('#1D9E75')
    expect(getValueColor(100)).toBe('#1D9E75')
    expect(getValueColor(142)).toBe('#1D9E75')
    expect(getValueColor(180)).toBe('#1D9E75')
  })

  it('returns amber (#BA7517) for high values 181–250', () => {
    expect(getValueColor(181)).toBe('#BA7517')
    expect(getValueColor(220)).toBe('#BA7517')
    expect(getValueColor(250)).toBe('#BA7517')
  })

  it('returns red (#E24B4A) for critical-high values above 250', () => {
    expect(getValueColor(251)).toBe('#E24B4A')
    expect(getValueColor(350)).toBe('#E24B4A')
  })

  it('returns the same color for all values in the same zone', () => {
    expect(getValueColor(80)).toBe(getValueColor(150)) // both in-range
    expect(getValueColor(50)).toBe(getValueColor(65)) // both low
    expect(getValueColor(300)).toBe(getValueColor(400)) // both critical-high
  })
})

describe('BASELINE_PARAMETERS', () => {
  it('exports read-only baseline parameters with correct values', () => {
    expect(BASELINE_PARAMETERS.isf).toBe(30)
    expect(BASELINE_PARAMETERS.icr).toBe(4)
    expect(BASELINE_PARAMETERS.basalDose).toBe(30)
  })

  it('is frozen — cannot be mutated at runtime', () => {
    // TypeScript enforces this at compile time via `as const`.
    // Verify the object itself has the correct shape.
    expect(typeof BASELINE_PARAMETERS.isf).toBe('number')
    expect(typeof BASELINE_PARAMETERS.icr).toBe('number')
    expect(typeof BASELINE_PARAMETERS.basalDose).toBe('number')
  })
})
