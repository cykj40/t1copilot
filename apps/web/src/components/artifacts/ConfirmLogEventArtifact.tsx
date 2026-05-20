'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import type { ConfirmLogEventArtifact as ConfirmLogEventArtifactType } from '@/types/artifacts'

interface ConfirmLogEventArtifactProps {
  artifact: ConfirmLogEventArtifactType
}

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
  const [confirmed, setConfirmed] = useState(false)
  const [cancelled, setCancelled] = useState(false)

  if (cancelled) {
    return (
      <Card className="bg-[#111113] border-[#3a3a3e]">
        <CardContent className="pt-4 pb-4 px-4">
          <p className="text-xs text-[#6b6b6b] text-center">Event log cancelled.</p>
        </CardContent>
      </Card>
    )
  }

  if (confirmed) {
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

  return (
    <Card className="bg-[#1a1200] border-[#f59e0b]/30">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center gap-2">
          <span className="text-base">{EVENT_ICONS[artifact.eventType]}</span>
          <p className="text-sm font-medium text-[#f59e0b]">Confirm & Log</p>
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
          onClick={() => setConfirmed(true)}
          className="flex-1 rounded-md bg-[#f59e0b] px-3 py-2 text-xs font-semibold text-[#0d0d0f] transition-colors hover:bg-[#fbbf24] active:bg-[#d97706]"
        >
          Confirm &amp; Log
        </button>
        <button
          type="button"
          onClick={() => setCancelled(true)}
          className="rounded-md border border-[#3a3a3e] px-3 py-2 text-xs font-medium text-[#a3a3a3] transition-colors hover:bg-[#232326] hover:text-[#e5e5e5]"
        >
          Cancel
        </button>
      </CardFooter>
    </Card>
  )
}
