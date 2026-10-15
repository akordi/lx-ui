/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
/** @type {import('vite').UserConfig} */
const vueConfig = defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: path.resolve(import.meta.dirname, 'src/lib.js'),
      name: 'VueCarbonComponents',
      fileName: (format) => `akordi-lx-ui.${format}.js`,
      formats: ['esm', 'umd'],
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        minifyInternalExports: false,
        assetFileNames: '[name][extname]',
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
  plugins: [
    vue(),
    dts({
      outDir: 'dist/types',
      include: ['src/**/*'],
      exclude: ['tests/**', '**/*.test.*', '**/*.spec.*'],
      afterBuild: () => {
        fs.writeFileSync(
          path.resolve(import.meta.dirname, 'dist/akordi-lx-ui.d.ts'),
          "export * from './types/lib';\n"
        );
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.js'],
    testTimeout: 30_000,
    // tests/ssr.test.js renders ~230 components with no props, so many intentionally throw on a
    // missing required prop (the test only cares about ReferenceError from a missing browser
    // global). When one of those aborts mid-render, an in-flight child already resolving a
    // getSSRProps-backed directive (v-tooltip, v-imask) can be abandoned and reject outside any
    // promise the test awaits — a pre-existing Vue SSR abandoned-render quirk only visible now
    // that these directives give it an observable failure. Filter only this exact shape.
    onUnhandledError(error) {
      if (
        error?.name === 'TypeError' &&
        error?.message?.includes("reading 'getSSRProps'") &&
        error?.stack?.includes('ssrGetDirectiveProps')
      ) {
        return false;
      }
      return undefined;
    },
  },
});

export default vueConfig;
