import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    ignores: ['**/exports-unused.ts'],
    rules: {
      'max-nested-callbacks': ['error', { max: 4 }],
      'max-statements-per-line': ['error', { max: 2 }],
      'no-console': 'off',
      'no-empty-function': 'error',
      'no-lonely-if': 'error',
      'no-shadow': ['error', { allow: ['err', 'resolve', 'reject'] }],
      'no-var': 'error',
      'no-undef': 'off',
      'no-unused-vars': 'warn',
      'prefer-const': 'error',
      yoda: 'error',
    },
    prettier,
  }
];
