import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: '/',
  resolve: {
    alias: {
      // 워크스페이스 호이스트 시 @apps-in-toss collect-package-version 플러그인이 깨지므로 로컬 패키지는 별칭으로만 연결
      shared: path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  plugins: [react()],
  optimizeDeps: {
    exclude: ['shared'],
  },
  server: {
    host: '127.0.0.1',
    port: 5010,
    strictPort: false,
    open: true,
    proxy: {
      '/api': { target: 'http://localhost:5005', changeOrigin: true },
    },
  },
});
