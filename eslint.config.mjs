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
    // eslint-plugin-react 7.37.5 calls context.getFilename(), which ESLint 10 removed.
    // Its "detect" mode crashes because of that call, so set the React version explicitly.
    // Remove this block when eslint-plugin-react ships ESLint 10 support
    // (https://github.com/jsx-eslint/eslint-plugin-react/pull/4022).
    settings: {
      react: {
        version: '19.0',
      },
    },
  },
  {
    plugins: {
      '@sunker/is-compatible': sunkerIsCompatible,
    },

    rules: {
      '@sunker/is-compatible/import-exists': ['warn'],
    },
  },
]);
