import build from './build.js';

export default [
	{
		...build,
		input: 'entry/entry-complete.js',
		output: {
			...build.output,
			file: './Sortable.js',
			format: 'umd',
		},
	},
	{
		...build,
		input: 'entry/entry-complete.js',
		output: {
			...build.output,
			file: './Sortable.js',
			format: 'iife',
			name: 'Sortable',
		},
	},
];
