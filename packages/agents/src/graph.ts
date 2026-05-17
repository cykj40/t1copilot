import { END, MemorySaver, START, StateGraph } from '@langchain/langgraph'
import { config } from 'dotenv'
import { eventLoggerNode } from './agents/eventLogger.js'
import { exerciseAgentNode } from './agents/exercise.js'
import { glucoseAgentNode } from './agents/glucose.js'
import { insightAgentNode } from './agents/insight.js'
import { modelingAgentNode } from './agents/modeling.js'
import {
  orchestratorNode,
  routeFromExerciseAgent,
  routeFromGlucoseAgent,
  routeFromOrchestrator,
  unknownIntentNode,
} from './orchestrator.js'
import { T1CopilotAnnotation } from './state.js'

// Load .env before any LLM construction — must run before first graph.invoke()
config({ path: '../../.env' })

export type { T1CopilotState } from './state.js'

export function buildGraph() {
  const graph = new StateGraph(T1CopilotAnnotation)
    // ── Nodes ─────────────────────────────────────────────────────────────────
    .addNode('orchestrator', orchestratorNode)
    .addNode('unknownIntent', unknownIntentNode)
    .addNode('glucoseAgent', glucoseAgentNode)
    .addNode('exerciseAgent', exerciseAgentNode)
    .addNode('modelingAgent', modelingAgentNode)
    .addNode('eventLoggerAgent', eventLoggerNode)
    .addNode('insightAgent', insightAgentNode)

    // ── Entry ──────────────────────────────────────────────────────────────────
    .addEdge(START, 'orchestrator')

    // ── Orchestrator routes to specialist based on intent ──────────────────────
    .addConditionalEdges('orchestrator', routeFromOrchestrator, {
      glucoseAgent: 'glucoseAgent',
      exerciseAgent: 'exerciseAgent',
      modelingAgent: 'modelingAgent',
      eventLoggerAgent: 'eventLoggerAgent',
      insightAgent: 'insightAgent',
      unknownIntent: 'unknownIntent',
      [END]: END,
    })

    // ── Specialist terminal edges (default path) ───────────────────────────────
    // glucoseAgent → END (or exerciseAgent if multi_agent)
    .addConditionalEdges('glucoseAgent', routeFromGlucoseAgent, {
      exerciseAgent: 'exerciseAgent',
      [END]: END,
    })
    // exerciseAgent → END (or insightAgent if multi_agent)
    .addConditionalEdges('exerciseAgent', routeFromExerciseAgent, {
      insightAgent: 'insightAgent',
      [END]: END,
    })
    .addEdge('modelingAgent', END)
    .addEdge('eventLoggerAgent', END)
    .addEdge('insightAgent', END)
    .addEdge('unknownIntent', END)

  const checkpointer = new MemorySaver()
  return graph.compile({ checkpointer })
}

export type CompiledT1CopilotGraph = ReturnType<typeof buildGraph>
