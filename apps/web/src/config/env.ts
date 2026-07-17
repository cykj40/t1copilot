import { z } from 'zod'

function isIanaTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: value })
    return true
  } catch (error) {
    return !(error instanceof RangeError)
  }
}

const envSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  DEXCOM_MCP_SERVER_URL: z.string().url().default('https://dexcom-mcp-server.fly.dev'),
  PELOTON_MCP_SERVER_URL: z.string().url().default('https://peloton-mcp-server.fly.dev'),
  DEXCOM_MCP_AUTH_TOKEN: z.string().min(1).optional(),
  PELOTON_MCP_AUTH_TOKEN: z.string().min(1).optional(),
  DATABASE_URL: z.string().url().optional(),
  SYSTEM_USER_ID: z.string().min(1).optional(),
  USER_TIMEZONE: z.string().min(1).refine(isIanaTimeZone, {
    message: 'USER_TIMEZONE must be a valid IANA timezone, e.g. America/New_York',
  }),
})

// Throws at startup if required env vars are missing
export const env = envSchema.parse(process.env)
