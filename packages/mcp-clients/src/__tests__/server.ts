import { setupServer } from 'msw/node'
import { pelotonHandlers } from './peloton.handlers.js'

export const server = setupServer(...pelotonHandlers)
