import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string };

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    // sourcemap disabled — source-map generation was the primary cause of heap OOM
    // during the Rollup chunk-rendering phase.  Re-enable only in a CI environment
    // that has been given extra memory via NODE_OPTIONS.
    sourcemap: false,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // ── vendor only — source files are NOT manually chunked ───────────
          // Splitting source data files into separate chunks caused circular
          // cross-chunk ES module TDZ crashes in production (blank white page).
          // Rollup handles source-file splitting safely on its own.
          if (!id.includes('/node_modules/')) return undefined;
          // react-router-dom imports @remix-run/router; putting both in the
          // same chunk eliminates the vendor → vendor-react → vendor cycle
          // that Rollup warns about and that causes blank-page failures when
          // one chunk loads before the other.
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router') ||
            id.includes('/scheduler/') ||
            id.includes('/@remix-run/')
          ) return 'vendor-react';
          if (id.includes('/@supabase/')) return 'vendor-supabase';
          if (id.includes('/jspdf') || id.includes('/html2canvas')) return 'vendor-pdf';
          return 'vendor';
        },
      },
    },
  },
});
