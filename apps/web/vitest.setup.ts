import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './src/mocks/node.js'

// MSW intercepts MCP HTTP — token values are irrelevant in tests but required by the clients
process.env.ANTHROPIC_API_KEY ??= 'test-key'
process.env.OPENAI_API_KEY ??= 'test-openai-key'
process.env.SYSTEM_USER_ID ??= 'test-user-id'
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test'
process.env.DEXCOM_MCP_AUTH_TOKEN ??= 'test-token'
process.env.PELOTON_MCP_AUTH_TOKEN ??= 'test-token'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
