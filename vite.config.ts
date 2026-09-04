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
        if (format === 'iife') return 'Sortable.iife.js';
        return `sortable.${format}.js`;
      },
      formats: ['umd', 'es', 'iife'],
    },
    rollupOptions: {
      output: {
        exports: 'default',
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
