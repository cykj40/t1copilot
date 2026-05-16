// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="node" />

import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: '../../.env' })

declare const process: {
  env: Record<string, string | undefined>
}

const url = process.env['DATABASE_URL'] ?? ''

export default defineConfig({
  dialect: 'postgresql',
  schema: './dist/schema/neon/**/*.js',
  out: './drizzle/neon',
  dbCredentials: {
    url,
  },
})
