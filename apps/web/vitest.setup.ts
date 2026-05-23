import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './src/mocks/node.js'

// MSW intercepts MCP HTTP — token value is irrelevant in tests but required by the client
process.env.DEXCOM_MCP_AUTH_TOKEN ??= 'test-token'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
