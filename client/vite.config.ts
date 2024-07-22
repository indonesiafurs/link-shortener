// biome-ignore lint/correctness/noNodejsModules: Vite lol
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
// import { analyzer } from 'vite-bundle-analyzer'
import solid from 'vite-plugin-solid'

export default defineConfig({
  build: {
    outDir: '../client-out',
    target: 'esnext',
    modulePreload: false,
    sourcemap: true,
    assetsInlineLimit: 0,
    minify: 'terser',
    cssMinify: 'lightningcss',
    terserOptions: {
      compress: {
        passes: 3,
      },
    },
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html')
      }
    }
  },
  plugins: [
    solid(),
    // analyzer({ analyzerMode: 'server', openAnalyzer: true })
  ],
})
