import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy API + uploads to the Express server during development.
export default defineConfig({
  plugins: [react()],
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
