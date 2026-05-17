import { Annotation, StateGraph } from '@langchain/langgraph'
import type { GlucoseReading } from '@t1pilot/types'

const OrchestratorState = Annotation.Root({
  readings: Annotation<GlucoseReading[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  summary: Annotation<string>({
    reducer: (_, next) => next,
    default: () => '',
  }),
})

export type OrchestratorStateType = typeof OrchestratorState.State

function analyzeNode(state: OrchestratorStateType): Partial<OrchestratorStateType> {
  const count = state.readings.length
  return { summary: `Analyzed ${String(count)} glucose reading(s).` }
}

export function buildOrchestrator() {
  const graph = new StateGraph(OrchestratorState)
    .addNode('analyze', analyzeNode)
    .addEdge('__start__', 'analyze')
    .addEdge('analyze', '__end__')

  return graph.compile()
}
