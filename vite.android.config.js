import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))
const gameAssets = ['logo.png', 'alex-croupier.png', 'faute.png', 'pop champ.wav', 'hardcore.wav', 'vite.svg']
const fontAssets = ['Fredoka-variable.ttf', 'OFL.txt']

export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [react(), {
    name: 'android-game-assets',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return {
          html: html.replace(/<link\b[^>]*>/gi, (tag) =>
            /(?:https?:)?\/\/fonts\.(?:googleapis|gstatic)\.com\b/i.test(tag) ? '' : tag),
          tags: [{
            tag: 'style',
            injectTo: 'head',
            children: '@font-face { font-family: "Fredoka"; src: url("./fonts/Fredoka-variable.ttf") format("truetype"); font-style: normal; font-weight: 300 700; font-display: swap; }',
          }],
        }
      },
    },
    generateBundle() {
      for (const fileName of gameAssets) {
        this.emitFile({ type: 'asset', fileName, source: readFileSync(resolve(projectRoot, 'public', fileName)) })
      }
      for (const fileName of fontAssets) {
        this.emitFile({
          type: 'asset',
          fileName: `fonts/${fileName}`,
          source: readFileSync(resolve(projectRoot, 'assets/android/fonts', fileName)),
        })
      }
    },
  }],
  build: {
    outDir: resolve(projectRoot, 'dist-android'),
    emptyOutDir: true,
    rollupOptions: { input: resolve(projectRoot, 'index.html') },
  },
})
