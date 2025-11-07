import { defineConfig } from 'eslint/config';
import baseConfig from './.config/eslint.config.mjs';
import sunkerIsCompatible from '@sunker/eslint-plugin-is-compatible';

export default defineConfig([
  {
    ignores: [
      '**/logs',
      '**/*.log',
      '**/npm-debug.log*',
      '**/yarn-debug.log*',
      '**/yarn-error.log*',
      '**/.pnpm-debug.log*',
      '**/node_modules/',
      '**/pids',
      '**/*.pid',
      '**/*.seed',
      '**/*.pid.lock',
      '**/lib-cov',
      '**/coverage',
      '**/dist/',
      '**/artifacts/',
      '**/work/',
      '**/ci/',
      'test-results/',
      'playwright-report/',
      'blob-report/',
      'playwright/.cache/',
      'playwright/.auth/',
      '**/.idea',
      '**/.eslintcache',
      '**/.vscode',
    ],
  },
  ...baseConfig,
  {
    plugins: {
      '@sunker/is-compatible': sunkerIsCompatible,
    },

    rules: {
      '@sunker/is-compatible/import-exists': ['warn'],
    },
  },
]);
