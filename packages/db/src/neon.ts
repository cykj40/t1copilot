import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

export * from './schema/neon/index.js'

function getNeonSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  return neon(url)
}

export function getNeonDb() {
  return drizzle(getNeonSql())
}

export type NeonDb = ReturnType<typeof getNeonDb>
