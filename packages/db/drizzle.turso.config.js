import { defineConfig } from 'drizzle-kit'
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/schema/turso/**/*.ts',
  out: './drizzle/turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? '',
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
})
//# sourceMappingURL=drizzle.turso.config.js.map
