import { babel } from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import banner from './banner.js';

const isCoverage = process.env.COVERAGE === 'true';

export default {
	input: 'entry/entry-complete.js',
	output: {
		banner,
		name: 'Sortable',
		format: isCoverage ? 'iife' : 'esm',
		sourcemap: true,
	},
	plugins: [
		json(),
		babel({
			babelHelpers: 'bundled',
			exclude: 'node_modules/**',
		}),
		resolve(),
	],
};
