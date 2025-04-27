import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { splitVendorChunkPlugin } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    splitVendorChunkPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast'],
        },
      },
    },
    reportCompressedSize: false,
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom',
      '@tanstack/react-query',
      'next-themes',
      'wouter',
    ],
    exclude: ['@assets'],
  },
  server: {
    hmr: {
      overlay: false,
    },
  },
});
