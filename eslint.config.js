import globals from 'globals';

export default [
	{
		/* Ignore built output files and node_modules */
		ignores: ['Sortable.js', 'Sortable.min.js', 'modular/**', 'dist/**'],
	},
	{
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.node,
				/* Custom globals */
				define: 'readonly',
				performance: 'readonly',
			},
		},
		rules: {
			/* Modern equivalents for JSHint options */
			'no-unused-expressions': 'off', // Equivalent to expr: true
			'new-cap': 'off', // Equivalent to newcap: false
			'no-strict': 'off', // Equivalent to strict: false
			'no-new': 'off', // Equivalent to supernew: true
		},
	},
];
