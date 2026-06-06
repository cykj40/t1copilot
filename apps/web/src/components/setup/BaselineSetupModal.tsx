'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type SetupStatus = 'form' | 'loading' | 'success' | 'error'

interface FieldErrors {
  isf?: string
  icr?: string
  basal?: string
}

function validateField(value: string): string | undefined {
  const num = Number(value)
  if (!value.trim() || Number.isNaN(num) || num <= 0) {
    return 'Enter a positive number'
  }
  return undefined
}

export function BaselineSetupModal() {
  const [isf, setIsf] = useState('')
  const [icr, setIcr] = useState('')
  const [basal, setBasal] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState('')
  const [status, setStatus] = useState<SetupStatus>('form')

  const allFilled = isf.trim() !== '' && icr.trim() !== '' && basal.trim() !== ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errors: FieldErrors = {}
    const isfError = validateField(isf)
    const icrError = validateField(icr)
    const basalError = validateField(basal)
    if (isfError) errors.isf = isfError
    if (icrError) errors.icr = icrError
    if (basalError) errors.basal = basalError
    setFieldErrors(errors)
    if (isfError || icrError || basalError) return

    setStatus('loading')
    setApiError('')

    try {
      const res = await fetch('/api/baseline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correction_factor: Number(isf),
          insulin_to_carb_ratio: Number(icr),
          basal_dose: Number(basal),
        }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setApiError(data.error ?? 'Failed to save parameters')
        setStatus('error')
        return
      }

      setStatus('success')
    } catch {
      setApiError('Failed to save parameters')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <Card className="bg-[#111113] border-[#232326]">
        <CardContent className="px-4 py-6">
          <p className="text-sm font-medium text-[#22c55e]">Parameters saved</p>
          <p className="text-xs text-muted-foreground mt-2">
            Ask me for a prediction now — I can run glucose impact estimates using your personal
            values.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#111113] border-[#232326]">
      <CardHeader className="pb-2 pt-3 px-4">
        <p className="text-xs font-medium text-foreground">Baseline parameters required</p>
        <p className="text-[10px] text-muted-foreground mt-1">
          To predict glucose impact, I need your personal correction factor (ISF) and
          insulin-to-carb ratio. These are unique to you — using default values would give you
          inaccurate results.
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label htmlFor="setup-isf" className="text-xs font-medium text-foreground">
              Correction factor (ISF)
            </label>
            <p className="text-[10px] text-muted-foreground mb-1">
              How many mg/dL does 1 unit of rapid insulin lower your glucose?
            </p>
            <Input
              id="setup-isf"
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 30"
              value={isf}
              onChange={(e) => setIsf(e.target.value)}
              className="bg-[#0a0a0b] border-[#232326]"
            />
            {fieldErrors.isf && (
              <p className="text-[10px] text-[#ef4444] mt-1">{fieldErrors.isf}</p>
            )}
          </div>

          <div>
            <label htmlFor="setup-icr" className="text-xs font-medium text-foreground">
              Insulin-to-carb ratio (ICR)
            </label>
            <p className="text-[10px] text-muted-foreground mb-1">
              How many grams of carbs does 1 unit of insulin cover?
            </p>
            <Input
              id="setup-icr"
              type="number"
              min="1"
              step="0.5"
              placeholder="e.g. 4"
              value={icr}
              onChange={(e) => setIcr(e.target.value)}
              className="bg-[#0a0a0b] border-[#232326]"
            />
            {fieldErrors.icr && (
              <p className="text-[10px] text-[#ef4444] mt-1">{fieldErrors.icr}</p>
            )}
          </div>

          <div>
            <label htmlFor="setup-basal" className="text-xs font-medium text-foreground">
              Basal dose
            </label>
            <p className="text-[10px] text-muted-foreground mb-1">
              How many units of long-acting insulin do you take daily?
            </p>
            <Input
              id="setup-basal"
              type="number"
              min="1"
              step="0.5"
              placeholder="e.g. 30"
              value={basal}
              onChange={(e) => setBasal(e.target.value)}
              className="bg-[#0a0a0b] border-[#232326]"
            />
            {fieldErrors.basal && (
              <p className="text-[10px] text-[#ef4444] mt-1">{fieldErrors.basal}</p>
            )}
          </div>

          {apiError && <p className="text-[10px] text-[#ef4444]">{apiError}</p>}

          <Button type="submit" disabled={!allFilled || status === 'loading'} className="w-full">
            {status === 'loading' ? 'Saving…' : 'Save parameters'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
