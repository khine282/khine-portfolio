import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  root: './public',
  envDir: path.resolve(__dirname, '.'),
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
})