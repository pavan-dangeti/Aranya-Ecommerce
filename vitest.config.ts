import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'server',
          include: ['server/tests/**/*.test.ts'],
          environment: 'node',
          globalSetup: ['./server/tests/global-setup.ts'],
          setupFiles: ['./server/tests/setup.ts'],
          pool: 'forks',
          testTimeout: 30_000,
          hookTimeout: 60_000,
          // Every test truncates and reseeds one shared database.
          fileParallelism: false,
        },
      },
      {
        resolve: { alias: { '@': path.resolve(import.meta.dirname, 'web/src') } },
        test: {
          name: 'web',
          include: ['web/tests/**/*.test.ts'],
          environment: 'node',
        },
      },
    ],
  },
})
