import { defineConfig, Terser } from 'vite'
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
  },
  plugins: [solid({
    babel: {
      plugins: []
    }
  })],
})
