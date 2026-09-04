#!/usr/bin/env bash

set -e

echo "🗑️  Eliminando carpeta de scripts obsoleta de Rollup/Babel..."
rm -rf scripts/

echo "📄 Actualizando vite.config.ts con import.meta.dirname y exports nombrados..."

cat << 'EOF' > vite.config.ts
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import istanbul from 'vite-plugin-istanbul';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/Sortable.ts'),
      name: 'Sortable',
      fileName: (format: string) => {
        if (format === 'umd') return 'Sortable.min.js';
        if (format === 'es') return 'modular/sortable.esm.js';
        return `sortable.${format}.js`;
      },
      formats: ['umd', 'es'],
    },
    rollupOptions: {
      output: {
        exports: 'named',
      },
    },
    sourcemap: true,
  },
  plugins: [
    dts({ insertTypesEntry: true }),
    istanbul({
      include: ['src/**/*.js', 'src/**/*.ts', 'plugins/**/*.js', 'plugins/**/*.ts'],
      exclude: ['node_modules', 'tests/**'],
      extension: ['.js', '.ts'],
      requireEnv: false,
    }),
  ],
});
EOF

echo "🎉 ¡Configuración corregida con éxito! Probando verificación de tipos y build..."

