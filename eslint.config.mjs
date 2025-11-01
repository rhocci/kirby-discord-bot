import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';

export default [
	js.configs.recommended,
	{
		files: ['**/*.{js,ts}'],
		languageOptions: {
			parser: tsParser,
			ecmaVersion: 'latest',
			sourceType: 'module',
		},
		rules: {
			'no-console': 'off',
			'no-unused-vars': 'warn',
			'no-undef': 'off',
			'prefer-const': 'error',
		},
	},
	prettier,
];
