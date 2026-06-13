'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, getToolName, isToolUIPart } from 'ai'
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { MedicalDisclaimer } from '@/components/shared/MedicalDisclaimer'
import { ScrollArea } from '@/components/ui/scroll-area'
import { loadPersistedMessages, persistMessages } from '@/hooks/useMessagePersistence'
import type {
  ArtifactData,
  GlucoseChartReading,
  GlucoseChartStatistics,
  RenderBaselineParametersArtifact,
  RenderInsightSummaryArtifact,
  RenderPredictionArtifact,
  T1UIMessage,
} from '@/types/artifacts'
import { ChatInput } from './ChatInput'
import { ChatMessage } from './ChatMessage'

const SUGGESTED_PROMPTS = [
  "What's my glucose trend today?",
  "How did yesterday's ride affect my levels?",
  'Give me a weekly summary',
  'Log 3 units rapid insulin',
]

export interface AgentChatHandle {
  sendMessage: (text: string) => void
}

interface AgentChatProps {
  onArtifact: (artifact: ArtifactData) => void
  onClearArtifact: () => void
  conversationId: string | null
  onFirstMessage: (text: string) => string
  onMessagesChange: (id: string, count: number) => void
}

function toolResultToArtifact(
  toolName: string,
  input: unknown,
  output: unknown,
): ArtifactData | null {
  const inp = input as Record<string, unknown>
  const out = output as Record<string, unknown> | null | undefined
  switch (toolName) {
    case 'render_glucose_chart':
      return {
        artifactType: 'render_glucose_chart',
        timeRange:
          (out?.timeRange as string | undefined) ?? (inp.timeRange as string | undefined) ?? '24h',
        title:
          (out?.title as string | undefined) ??
          (inp.title as string | undefined) ??
          'Glucose Trend',
        ...(Array.isArray(out?.readings)
          ? { readings: out.readings as GlucoseChartReading[] }
          : {}),
        ...(out?.statistics !== null && out?.statistics !== undefined
          ? { statistics: out.statistics as GlucoseChartStatistics }
          : {}),
      }
    case 'render_workout_correlation':
      return {
        artifactType: 'render_workout_correlation',
        workoutId:
          (out?.workoutId as string | undefined) ??
          (inp.workoutId as string | undefined) ??
          'latest',
        workoutName:
          (out?.workoutName as string | undefined) ??
          (inp.workoutName as string | undefined) ??
          'Last Workout',
      }
    case 'render_weekly_summary':
      return {
        artifactType: 'render_weekly_summary',
        weekLabel:
          (out?.weekLabel as string | undefined) ??
          (inp.weekLabel as string | undefined) ??
          'This Week',
      }
    case 'render_doctor_checklist': {
      const apptDate =
        (out?.appointmentDate as string | undefined) ?? (inp.appointmentDate as string | undefined)
      return {
        artifactType: 'render_doctor_checklist',
        ...(typeof apptDate === 'string' ? { appointmentDate: apptDate } : {}),
      }
    }
    case 'confirm_log_event': {
      const eventType =
        (out?.eventType as 'insulin' | 'carbs' | 'exercise' | undefined) ??
        (inp.eventType as 'insulin' | 'carbs' | 'exercise' | undefined)
      if (!eventType) return null
      const noteVal = (out?.notes as string | undefined) ?? (inp.notes as string | undefined)
      const subtypeVal = (out?.subtype as string | undefined) ?? (inp.subtype as string | undefined)
      const foodDescVal =
        (out?.food_description as string | undefined) ??
        (inp.food_description as string | undefined)
      const timestampVal =
        (out?.timestamp as string | undefined) ?? (inp.timestamp as string | undefined)
      const durationMinutesVal =
        (out?.duration_minutes as number | undefined) ??
        (inp.duration_minutes as number | undefined)
      return {
        artifactType: 'confirm_log_event',
        eventType,
        value: (out?.value as number | undefined) ?? (inp.value as number | undefined) ?? 0,
        unit: (out?.unit as string | undefined) ?? (inp.unit as string | undefined) ?? '',
        ...(typeof noteVal === 'string' ? { notes: noteVal } : {}),
        ...(typeof subtypeVal === 'string' ? { subtype: subtypeVal } : {}),
        ...(typeof foodDescVal === 'string' ? { food_description: foodDescVal } : {}),
        ...(typeof timestampVal === 'string' ? { timestamp: timestampVal } : {}),
        ...(typeof durationMinutesVal === 'number' ? { duration_minutes: durationMinutesVal } : {}),
      }
    }
    case 'render_markdown_doc':
      return {
        artifactType: 'render_markdown_doc',
        title:
          (out?.title as string | undefined) ?? (inp.title as string | undefined) ?? 'Document',
        content: (out?.content as string | undefined) ?? (inp.content as string | undefined) ?? '',
      }
    case 'render_html_report':
      return {
        artifactType: 'render_html_report',
        title: (out?.title as string | undefined) ?? (inp.title as string | undefined) ?? 'Report',
        html: (out?.html as string | undefined) ?? (inp.html as string | undefined) ?? '',
      }
    case 'render_prediction': {
      if (out?.requiresSetup === true) {
        return { artifactType: 'render_baseline_setup' }
      }
      const predictionResult = out?.predictionResult
      const actionType =
        (out?.actionType as 'insulin' | 'carbs' | 'both' | undefined) ??
        (inp.action_type as 'insulin' | 'carbs' | 'both' | undefined)
      const disclaimer = out?.disclaimer as string | undefined
      if (!predictionResult || !actionType || !disclaimer) return null
      return {
        artifactType: 'render_prediction',
        predictionResult: predictionResult as RenderPredictionArtifact['predictionResult'],
        actionType,
        disclaimer,
      }
    }
    case 'render_baseline_parameters': {
      const parameters = out?.parameters
      if (!parameters) return null
      return {
        artifactType: 'render_baseline_parameters',
        parameters: parameters as RenderBaselineParametersArtifact['parameters'],
      }
    }
    case 'render_insight_summary': {
      const weekLabel =
        (out?.weekLabel as string | undefined) ??
        (inp.weekLabel as string | undefined) ??
        'This Week'
      const insightArtifact: RenderInsightSummaryArtifact = {
        artifactType: 'render_insight_summary',
        weekLabel,
      }
      if (out?.trends !== undefined) {
        insightArtifact.trends = out.trends as NonNullable<RenderInsightSummaryArtifact['trends']>
      }
      if (out?.drift !== undefined) {
        insightArtifact.drift = out.drift as NonNullable<RenderInsightSummaryArtifact['drift']>
      }
      if (out?.adaptiveInsights !== undefined) {
        insightArtifact.adaptiveInsights = out.adaptiveInsights as NonNullable<
          RenderInsightSummaryArtifact['adaptiveInsights']
        >
      }
      if (typeof out?.disciplineInsights === 'string') {
        insightArtifact.disciplineInsights = out.disciplineInsights
      }
      if (typeof out?.hypoRisk === 'string') {
        insightArtifact.hypoRisk = out.hypoRisk
      }
      if (out?.eventTimeline !== undefined && out.eventTimeline !== null) {
        insightArtifact.eventTimeline = out.eventTimeline as NonNullable<
          RenderInsightSummaryArtifact['eventTimeline']
        >
      }
      return insightArtifact
    }
    default:
      return null
  }
}

export const AgentChat = forwardRef<AgentChatHandle, AgentChatProps>(function AgentChat(
  { onArtifact, onClearArtifact, conversationId, onFirstMessage, onMessagesChange },
  ref,
) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const submitInFlightRef = useRef(false)
  const conversationIdRef = useRef<string | null>(conversationId)
  const sentToolCallIds = useRef<Set<string>>(new Set())
  const [initialMessages] = useState<T1UIMessage[]>(() =>
    conversationId !== null ? loadPersistedMessages(conversationId) : [],
  )
  const [input, setInput] = useState('')
  const [hasSent, setHasSent] = useState(initialMessages.length > 0)

  const transport = useMemo(
    () =>
      new DefaultChatTransport<T1UIMessage>({
        api: '/api/chat',
      }),
    [],
  )

  const {
    messages,
    sendMessage: chatSendMessage,
    status,
  } = useChat<T1UIMessage>({
    transport,
    messages: initialMessages,
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  function doSendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isLoading || submitInFlightRef.current) return
    submitInFlightRef.current = true
    let activeId = conversationIdRef.current
    if (activeId === null) {
      activeId = onFirstMessage(trimmed)
      conversationIdRef.current = activeId
    }
    setHasSent(true)
    onClearArtifact()
    sentToolCallIds.current = new Set()
    chatSendMessage({
      role: 'user',
      parts: [{ type: 'text', text: trimmed }],
    })
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: chatSendMessage, onFirstMessage, and onClearArtifact are stable
  useImperativeHandle(ref, () => ({ sendMessage: doSendMessage }), [isLoading])

  useEffect(() => {
    conversationIdRef.current = conversationId
  }, [conversationId])

  // Detect completed tool invocations and push to right panel
  // biome-ignore lint/correctness/useExhaustiveDependencies: onArtifact is stable
  useEffect(() => {
    for (const msg of messages) {
      if (msg.role !== 'assistant') continue
      for (const part of msg.parts) {
        if (!isToolUIPart(part)) continue
        if (!('state' in part) || part.state !== 'output-available') continue

        const callId = 'toolCallId' in part ? (part.toolCallId as string) : null
        if (callId === null || sentToolCallIds.current.has(callId)) continue

        const name = getToolName(part)
        const inputData = 'input' in part ? part.input : undefined
        const outputData = 'output' in part ? part.output : undefined

        if (outputData === undefined || outputData === null) continue

        const artifact = toolResultToArtifact(name, inputData, outputData)
        if (artifact !== null && artifact !== undefined) {
          sentToolCallIds.current.add(callId)
          onArtifact(artifact)
        }
      }
    }
  }, [messages])

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new message arrival
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!isLoading) submitInFlightRef.current = false
  }, [isLoading])

  // biome-ignore lint/correctness/useExhaustiveDependencies: persist on message change
  useEffect(() => {
    if (conversationIdRef.current === null) return
    persistMessages(conversationIdRef.current, messages)
    onMessagesChange(conversationIdRef.current, messages.length)
  }, [messages])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    e.stopPropagation()
    doSendMessage(input)
    setInput('')
  }

  function handleSuggestedPrompt(prompt: string) {
    setInput(prompt)
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex h-10 items-center border-b border-border px-4 shrink-0">
        <span className="text-xs font-medium text-muted-foreground">Agent Chat</span>
        <span
          className={`ml-auto inline-flex items-center gap-1.5 text-[10px] ${isLoading ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${isLoading ? 'bg-primary animate-pulse' : 'bg-muted-foreground'}`}
          />
          {isLoading ? 'Thinking…' : 'Ready'}
        </span>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0 px-4">
        <div className="flex flex-col gap-4 py-4">
          {messages.length === 0 && !hasSent ? (
            <EmptyState onSelectPrompt={handleSuggestedPrompt} />
          ) : (
            messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="shrink-0 border-t border-border">
        <ChatInput
          input={input}
          onInputChange={(e) => setInput(e.target.value)}
          onSubmit={handleSubmit}
          disabled={isLoading}
        />
        <MedicalDisclaimer />
      </div>
    </div>
  )
})

function EmptyState({ onSelectPrompt }: { onSelectPrompt: (p: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
        <span className="text-xl font-bold text-primary">T1</span>
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">T1Copilot</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Ask about your glucose, workouts, or log an event
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSelectPrompt(prompt)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-left text-xs text-muted-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-foreground transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}
