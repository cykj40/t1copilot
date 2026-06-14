import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './src/__tests__/server.js'

// MSW intercepts MCP HTTP — token value is irrelevant in tests but required by the client
process.env.PELOTON_MCP_AUTH_TOKEN ??= 'test-token'
process.env.GEMINI_API_KEY ??= 'test-gemini-key'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
