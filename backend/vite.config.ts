import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createHtmlPlugin } from 'vite-plugin-html'
import { visualizer } from 'rollup-plugin-visualizer'
import compression from 'vite-plugin-compression'

// https://vitejs.dev/config/
export default ({ mode }: { mode: string }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd(), '') }

  return defineConfig({
    plugins: [
      react({
        // Babel optimizations
        babel: {
          plugins: [
            ['@babel/plugin-transform-runtime'],
          ]
        }
      }),
      createHtmlPlugin({
        inject: {
          data: {
            WEBSITE_NAME: process.env.VITE_BC_WEBSITE_NAME || 'Volo',
          },
        },
        minify: true,
      }),
      // Add compression for production builds
      compression({
        algorithm: 'gzip',
        ext: '.gz',
      }),
      // Add bundle analyzer in build mode
      mode === 'production' && visualizer(),
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        ':bookcars-types': path.resolve(__dirname, '../packages/bookcars-types'),
        ':bookcars-helper': path.resolve(__dirname, '../packages/bookcars-helper'),
        ':disable-react-devtools': path.resolve(__dirname, '../packages/disable-react-devtools'),
        ':currency-converter': path.resolve(__dirname, '../packages/currency-converter'),
      },
    },

    server: {
      host: '0.0.0.0',
      port: Number.parseInt(process.env.VITE_PORT || '3001', 10),
    },

    build: {
      outDir: 'build', // Output directory
      target: 'esnext', // Use esnext to ensure the best performance
      modulePreload: {
        polyfill: true,
      },
      sourcemap: false, // Disable sourcemaps in production
      cssCodeSplit: true, // Enable CSS code splitting

      // Minification settings (Use terser for minification with aggressive settings)
      minify: 'terser', // Can also use 'esbuild' which is faster but less optimized
      terserOptions: {
        compress: {
          drop_console: true, // Removes console.* calls
          drop_debugger: true, // Removes debugger statements
        },
      },

      // Control chunk size
      chunkSizeWarningLimit: 1000, // Warn if a chunk exceeds 1000kb

      // Chunk splitting strategy
      rollupOptions: {
        treeshake: true, // Enable Tree Shaking: Ensure unused code is removed by leveraging ES modules and proper imports
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            mui: ['@mui/material', '@mui/icons-material'],
          },
          // Generate chunk names
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'chunks/[name]-[hash].js',
          entryFileNames: 'entries/[name]-[hash].js',
        },
      },
      assetsInlineLimit: 8192, // This reduces the number of small chunk files
    },

    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', '@mui/material'],
      exclude: ['@mui/icons-material'],
    },
  })
}
