import { describe, expect, it } from 'vitest'
import {
  DexcomMcpAuthError,
  DexcomMcpError,
  DexcomMcpTimeoutError,
  isDexcomColdStartError,
} from '../dexcom.js'

describe('isDexcomColdStartError', () => {
  it('matches BodyTimeoutError and UND_ERR_BODY_TIMEOUT', () => {
    expect(
      isDexcomColdStartError({ name: 'BodyTimeoutError', message: 'Body Timeout Error' }),
    ).toBe(true)
    expect(isDexcomColdStartError({ code: 'UND_ERR_BODY_TIMEOUT', message: 'fetch failed' })).toBe(
      true,
    )
  })

  it('matches TypeError terminated and MCP -32001', () => {
    expect(isDexcomColdStartError(new TypeError('terminated'))).toBe(true)
    expect(isDexcomColdStartError(new Error('MCP error -32001: Request timed out'))).toBe(true)
  })

  it('matches DexcomMcpTimeoutError', () => {
    expect(isDexcomColdStartError(new DexcomMcpTimeoutError('get_glucose_range'))).toBe(true)
  })

  it('does not match auth or validation errors', () => {
    expect(isDexcomColdStartError(new DexcomMcpAuthError())).toBe(false)
    expect(isDexcomColdStartError(new DexcomMcpError('tool', 'Invalid request'))).toBe(false)
    expect(isDexcomColdStartError(new Error('HTTP 401 Unauthorized'))).toBe(false)
  })
})
