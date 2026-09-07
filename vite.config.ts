
import fs from "fs";
import path from "path";

function syncPublicPlugin() {
  return {
    name: "sync-public-bundle",
    closeBundle() {
      const src = path.resolve(import.meta.dirname, "dist/Sortable.min.js");
      const dest1 = path.resolve(import.meta.dirname, "tests/e2e/.public/Sortable.min.js");
      const dest2 = path.resolve(import.meta.dirname, "tests/e2e/.public/tests/Sortable.min.js");

      if (fs.existsSync(src)) {
        if (fs.existsSync(path.dirname(dest1))) fs.copyFileSync(src, dest1);
        if (fs.existsSync(path.dirname(dest2))) fs.copyFileSync(src, dest2);
        console.log("✅ [Vite] Bundle sincronizado automáticamente en tests/e2e/.public/");
      }
    }
  };
}

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
    syncPublicPlugin(),
    dts({ insertTypesEntry: true }),
    istanbul({
      include: ['src/**/*.js', 'src/**/*.ts', 'plugins/**/*.js', 'plugins/**/*.ts'],
      exclude: ['node_modules', 'tests/**'],
      extension: ['.js', '.ts'],
      requireEnv: false,
    }),
  ],
});
