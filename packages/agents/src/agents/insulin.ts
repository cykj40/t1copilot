import type { InsulinEvent } from '@t1copilot/types'

export interface InsulinSummary {
  totalUnits: number
  rapidUnits: number
  longUnits: number
  eventCount: number
}

export function summarizeInsulin(events: InsulinEvent[]): InsulinSummary {
  let rapidUnits = 0
  let longUnits = 0

  for (const event of events) {
    if (event.insulinType === 'rapid') {
      rapidUnits += event.units
    } else {
      longUnits += event.units
    }
  }

  return {
    totalUnits: rapidUnits + longUnits,
    rapidUnits,
    longUnits,
    eventCount: events.length,
  }
}
