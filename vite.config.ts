import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3003,
    open: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // 优化 chunk 大小
    rollupOptions: {
      output: {
        manualChunks: {
          // 将 React 和相关库分离到单独的 chunk
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // 将 Three.js 分离到单独的 chunk
          'three-vendor': ['three'],
          // 将 Ant Design 分离到单独的 chunk
          'antd-vendor': ['antd', '@ant-design/icons'],
        },
      },
    },
    // 提高 chunk 大小警告阈值
    chunkSizeWarningLimit: 1000,
  },
});
