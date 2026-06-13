'use client'

import type { BaselineParametersResponse } from '@t1copilot/mcp-clients'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type FormStatus = 'idle' | 'loading' | 'success' | 'error'
type LoadState = 'loading' | 'loaded' | 'error'

export function BaselineParametersForm() {
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [loadError, setLoadError] = useState('')
  const [parameters, setParameters] = useState<BaselineParametersResponse | null>(null)

  const [isf, setIsf] = useState('')
  const [icr, setIcr] = useState('')
  const [basalDose, setBasalDose] = useState('')
  const [basalTiming, setBasalTiming] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const fetchParameters = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoadState('loading')
    }
    try {
      const res = await fetch('/api/baseline', { cache: 'no-store' })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        if (!options?.silent) {
          setLoadError(data.error ?? 'Failed to load parameters')
          setLoadState('error')
        }
        return
      }
      const data = (await res.json()) as {
        success: boolean
        parameters: BaselineParametersResponse
      }
      const p = data.parameters
      setParameters(p)
      setIsf(String(p.baselineParameters.insulinSensitivityFactor.value))
      setIcr(String(p.baselineParameters.insulinToCarbRatio.value))
      setBasalDose(String(p.baselineParameters.basalDose.value))
      setBasalTiming(p.baselineParameters.basalTiming)
      setLoadState('loaded')
    } catch {
      if (!options?.silent) {
        setLoadError('Failed to load parameters')
        setLoadState('error')
      }
    }
  }, [])

  useEffect(() => {
    void fetchParameters()
  }, [fetchParameters])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    try {
      const res = await fetch('/api/baseline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correction_factor: Number(isf),
          insulin_to_carb_ratio: Number(icr),
          basal_dose: Number(basalDose),
          basal_timing: basalTiming,
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setErrorMessage(data.error ?? 'Failed to save parameters')
        setStatus('error')
        return
      }

      setNotes('')
      setStatus('success')
      await fetchParameters({ silent: true })
    } catch {
      setErrorMessage('Failed to save parameters')
      setStatus('error')
    }
  }

  if (loadState === 'loading') {
    return (
      <Card className="bg-card border-border">
        <CardContent className="px-4 py-6">
          <p className="text-xs text-muted-foreground text-center">Loading parameters…</p>
        </CardContent>
      </Card>
    )
  }

  if (loadState === 'error') {
    return (
      <Card className="bg-card border-border">
        <CardContent className="px-4 py-6 flex flex-col gap-3">
          <p className="text-xs text-muted-foreground text-center">{loadError}</p>
          <button
            type="button"
            onClick={() => void fetchParameters()}
            className="text-xs text-primary hover:underline text-center"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-foreground">Baseline Parameters</p>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            Editable
          </span>
        </div>
        <p className="text-[10px] text-[#eab308] mt-2 leading-relaxed">
          ⚠️ These parameters affect all glucose predictions. Only change them if your care team has
          updated your prescription or you have confirmed new values through your own testing.
          Incorrect values will produce inaccurate predictions.
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label htmlFor="settings-isf" className="text-xs font-medium text-foreground">
              Insulin Sensitivity Factor (ISF)
            </label>
            <p className="text-[10px] text-muted-foreground mb-1">mg/dL drop per 1 unit</p>
            <Input
              id="settings-isf"
              type="number"
              min="1"
              step="1"
              value={isf}
              onChange={(e) => setIsf(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="settings-icr" className="text-xs font-medium text-foreground">
              Insulin-to-Carb Ratio (ICR)
            </label>
            <p className="text-[10px] text-muted-foreground mb-1">grams of carbs per 1 unit</p>
            <Input
              id="settings-icr"
              type="number"
              min="1"
              step="0.5"
              value={icr}
              onChange={(e) => setIcr(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="settings-basal" className="text-xs font-medium text-foreground">
              Basal Dose
            </label>
            <p className="text-[10px] text-muted-foreground mb-1">units per day</p>
            <Input
              id="settings-basal"
              type="number"
              min="1"
              step="0.5"
              value={basalDose}
              onChange={(e) => setBasalDose(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="settings-timing" className="text-xs font-medium text-foreground">
              Basal Timing
            </label>
            <Input
              id="settings-timing"
              type="text"
              value={basalTiming}
              onChange={(e) => setBasalTiming(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="settings-notes" className="text-xs font-medium text-foreground">
              Reason for change (optional)
            </label>
            <textarea
              id="settings-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground"
              placeholder="e.g. Updated per endo appointment"
            />
          </div>

          <p className="text-[10px] text-muted-foreground/60">
            Last updated: {parameters?.baselineParameters.updatedAt ?? '—'}
          </p>

          {status === 'success' && <p className="text-xs text-[#22c55e]">Parameters saved</p>}
          {status === 'error' && errorMessage && (
            <p className="text-xs text-[#ef4444]">{errorMessage}</p>
          )}

          <Button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Saving…' : 'Save Parameters'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
