import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // 挂在已有站点的子路径下时用 `VITE_BASE=/ielts/ npm run build`；
  // 独立域名 / 根路径部署则不用管，默认 '/'。
  // 前端所有请求与路由都以 base 为基准，所以同一份代码两种部署都能跑。
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: {
    port: 5180,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3007',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
