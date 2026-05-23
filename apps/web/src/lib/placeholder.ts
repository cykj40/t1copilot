export const PLACEHOLDER_LAST_WORKOUT = {
  name: 'Cycling',
  durationMinutes: 45,
  hoursAgo: 2,
  glucoseDropMgdl: 28,
  hypoRisk: 'moderate' as const,
}

export const PLACEHOLDER_RECENT_EVENTS = [
  {
    id: 'e1',
    type: 'insulin' as const,
    description: '3u rapid',
    minutesAgo: 45,
  },
  {
    id: 'e2',
    type: 'carbs' as const,
    description: '32g',
    minutesAgo: 60,
  },
]

export const PLACEHOLDER_BASELINE = {
  isf: 40,
  icr: 10,
  basalUnitsPerDay: 18,
}
