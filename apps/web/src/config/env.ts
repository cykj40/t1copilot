import { z } from 'zod'

const envSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1),
  DEXCOM_MCP_SERVER_URL: z.string().url().default('https://dexcom-mcp-server.fly.dev'),
  PELOTON_MCP_SERVER_URL: z.string().url().default('https://peloton-mcp-server.fly.dev'),
  DEXCOM_MCP_AUTH_TOKEN: z.string().min(1).optional(),
  PELOTON_MCP_AUTH_TOKEN: z.string().min(1).optional(),
  DATABASE_URL: z.string().url().optional(),
})

// Throws at startup if required env vars are missing
export const env = envSchema.parse(process.env)
