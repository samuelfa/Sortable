import fs from 'node:fs';
import UglifyJS from 'uglify-js';
import pkg from '../package.json' with { type: 'json' };

const banner = `/*! Sortable ${pkg.version} - ${pkg.license} | ${pkg.repository.url} */\n`;

const inputCode = fs.readFileSync('./Sortable.js', 'utf8');
const result = UglifyJS.minify(inputCode);

if (result.error) {
	console.error('Minification error:', result.error);
	process.exit(1);
}

fs.writeFileSync('./Sortable.min.js', banner + result.code, 'utf8');
console.log('✔ Sortable.min.js successfully generated.');
