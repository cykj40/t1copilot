'use client'

import { useState } from 'react'
import { useLogContext } from '@/components/layout/ThreePanelLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type Tab = 'insulin' | 'carbs' | 'exercise'
type InsulinType = 'rapid' | 'long_acting' | 'correction'
type WhenMode = 'now' | 'earlier'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'insulin', label: 'Insulin', icon: '💉' },
  { id: 'carbs', label: 'Carbs', icon: '🍞' },
  { id: 'exercise', label: 'Exercise', icon: '🏃' },
]

const INSULIN_TYPES: { id: InsulinType; label: string }[] = [
  { id: 'rapid', label: 'Rapid' },
  { id: 'long_acting', label: 'Long' },
  { id: 'correction', label: 'Correction' },
]

export function EventLoggerForm() {
  const { submitLogMessage } = useLogContext()
  const [tab, setTab] = useState<Tab>('insulin')
  const [value, setValue] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [insulinType, setInsulinType] = useState<InsulinType>('rapid')
  const [foodDesc, setFoodDesc] = useState<string>('')
  const [exerciseType, setExerciseType] = useState<string>('')
  const [whenMode, setWhenMode] = useState<WhenMode>('now')
  const [customDate, setCustomDate] = useState<string>('')
  const [customTime, setCustomTime] = useState<string>('')
  const [durationMinutes, setDurationMinutes] = useState<number | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)

  const placeholders: Record<Tab, string> = {
    insulin: 'Units (e.g. 3)',
    carbs: 'Grams (e.g. 45)',
    exercise: 'Duration in min (e.g. 45)',
  }

  const units: Record<Tab, string> = {
    insulin: 'units',
    carbs: 'g',
    exercise: 'min',
  }

  function handleReset() {
    setValue('')
    setNotes('')
    setFoodDesc('')
    setExerciseType('')
    setWhenMode('now')
    setCustomDate('')
    setCustomTime('')
    setDurationMinutes(undefined)
  }

  function formatTimeForChat(iso: string): string {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function handleWhenModeChange(mode: WhenMode) {
    setWhenMode(mode)
    if (mode === 'earlier') {
      const now = new Date()
      setCustomDate(now.toISOString().split('T')[0] ?? '')
      setCustomTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      )
    }
  }

  function canSubmit(): boolean {
    if (tab === 'exercise') {
      return exerciseType.trim().length > 0
    }
    const numVal = Number(value)
    return numVal > 0
  }

  function handleSubmitToAgent() {
    if (submitting || !canSubmit()) return
    const numVal = Number(value)
    const isoTimestamp =
      whenMode === 'earlier' && customDate && customTime
        ? new Date(`${customDate}T${customTime}`).toISOString()
        : undefined
    const timeText = isoTimestamp ? ` at ${formatTimeForChat(isoTimestamp)}` : ''
    let message: string
    if (tab === 'insulin') {
      message = `Log ${String(numVal)}u ${insulinType} insulin${timeText}`
    } else if (tab === 'carbs') {
      message = `Log ${String(numVal)}g carbs${foodDesc ? ` — ${foodDesc}` : ''}${timeText}`
    } else {
      const durationText = durationMinutes !== undefined ? `${String(durationMinutes)} min ` : ''
      message = `Log ${durationText}${exerciseType}${timeText}`
    }
    setSubmitting(true)
    submitLogMessage(message)
    handleReset()
    setTimeout(() => setSubmitting(false), 2000)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Tab switcher */}
      <div className="flex rounded-lg border border-border bg-muted p-1 gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id)
              handleReset()
            }}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors"
            style={{
              backgroundColor: tab === t.id ? '#1a1a1e' : 'transparent',
              color: tab === t.id ? '#e5e5e5' : '#6b6b6b',
            }}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <Card className="bg-card border-border">
        <CardContent className="pt-4 pb-4 px-4">
          <div className="flex flex-col gap-3">
            {tab !== 'exercise' && (
              <div className="flex flex-col gap-1">
                <label htmlFor="log-value" className="text-xs text-muted-foreground">
                  Amount ({units[tab]})
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    id="log-value"
                    type="number"
                    min="0"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={placeholders[tab]}
                    className="flex-1 bg-muted border-border text-sm tabular-nums"
                  />
                  <span className="text-xs text-muted-foreground shrink-0">{units[tab]}</span>
                </div>
              </div>
            )}

            {tab === 'insulin' && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Insulin type</span>
                <div className="flex gap-1">
                  {INSULIN_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setInsulinType(t.id)}
                      className="flex-1 rounded-md py-1 text-[11px] font-medium transition-colors border"
                      style={{
                        backgroundColor: insulinType === t.id ? '#1a1a1e' : 'transparent',
                        borderColor: insulinType === t.id ? '#4a4a4e' : '#3a3a3e',
                        color: insulinType === t.id ? '#e5e5e5' : '#6b6b6b',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tab === 'carbs' && (
              <div className="flex flex-col gap-1">
                <label htmlFor="log-food" className="text-xs text-muted-foreground">
                  Food (optional)
                </label>
                <Input
                  id="log-food"
                  type="text"
                  value={foodDesc}
                  onChange={(e) => setFoodDesc(e.target.value)}
                  placeholder="e.g. pasta, apple juice"
                  className="bg-muted border-border text-sm"
                />
              </div>
            )}

            {tab === 'exercise' && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="log-activity" className="text-xs text-muted-foreground">
                    Activity
                  </label>
                  <Input
                    id="log-activity"
                    type="text"
                    value={exerciseType}
                    onChange={(e) => setExerciseType(e.target.value)}
                    placeholder="e.g. cycling, running"
                    className="bg-muted border-border text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="log-duration" className="text-xs text-muted-foreground">
                    Duration (min)
                  </label>
                  <Input
                    id="log-duration"
                    type="number"
                    min="1"
                    value={durationMinutes ?? ''}
                    onChange={(e) => {
                      const next = e.target.value
                      setDurationMinutes(next === '' ? undefined : Number(next))
                    }}
                    placeholder="e.g. 45"
                    className="bg-muted border-border text-sm tabular-nums"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground">When?</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleWhenModeChange('now')}
                  className="rounded-md py-1.5 text-xs font-medium transition-colors border"
                  style={{
                    backgroundColor: whenMode === 'now' ? '#1a1a1e' : 'transparent',
                    borderColor: whenMode === 'now' ? '#4a4a4e' : '#3a3a3e',
                    color: whenMode === 'now' ? '#e5e5e5' : '#6b6b6b',
                  }}
                >
                  Now
                </button>
                <button
                  type="button"
                  onClick={() => handleWhenModeChange('earlier')}
                  className="rounded-md py-1.5 text-xs font-medium transition-colors border"
                  style={{
                    backgroundColor: whenMode === 'earlier' ? '#1a1a1e' : 'transparent',
                    borderColor: whenMode === 'earlier' ? '#4a4a4e' : '#3a3a3e',
                    color: whenMode === 'earlier' ? '#e5e5e5' : '#6b6b6b',
                  }}
                >
                  Earlier
                </button>
              </div>
              {whenMode === 'earlier' && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="log-date" className="text-xs text-muted-foreground">
                      Date
                    </label>
                    <Input
                      id="log-date"
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="bg-muted border-border text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="log-time" className="text-xs text-muted-foreground">
                      Time
                    </label>
                    <Input
                      id="log-time"
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="bg-muted border-border text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="log-notes" className="text-xs text-muted-foreground">
                Notes (optional)
              </label>
              <Input
                id="log-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add a note…"
                className="bg-muted border-border text-sm"
              />
            </div>

            <p className="text-[10px] text-muted-foreground/60">
              ⚠️ Logging via the agent will show a confirmation card. All logs require your explicit
              approval.
            </p>

            <Button
              variant="outline"
              size="sm"
              disabled={submitting || !canSubmit()}
              className="w-full text-xs border-border hover:bg-accent"
              onClick={handleSubmitToAgent}
            >
              {submitting ? 'Sending…' : 'Use Agent to Log →'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
