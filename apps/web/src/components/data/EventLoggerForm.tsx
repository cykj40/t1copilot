'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type Tab = 'insulin' | 'carbs' | 'exercise'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'insulin', label: 'Insulin', icon: '💉' },
  { id: 'carbs', label: 'Carbs', icon: '🍞' },
  { id: 'exercise', label: 'Exercise', icon: '🏃' },
]

export function EventLoggerForm() {
  const [tab, setTab] = useState<Tab>('insulin')
  const [value, setValue] = useState('')
  const [notes, setNotes] = useState('')

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
              disabled={value === '' || Number(value) <= 0}
              className="w-full text-xs border-border hover:bg-accent"
              onClick={handleReset}
            >
              Use Agent to Log →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
