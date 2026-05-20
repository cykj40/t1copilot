'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { RenderDoctorChecklistArtifact } from '@/types/artifacts'

interface DoctorChecklistArtifactProps {
  artifact: RenderDoctorChecklistArtifact
}

const CHECKLIST_ITEMS = [
  { id: 'c1', category: 'Data', label: 'Download last 90 days of CGM data' },
  { id: 'c2', category: 'Data', label: 'Export Peloton workout history' },
  { id: 'c3', category: 'Questions', label: 'Review post-exercise lows pattern' },
  { id: 'c4', category: 'Questions', label: 'Morning fasting glucose trend (+12 mg/dL)' },
  { id: 'c5', category: 'Questions', label: 'ISF adjustment discussion' },
  { id: 'c6', category: 'Supplies', label: 'Check CGM sensor stock' },
  { id: 'c7', category: 'Supplies', label: 'Insulin prescription renewal' },
  { id: 'c8', category: 'Labs', label: 'Request HbA1c if not recent' },
]

export function DoctorChecklistArtifact({ artifact }: DoctorChecklistArtifactProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const completedCount = checked.size
  const totalCount = CHECKLIST_ITEMS.length
  const categories = [...new Set(CHECKLIST_ITEMS.map((i) => i.category))]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[#a3a3a3]">Endo Appointment Prep</p>
        {artifact.appointmentDate !== undefined && (
          <span className="text-[10px] text-[#6b6b6b]">{artifact.appointmentDate}</span>
        )}
      </div>

      {/* Progress */}
      <Card className="bg-[#111113] border-[#232326]">
        <CardContent className="pt-3 pb-3 px-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-[#a3a3a3]">Progress</p>
            <span className="text-xs font-medium text-[#e5e5e5]">
              {String(completedCount)}/{String(totalCount)}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#232326] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#7c3aed] transition-all"
              style={{ width: `${String(Math.round((completedCount / totalCount) * 100))}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Checklist by category */}
      {categories.map((category) => (
        <Card key={category} className="bg-[#111113] border-[#232326]">
          <CardHeader className="pb-1 pt-3 px-4">
            <p className="text-[10px] font-medium text-[#6b6b6b] uppercase tracking-wider">
              {category}
            </p>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <ul className="flex flex-col gap-2">
              {CHECKLIST_ITEMS.filter((i) => i.category === category).map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => toggle(item.id)}
                    className="flex w-full items-center gap-2.5 text-left"
                  >
                    <span
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors"
                      style={{
                        borderColor: checked.has(item.id) ? '#7c3aed' : '#3a3a3e',
                        backgroundColor: checked.has(item.id) ? '#7c3aed' : 'transparent',
                      }}
                    >
                      {checked.has(item.id) && (
                        <svg
                          width="10"
                          height="8"
                          viewBox="0 0 10 8"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M1 4L3.5 6.5L9 1"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span
                      className="text-xs leading-snug"
                      style={{ color: checked.has(item.id) ? '#6b6b6b' : '#a3a3a3' }}
                    >
                      {item.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
