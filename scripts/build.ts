import { babel } from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import swc from '@rollup/plugin-swc';
import banner from './banner.ts';

const isCoverage = process.env.COVERAGE === 'true';

export default {
	input: 'entry/entry-complete.ts',
	output: {
		banner,
		name: 'Sortable',
		format: isCoverage ? 'iife' : 'esm',
		sourcemap: true,
	},
	plugins: [
		json(),
		swc({
			jsc: {
				parser: {
					syntax: 'typescript',
					decorators: true,
				},
				target: 'es2020',
			},
		}),
		resolve({ extensions: ['.ts'] }),
		babel({
			babelHelpers: 'bundled',
			exclude: 'node_modules/**',
			plugins: ['@babel/plugin-transform-object-assign'],
		}),
	],
};