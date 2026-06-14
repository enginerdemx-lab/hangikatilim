import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => ({
  base: '/',
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  define: {
    '__BUILD_TIMESTAMP__': JSON.stringify(Date.now()),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    modulePreload: false,
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
}));
