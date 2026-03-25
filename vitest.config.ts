import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['server/**/*.test.ts', 'lib/**/*.test.ts'],
    exclude: ['node_modules', 'server_dist', 'static-build'],
    coverage: {
      provider: 'v8',
      include: ['server/**/*.ts', 'lib/**/*.ts'],
      exclude: [
        'server/replit_integrations/**',
        'server/templates/**',
        '**/*.test.ts',
        '**/index.ts',
      ],
      thresholds: {
        branches: 80,
      },
    },
    testTimeout: 10000,
  },
});
