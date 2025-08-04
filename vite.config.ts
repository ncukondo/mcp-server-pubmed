import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MCPServerPubmed',
      fileName: 'index',
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: ['@modelcontextprotocol/sdk', 'fs', 'path', 'fs/promises']
    },
    target: 'node18'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});