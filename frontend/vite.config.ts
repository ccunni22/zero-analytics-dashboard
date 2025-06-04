import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    base: '/',
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts', 'd3'],
          },
        },
      },
    },
    server: {
      port: 4300,
      strictPort: true,
      host: true,
      hmr: {
        overlay: true,
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'recharts', 'd3', 'axios'],
      exclude: [],
    },
    // Only expose specific environment variables
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:8000'),
      'import.meta.env.VITE_ENABLE_CSV_UPLOAD': JSON.stringify(env.VITE_ENABLE_CSV_UPLOAD || 'true'),
      'import.meta.env.VITE_ENABLE_EXPORT': JSON.stringify(env.VITE_ENABLE_EXPORT || 'true'),
    },
  }
})
