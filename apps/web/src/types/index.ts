export type { ArtifactData, T1Tools, T1UIMessage } from './artifacts'

export interface GlucoseZoneColors {
  text: string
  badge: string
  label: string
}

export interface EventLogEntry {
  id: string
  type: 'insulin' | 'carbs' | 'exercise'
  description: string
  minutesAgo: number
}
