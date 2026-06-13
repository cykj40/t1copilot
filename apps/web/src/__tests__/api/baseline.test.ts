import { describe, expect, it } from 'vitest'
import { GET, POST } from '@/app/api/baseline/route'
import { mcpHandlerWithIsError, resetBaselineFixture } from '@/mocks/handlers/dexcom-modeling'
import { server } from '@/mocks/node'

function postBaseline(body: Record<string, unknown>) {
  return POST(
    new Request('http://localhost:3000/api/baseline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )
}

describe('GET /api/baseline', () => {
  it('returns 200 with parameters on success', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
    const data = (await response.json()) as {
      success: boolean
      parameters: { baselineParameters: { insulinSensitivityFactor: { value: number } } }
    }
    expect(data.success).toBe(true)
    expect(data.parameters.baselineParameters.insulinSensitivityFactor.value).toBe(30)
  })

  it('returns 502 when MCP returns an error', async () => {
    resetBaselineFixture()
    server.use(mcpHandlerWithIsError('MCP error -32001: Request timed out'))

    const response = await GET()
    expect(response.status).toBe(502)
    const data = (await response.json()) as { success: boolean; error: string }
    expect(data.success).toBe(false)
  })
})

describe('POST /api/baseline', () => {
  it('returns 200 with updated parameters on valid body', async () => {
    const response = await postBaseline({
      correction_factor: 35,
      insulin_to_carb_ratio: 5,
      basal_dose: 28,
    })

    expect(response.status).toBe(200)
    const data = (await response.json()) as {
      success: boolean
      updatedParameters: { insulinSensitivityFactor: { value: number } }
    }
    expect(data.success).toBe(true)
    expect(data.updatedParameters.insulinSensitivityFactor.value).toBe(35)
  })

  it('returns 400 when correction_factor is missing', async () => {
    const response = await postBaseline({
      insulin_to_carb_ratio: 5,
      basal_dose: 28,
    })

    expect(response.status).toBe(400)
    const data = (await response.json()) as { success: boolean; error: string }
    expect(data.success).toBe(false)
    expect(data.error).toBe('Invalid request body')
  })

  it('returns 502 when MCP returns an error', async () => {
    resetBaselineFixture()
    server.use(mcpHandlerWithIsError('Failed to update baseline parameters'))

    const response = await postBaseline({
      correction_factor: 35,
      insulin_to_carb_ratio: 5,
      basal_dose: 28,
    })

    expect(response.status).toBe(502)
    const data = (await response.json()) as { success: boolean; error: string }
    expect(data.success).toBe(false)
    expect(data.error).toContain('Failed to update baseline parameters')
  })
})
