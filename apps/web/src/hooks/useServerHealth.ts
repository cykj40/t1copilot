'use client'

import { useEffect, useState } from 'react'
import { z } from 'zod'
import type { McpServerStatus } from '@/types/agents'

const POLL_INTERVAL_MS = 30_000

const healthResponseSchema = z.object({
  dexcom: z.enum(['connected', 'disconnected']),
  peloton: z.enum(['connected', 'disconnected']),
})

export interface ServerHealth {
  dexcom: McpServerStatus
  peloton: McpServerStatus
}

const DEFAULT_HEALTH: ServerHealth = {
  dexcom: 'disconnected',
  peloton: 'disconnected',
}

export function useServerHealth(): ServerHealth {
  const [health, setHealth] = useState<ServerHealth>(DEFAULT_HEALTH)

  useEffect(() => {
    let cancelled = false

    async function fetchHealth(): Promise<void> {
      try {
        const response = await fetch('/api/health', { cache: 'no-store' })
        if (!response.ok) return

        const parsed = healthResponseSchema.safeParse(await response.json())
        if (!cancelled && parsed.success) {
          setHealth(parsed.data)
        }
      } catch {
        // Keep last known status on transient failures.
      }
    }

    void fetchHealth()
    const intervalId = setInterval(() => {
      void fetchHealth()
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [])

  return health
}
