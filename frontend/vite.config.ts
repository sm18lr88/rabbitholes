import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import eslintPlugin from 'vite-plugin-eslint'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Use the React Compiler Babel plugin
      babel: {
        plugins: [['babel-plugin-react-compiler', {}]],
      },
    }),
    tsconfigPaths(),
    // Move ESLint check to build time or on server start to avoid overlay during dev
    // Adjust options as needed (e.g., failOnError: true for build)
    eslintPlugin({
      cache: false, // Disable cache to ensure fresh checks
      include: ['./src/**/*.ts', './src/**/*.tsx'],
      overrideConfigFile: '.eslintrc.js', // Explicitly point to the config file
      exclude: [],
    }),
  ],
  // Optional: Configure server options if needed (e.g., proxy)
  // server: {
  //   port: 3001, // Example: run dev server on a different port if 3000 is used by backend
  //   proxy: {
  //     // Example: proxy API requests to backend during development
  //     '/api': {
  //       target: 'http://localhost:3000', // Your backend address
  //       changeOrigin: true,
  //     },
  //   },
  // },
  build: { // <<< START of build section
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id, { getModuleInfo }) {
          // Group node_modules into vendor chunks
          if (id.includes('node_modules')) {
            // Split large libraries into their own chunks
            if (id.includes('reactflow')) {
              return 'vendor-reactflow';
            }
            if (id.includes('gsap')) {
              return 'vendor-gsap';
            }
            if (id.includes('dagre') || id.includes('@dagrejs')) {
              return 'vendor-dagre';
            }
            // Group react-related stuff together
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            // Group other large dependencies or frameworks if needed
            // if (id.includes('axios')) {
            //   return 'vendor-axios';
            // }

            // Put the rest of node_modules into a general vendor chunk
            return 'vendor';
          }
          // You could potentially split your own source code here too,
          // but let's focus on vendors first.
        }
      }
    }
  }, // <<< END of build section
})
