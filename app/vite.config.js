import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
// This config keeps defaults but adds a few small production-friendly
// options:
// - `base` driven by BASE_PATH env (useful if deploying to a sub-path)
// - resolve.alias for `@` -> `src` helps cleaner imports
// - build tuning: increased chunk warning limit and explicit outDir
// - server/preview defaults for local testing

export default defineConfig(({ mode }) => {
  const basePath = process.env.BASE_PATH || '/'

  const viteConfig = {
    base: basePath,
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    build: {
      outDir: 'dist',
      // Leave assets inline limit at Vite default (4kb) unless you need larger
      // assetsInlineLimit: 4096,
      // Increase chunk size warning threshold to reduce noisy logs for larger bundles
      chunkSizeWarningLimit: 2000,
      // You can enable sourcemap in production for debugging, but it increases build size.
      sourcemap: false
    },
    server: {
      host: true,
      port: 5173
    },
    preview: {
      port: 4173
    }
  }

  return viteConfig
})
