import { defineConfig } from 'drizzle-kit'
export default defineConfig({
  dialect: 'postgresql',
  schema: './dist/schema/neon/**/*.js',
  out: './drizzle/neon',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
})
//# sourceMappingURL=drizzle.neon.config.js.map
