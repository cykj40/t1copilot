/// <reference types="node" />

import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: '../../.env' })

declare const process: {
  env: Record<string, string | undefined>
}

const url = process.env['TURSO_DATABASE_URL'] ?? ''
const authToken = process.env['TURSO_AUTH_TOKEN']

export default defineConfig({
  dialect: 'turso',
  schema: './src/schema/turso/**/*.ts',
  out: './drizzle/turso',
  dbCredentials: {
    url,
    authToken,
  },
})
