import { HttpResponse, http } from 'msw'

export interface MockMemory {
  id: string
  summary: string
  insightType: string
  confidence: number | null
  createdAt: string | null
}

export const MOCK_MEMORIES_SAMPLE: MockMemory[] = [
  {
    id: 'mem-1',
    summary: 'Time in range improved this week.',
    insightType: 'weekly_summary',
    confidence: 0.8,
    createdAt: '2026-06-13T12:00:00.000Z',
  },
  {
    id: 'mem-2',
    summary: 'Parameter drift detected in morning readings.',
    insightType: 'drift_alert',
    confidence: 0.75,
    createdAt: '2026-06-12T12:00:00.000Z',
  },
]

export function memoryHandlerWithData(memories: MockMemory[]) {
  return http.get('*/api/memory', () => HttpResponse.json({ success: true, memories }))
}

export const memoryHandlers = [
  http.get('*/api/memory', () =>
    HttpResponse.json({ success: true, memories: MOCK_MEMORIES_SAMPLE }),
  ),
]
