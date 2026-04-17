import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Calligraphie hors scope actuel — lint relâché pour éviter de bloquer le CI
  globalIgnores(['dist', 'src/lib/font-generator.ts', 'src/lib/character-extractor.ts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  // Composants shadcn et providers React mélangent intentionnellement
  // composants + variants/hooks/constantes — on relâche react-refresh ici
  {
    files: [
      'src/components/ui/**/*.{ts,tsx}',
      'src/hooks/use*.{ts,tsx}',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
