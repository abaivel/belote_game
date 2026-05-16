// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: '.', // frontend/ est la racine
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
        // Un seul bundle JS pour faciliter le déploiement FTP
        entryFileNames: 'bundle.js',
        chunkFileNames: 'chunk-[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
    // Pas de code-splitting agressif
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 3000,
    proxy: {
      // En développement, proxie les requêtes API vers PHP (ex: MAMP/XAMPP)
      '/backend': {
        target: 'http://localhost/belote_game',
        changeOrigin: true,
      },
    },
  },
});
