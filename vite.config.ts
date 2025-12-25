import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Custom plugin to copy manifest and icons after build
    {
      name: 'copy-extension-files',
      closeBundle() {
        // Copy manifest.json to dist
        if (existsSync('public/manifest.json')) {
          copyFileSync('public/manifest.json', 'dist/manifest.json');
        }

        // Create icons directory if it doesn't exist
        if (!existsSync('dist/icons')) {
          mkdirSync('dist/icons', { recursive: true });
        }

        // Copy icons if they exist
        const iconSizes = ['16', '32', '48', '128'];
        iconSizes.forEach(size => {
          const iconPath = `public/icons/icon-${size}.png`;
          if (existsSync(iconPath)) {
            copyFileSync(iconPath, `dist/icons/icon-${size}.png`);
          }
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      'buffer': 'buffer',
    },
  },
  define: {
    // Provide globals for browser environment
    'global': 'globalThis',
    'process.env': '{}',
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        'service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
        'content-script': resolve(__dirname, 'src/content/content-script.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Keep service-worker and content-script at root level with fixed names
          // This matches the manifest.json "service_worker": "service-worker.js"
          if (chunkInfo.name === 'service-worker' || chunkInfo.name === 'content-script') {
            return '[name].js';
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  optimizeDeps: {
    include: ['buffer', '@noble/secp256k1', '@noble/hashes', '@scure/bip32', '@scure/bip39', '@scure/base'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
});
