import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/__tests__/**/*.test.ts', 'src/tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/lib/dexcom-mcp.ts',
        'src/lib/glucose-utils.ts',
        'src/app/api/glucose-range/route.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
      },
    },
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'server-only': path.resolve(__dirname, './vitest.server-only.ts'),
    },
  },
})
