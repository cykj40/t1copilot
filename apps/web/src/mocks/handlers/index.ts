import { dexcomHandlers } from './dexcom.js'
import { pelotonHandlers } from './peloton.js'

export const handlers = [...dexcomHandlers, ...pelotonHandlers]
