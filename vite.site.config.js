import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { siteApkPreview } from './scripts/site-apk-preview.mjs'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig(({ mode }) => ({
  root: resolve(projectRoot, 'site'),
  base: mode === 'pages' ? '/ardechoise-vite/' : '/',
  publicDir: resolve(projectRoot, 'site/public'),
  plugins: [react(), siteApkPreview(projectRoot)],
  server: { port: 5174, strictPort: true },
  preview: { port: 4174, strictPort: true },
  build: {
    outDir: resolve(projectRoot, 'dist-site'),
    emptyOutDir: true,
    rollupOptions: { input: resolve(projectRoot, 'site/index.html') },
  },
}))
