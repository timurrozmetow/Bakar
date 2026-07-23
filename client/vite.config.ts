import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy API + uploads to the Express server during development.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Split the rarely-changing dependencies out of the app chunk so a
        // content or layout change does not invalidate ~200 KB of vendor code
        // in every visitor's cache.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:4000', changeOrigin: true },
      '/img': { target: 'http://localhost:4000', changeOrigin: true },
      '/sitemap.xml': { target: 'http://localhost:4000', changeOrigin: true },
      '/robots.txt': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
});
