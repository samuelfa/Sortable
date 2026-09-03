import build from './build.ts';

export default {
	...build,
	input: 'entry/entry-complete.ts',
	output: {
		...build.output,
		file: './Sortable.js',
		format: 'umd',
		name: 'Sortable',
	},
};