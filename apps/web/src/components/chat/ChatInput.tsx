'use client'

import { ArrowUp } from 'lucide-react'
import type React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ChatInputProps {
  input: string
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  disabled?: boolean
}

export function ChatInput({ input, onInputChange, onSubmit, disabled = false }: ChatInputProps) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    onSubmit(e)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3">
      <Input
        value={input}
        onChange={onInputChange}
        placeholder="Ask about your glucose, workouts, or log an event…"
        disabled={disabled}
        className="flex-1 bg-card border-border text-sm placeholder:text-muted-foreground/60 focus-visible:ring-primary/40"
        autoFocus
      />
      <Button
        type="submit"
        size="icon"
        // biome-ignore lint/nursery/useNullishCoalescing: boolean union — ?? changes semantics
        disabled={disabled || input.trim().length === 0}
        className="h-9 w-9 shrink-0 bg-primary hover:bg-primary/90"
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
    </form>
  )
}
