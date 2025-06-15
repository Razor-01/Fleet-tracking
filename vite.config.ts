import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import https from 'https';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api/motive': {
        target: 'https://api.gomotive.com/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/motive/, ''),
        secure: true,
        timeout: 300000,
        proxyTimeout: 300000,
        agent: new https.Agent({ keepAlive: true }),
      },
    },
  },
});