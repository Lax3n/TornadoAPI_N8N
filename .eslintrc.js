module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
	},
	env: {
		node: true,
		es6: true,
	},
	plugins: ['@typescript-eslint'],
	extends: [
		'eslint:recommended',
	],
	rules: {
		'no-unused-vars': 'off',
		'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		'no-console': 'warn',
		'prefer-const': 'error',
		'no-var': 'error',
	},
	overrides: [
		{
			files: ['*.ts'],
			rules: {
				'no-undef': 'off',
			},
		},
	],
	ignorePatterns: ['dist/', 'node_modules/', '*.js'],
};
