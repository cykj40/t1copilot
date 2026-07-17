import { formatLocalTimestamp } from '@t1copilot/utils'
import { describe, expect, it } from 'vitest'

describe('formatLocalTimestamp', () => {
  it('uses the configured IANA timezone and DST abbreviation', () => {
    expect(formatLocalTimestamp('2026-07-16T19:55:28.351Z', 'America/New_York')).toBe(
      'July 16, 3:55 PM EDT',
    )
  })

  it('uses the standard-time abbreviation after the DST transition', () => {
    expect(formatLocalTimestamp('2026-12-16T19:55:28.351Z', 'America/New_York')).toBe(
      'December 16, 2:55 PM EST',
    )
  })
})
