import build from './build.js';

const targets = [
	{ input: 'entry/entry-core.js', file: 'modular/sortable.core.esm.js' },
	{ input: 'entry/entry-defaults.js', file: 'modular/sortable.esm.js' },
	{
		input: 'entry/entry-complete.js',
		file: 'modular/sortable.complete.esm.js',
	},
];

export default targets.map(({ input, file }) => ({
	...build,
	input,
	output: {
		...build.output,
		file,
		format: 'esm',
	},
}));
