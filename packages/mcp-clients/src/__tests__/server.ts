import { setupServer } from 'msw/node'
import { geminiResearchHandlers } from './gemini-research.handlers.js'
import { pelotonHandlers } from './peloton.handlers.js'

export const server = setupServer(...pelotonHandlers, ...geminiResearchHandlers)
