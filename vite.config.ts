import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// One site, one page per prototype. Relative base so the build works on any host or subpath.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(import.meta.dirname, 'index.html'),
        assistant: path.resolve(import.meta.dirname, 'assistant/index.html'),
        timeProtector: path.resolve(import.meta.dirname, 'time-protector/index.html'),
        chat: path.resolve(import.meta.dirname, 'chat/index.html'),
        chatV3: path.resolve(import.meta.dirname, 'chat-v3/index.html'),
        chatV4: path.resolve(import.meta.dirname, 'chat-v4/index.html'),
        chatV5: path.resolve(import.meta.dirname, 'chat-v5/index.html'),
      },
    },
  },
})
