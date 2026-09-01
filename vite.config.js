import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Custom plugin to strip crossorigin attributes which cause CORS errors on file:// protocol in Electron
function removeCrossoriginPlugin() {
  return {
    name: 'remove-crossorigin-for-electron',
    transformIndexHtml(html) {
      return html
        .replace(/ crossorigin="[^"]*"/g, '')
        .replace(/ crossorigin/g, '');
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), removeCrossoriginPlugin()],
  server: {
    port: 3000,
    open: false,
    watch: {
      ignored: ['**/android/**', '**/dist_electron/**', '**/build_output/**', '**/dist/**'],
    },
  },
  optimizeDeps: {
    entries: ['src/**/*.{js,jsx,ts,tsx}', 'index.html'],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    modulePreload: {
      polyfill: false,
    },
  },
});
