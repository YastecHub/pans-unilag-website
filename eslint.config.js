// Shared ESLint config for the whole repository (client and server).
import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const RAW_COLOUR_MESSAGE =
  'Use a brand token (a Tailwind class such as bg-primary, or var(--color-…)) instead of a raw hex colour. See README → Brand and design system.'

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

  // Client source: colours must come from the brand tokens (styles/tokens.css), never raw hex.
  {
    files: ['client/src/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Literal[value=/#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![\\w-])/]',
          message: RAW_COLOUR_MESSAGE,
        },
        {
          selector:
            'TemplateElement[value.raw=/#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![\\w-])/]',
          message: RAW_COLOUR_MESSAGE,
        },
      ],
    },
  },

  // Express server and config files (Node.js)
  {
    files: ['server/**/*.ts', '**/*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },

  // Must stay last: turns off rules that conflict with Prettier
  prettier,
])
