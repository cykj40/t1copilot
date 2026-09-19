import { describe, expect, it } from 'vitest'
import { mapDexcomTrend } from '@/lib/glucose-utils'

// ── mapDexcomTrend ────────────────────────────────────────────────────────────

describe('mapDexcomTrend', () => {
  it('maps all Dexcom camelCase trends to app TrendArrow enum values', () => {
    expect(mapDexcomTrend('flat')).toBe('FLAT')
    expect(mapDexcomTrend('singleUp')).toBe('SINGLE_UP')
    expect(mapDexcomTrend('singleDown')).toBe('SINGLE_DOWN')
    expect(mapDexcomTrend('fortyFiveUp')).toBe('FORTY_FIVE_UP')
    expect(mapDexcomTrend('fortyFiveDown')).toBe('FORTY_FIVE_DOWN')
    expect(mapDexcomTrend('doubleUp')).toBe('DOUBLE_UP')
    expect(mapDexcomTrend('doubleDown')).toBe('DOUBLE_DOWN')
    expect(mapDexcomTrend('none')).toBe('NONE')
    expect(mapDexcomTrend('notComputable')).toBe('NOT_COMPUTABLE')
    expect(mapDexcomTrend('rateOutOfRange')).toBe('RATE_OUT_OF_RANGE')
  })

  it('defaults to NONE for unknown trend strings', () => {
    expect(mapDexcomTrend('unknown')).toBe('NONE')
    expect(mapDexcomTrend('')).toBe('NONE')
  })
})
