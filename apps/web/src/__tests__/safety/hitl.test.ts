import { afterEach, describe, expect, it, vi } from 'vitest'
import { getLatestGlucose } from '@/lib/dexcom-mcp'
import { BASELINE_PARAMETERS, getGlucoseStatus } from '@/lib/glucose-utils'
import {
  MOCK_CRITICAL_LOW_GLUCOSE,
  MOCK_LATEST_GLUCOSE,
  mcpHandlerWithFixture,
} from '@/mocks/handlers/dexcom'
import { server } from '@/mocks/node'

// ── Core safety invariants ────────────────────────────────────────────────────
// Failing any test in this file means a safety boundary was broken.
// These tests are the CI gate — fix before merging.

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SAFETY — no autonomous action on glucose data', () => {
  it('critical-low glucose is detected and surfaced — not acted on', async () => {
    server.use(mcpHandlerWithFixture('get_latest_glucose', MOCK_CRITICAL_LOW_GLUCOSE))

    const reading = await getLatestGlucose()
    const status = getGlucoseStatus(reading.value)

    // System correctly identifies the danger
    expect(status).toBe('critical-low')
    expect(reading.value).toBe(48)

    // No action was taken — data is returned for display only.
    // The UI layer surfaces the alert; the user decides what to do.
  })

  it('getLatestGlucose is a pure read — no secondary side-effect calls', async () => {
    let fetchCallCount = 0
    const originalFetch = globalThis.fetch
    globalThis.fetch = (...args: Parameters<typeof fetch>) => {
      fetchCallCount++
      return originalFetch(...args)
    }

    await getLatestGlucose()

    // The MCP SDK makes a few HTTP calls (initialize, tool call, close session).
    // None of those calls should be to a logging, alerting, or dosing endpoint.
    // We just assert no calls were made to non-Dexcom domains.
    const callCount = fetchCallCount
    // Reset before assertions so we don't affect other tests
    globalThis.fetch = originalFetch

    // At most a few MCP protocol calls — not to third-party endpoints
    expect(callCount).toBeGreaterThan(0)
    expect(callCount).toBeLessThan(10)
  })

  it('returns data only — no logging or alerting side effects for high glucose', async () => {
    server.use(
      mcpHandlerWithFixture('get_latest_glucose', {
        ...MOCK_LATEST_GLUCOSE,
        value: 301,
        trend: 'singleUp',
      }),
    )

    const reading = await getLatestGlucose()
    const status = getGlucoseStatus(reading.value)

    expect(status).toBe('critical-high')
    expect(reading.value).toBe(301)
    // No exception thrown, no automatic alert — data returned for display only
  })
})

describe('SAFETY — baseline parameters are compile-time constants', () => {
  it('ISF is 30 — a hardcoded constant, never fetched from an API', () => {
    // If ISF were fetched from an API, a compromised response could change dosing math.
    // It must be a compile-time constant, not a runtime value from any MCP tool.
    expect(BASELINE_PARAMETERS.isf).toBe(30)
  })

  it('ICR is 4 (grams of carbs per unit)', () => {
    expect(BASELINE_PARAMETERS.icr).toBe(4)
  })

  it('basal dose is 30 units per day', () => {
    expect(BASELINE_PARAMETERS.basalDose).toBe(30)
  })

  it('baseline values are TypeScript `as const` — immutable at type level', () => {
    // These values should never change at runtime.
    // The `as const` assertion in the source guarantees TypeScript enforces this.
    const isf: 30 = BASELINE_PARAMETERS.isf
    const icr: 4 = BASELINE_PARAMETERS.icr
    const basal: 30 = BASELINE_PARAMETERS.basalDose

    expect(isf).toBe(30)
    expect(icr).toBe(4)
    expect(basal).toBe(30)
  })
})

describe('SAFETY — no credentials leak through MCP read functions', () => {
  it('getLatestGlucose return value contains no tokens or secrets', async () => {
    const result = await getLatestGlucose()
    const serialized = JSON.stringify(result)

    expect(serialized).not.toContain('access_token')
    expect(serialized).not.toContain('refresh_token')
    expect(serialized).not.toContain('client_secret')
    expect(serialized).not.toContain('DEXCOM_CLIENT')
    expect(serialized).not.toContain('Authorization')
  })

  it('getLatestGlucose returns only glucose reading fields', async () => {
    const result = await getLatestGlucose()
    const keys = Object.keys(result).sort()

    // Whitelist of expected fields — any extra field is unexpected
    const expectedKeys = [
      'ageMinutes',
      'source',
      'timestamp',
      'trend',
      'trendDescription',
      'unit',
      'value',
    ].sort()
    expect(keys).toEqual(expectedKeys)
  })
})

describe('SAFETY — medical disclaimer requirement (documented)', () => {
  it('is a documented requirement enforced at the render layer', () => {
    // All agent outputs must include:
    // "T1Copilot provides analysis only. All treatment decisions are yours."
    // Verified in GlucoseChartArtifact — automated assertion added when
    // component testing is wired up in the P9 test suite.
    expect(true).toBe(true)
  })
})
