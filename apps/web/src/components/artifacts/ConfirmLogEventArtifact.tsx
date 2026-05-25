'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import type { ConfirmLogEventArtifact as ConfirmLogEventArtifactType } from '@/types/artifacts'

interface ConfirmLogEventArtifactProps {
  artifact: ConfirmLogEventArtifactType
}

type Status = 'pending' | 'loading' | 'confirmed' | 'error' | 'cancelled'

const EVENT_ICONS: Record<string, string> = {
  insulin: '💉',
  carbs: '🍞',
  exercise: '🏃',
}

const EVENT_LABELS: Record<string, string> = {
  insulin: 'Insulin Dose',
  carbs: 'Carb Intake',
  exercise: 'Exercise Session',
}

export function ConfirmLogEventArtifact({ artifact }: ConfirmLogEventArtifactProps) {
  const [status, setStatus] = useState<Status>('pending')
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()

  async function handleConfirm() {
    setStatus('loading')
    try {
      const res = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: artifact.eventType,
          value: artifact.value,
          unit: artifact.unit,
          subtype: artifact.subtype,
          food_description: artifact.food_description,
          notes: artifact.notes,
        }),
      })
      const data = (await res.json()) as {
        success: string | boolean
        message?: string
        error?: string
      }
      if (!res.ok || data.success === false) {
        setErrorMessage(data.error ?? 'Unknown error')
        setStatus('error')
        return
      }
      setStatus('confirmed')
      router.refresh()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Network error')
      setStatus('error')
    }
  }

  if (status === 'cancelled') {
    return (
      <Card className="bg-[#111113] border-[#3a3a3e]">
        <CardContent className="pt-4 pb-4 px-4">
          <p className="text-xs text-[#6b6b6b] text-center">Event log cancelled.</p>
        </CardContent>
      </Card>
    )
  }

  if (status === 'confirmed') {
    return (
      <Card className="bg-[#0d1f14] border-[#22c55e]/30">
        <CardContent className="pt-4 pb-4 px-4">
          <div className="flex items-center gap-2">
            <span className="text-[#22c55e]">✓</span>
            <p className="text-xs font-medium text-[#22c55e]">Logged successfully</p>
          </div>
          <p className="mt-1 text-xs text-[#a3a3a3]">
            {EVENT_LABELS[artifact.eventType]}: {String(artifact.value)} {artifact.unit}
            {artifact.notes !== undefined ? ` — ${artifact.notes}` : ''}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (status === 'error') {
    return (
      <Card className="bg-[#1f0d0d] border-[#ef4444]/30">
        <CardContent className="pt-4 pb-4 px-4">
          <div className="flex items-center gap-2">
            <span className="text-[#ef4444]">✗</span>
            <p className="text-xs font-medium text-[#ef4444]">Logging failed</p>
          </div>
          <p className="mt-1 text-xs text-[#a3a3a3]">{errorMessage}</p>
        </CardContent>
        <CardFooter className="px-4 pb-4 pt-1">
          <button
            type="button"
            onClick={() => setStatus('pending')}
            className="w-full rounded-md border border-[#3a3a3e] px-3 py-2 text-xs font-medium text-[#a3a3a3] transition-colors hover:bg-[#232326] hover:text-[#e5e5e5]"
          >
            Try again
          </button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="bg-[#1a1200] border-[#f59e0b]/30">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center gap-2">
          <span className="text-base">{EVENT_ICONS[artifact.eventType]}</span>
          <p className="text-sm font-medium text-[#f59e0b]">Confirm &amp; Log</p>
        </div>
        <p className="text-[11px] text-[#a3a3a3] mt-0.5">
          Review this event before it is logged. You must explicitly confirm.
        </p>
      </CardHeader>

      <CardContent className="px-4 pb-2">
        <div className="rounded-md bg-[#232320] border border-[#3a3a2e] p-3">
          <dl className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <dt className="text-xs text-[#6b6b6b]">Type</dt>
              <dd className="text-xs font-medium text-[#e5e5e5] capitalize">
                {EVENT_LABELS[artifact.eventType]}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-xs text-[#6b6b6b]">Amount</dt>
              <dd className="text-xs font-bold text-[#e5e5e5] tabular-nums">
                {String(artifact.value)} {artifact.unit}
              </dd>
            </div>
            {artifact.subtype !== undefined && (
              <div className="flex justify-between">
                <dt className="text-xs text-[#6b6b6b]">Subtype</dt>
                <dd className="text-xs text-[#a3a3a3]">{artifact.subtype}</dd>
              </div>
            )}
            {artifact.food_description !== undefined && (
              <div className="flex justify-between">
                <dt className="text-xs text-[#6b6b6b]">Food</dt>
                <dd className="text-xs text-[#a3a3a3]">{artifact.food_description}</dd>
              </div>
            )}
            {artifact.notes !== undefined && (
              <div className="flex justify-between">
                <dt className="text-xs text-[#6b6b6b]">Notes</dt>
                <dd className="text-xs text-[#a3a3a3]">{artifact.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        <p className="mt-2 text-[10px] text-[#6b6b6b]">
          ⚠️ T1Copilot does not auto-log medical events. This action requires your explicit
          confirmation.
        </p>
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-1 flex gap-2">
        <button
          type="button"
          onClick={() => {
            void handleConfirm()
          }}
          disabled={status === 'loading'}
          className="flex-1 rounded-md bg-[#f59e0b] px-3 py-2 text-xs font-semibold text-[#0d0d0f] transition-colors hover:bg-[#fbbf24] active:bg-[#d97706] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? 'Logging…' : 'Confirm & Log'}
        </button>
        <button
          type="button"
          onClick={() => setStatus('cancelled')}
          disabled={status === 'loading'}
          className="rounded-md border border-[#3a3a3e] px-3 py-2 text-xs font-medium text-[#a3a3a3] transition-colors hover:bg-[#232326] hover:text-[#e5e5e5] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </CardFooter>
    </Card>
  )
}
