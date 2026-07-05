import { geminiResearchHandlers } from '@/mocks/handlers/gemini-research'
import { memoryHandlers } from '@/mocks/handlers/memory'
import { server } from '@/mocks/node'

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is missing — add it to .env.local at the repo root.')
}
if (!process.env.BRAINTRUST_API_KEY) {
  throw new Error('BRAINTRUST_API_KEY is missing — add it to .env.local at the repo root.')
}

// Same stub pattern as vitest.setup.ts — tokens are irrelevant behind MSW
// but required by the clients. ANTHROPIC_API_KEY and BRAINTRUST_API_KEY are
// NOT stubbed: they must be real (from .env.local via dotenv-cli).
process.env.OPENAI_API_KEY ??= 'test-openai-key'
process.env.SYSTEM_USER_ID ??= 'test-user-id'
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test'
process.env.DEXCOM_MCP_AUTH_TOKEN ??= 'test-token'
process.env.PELOTON_MCP_AUTH_TOKEN ??= 'test-token'
process.env.GEMINI_API_KEY ??= 'test-gemini-key'

// bypass, not error: api.anthropic.com and api.braintrust.dev are real calls.
// MCP + Gemini + memory traffic is intercepted by the handlers.
server.listen({ onUnhandledRequest: 'bypass' })
server.use(...geminiResearchHandlers, ...memoryHandlers)

/** Restore MSW handlers after per-case overrides (e.g. safety fixtures). */
export function resetEvalHandlers(): void {
  server.resetHandlers()
  server.use(...geminiResearchHandlers, ...memoryHandlers)
}

export { server }
