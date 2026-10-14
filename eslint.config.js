// Shared ESLint config for the whole repository (client and server).
import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['**/dist', '**/node_modules', '**/coverage']),

  // Every TypeScript file
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
  },

  // React client (browser)
  {
    files: ['client/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: { globals: globals.browser },
  },

  // Express server and config files (Node.js)
  {
    files: ['server/**/*.ts', '**/*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },

  // Must stay last: turns off rules that conflict with Prettier
  prettier,
])
