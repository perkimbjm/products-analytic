import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';

export default [
  // Ignore patterns
  {
    ignores: ['node_modules', 'dist', 'tests/helpers', '*.migrations.ts'],
  },

  // Base JS rules + TypeScript overrides
  {
    files: ['src/**/*.{ts,js}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // From @eslint/js baseline
      ...js.configs.recommended.rules,

      // TypeScript-specific rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // General good practices
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error'],
        },
      ],
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],

      // Indent and style (working with prettier)
      'indent': 'off',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'comma-dangle': ['error', 'always-multiline'],
      'object-shorthand': ['error', 'always'],
      'no-trailing-spaces': 'error',
    },
  },

  // CLI/import files can use console
  {
    files: ['src/db/migrate.ts', 'src/import/index.ts'],
    rules: {
      'no-console': 'off', // CLI files print to stdout
    },
  },

  // Logger implementation uses console (intentionally)
  {
    files: ['src/lib/logger.ts'],
    rules: {
      'no-console': 'off', // This is the logger implementation
    },
  },

  // Test files have slightly different rules
  {
    files: ['tests/**/*.ts'],
    rules: {
      'no-console': 'off', // Tests can use console for diagnostics
    },
  },

  // Prettier compatibility (must be last to disable conflicting rules)
  prettierConfig,
];
