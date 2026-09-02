import build from './build.ts';

const targets = [
	{ input: 'entry/entry-core.ts', file: 'modular/sortable.core.esm.js' },
	{ input: 'entry/entry-defaults.ts', file: 'modular/sortable.esm.js' },
	{
		input: 'entry/entry-complete.ts',
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