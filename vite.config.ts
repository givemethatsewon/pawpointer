import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import gallery from './src/gallery.json';
// Keep the parser preload in sync with the runtime's center selection.
const first = gallery.reduce((best, p) =>
  (p.paw.x-.5)**2+(p.paw.y-.5)**2 < (best.paw.x-.5)**2+(best.paw.y-.5)**2 ? p : best);
export default defineConfig({
  plugins: [react(), {
    name: 'preload-first-cat',
    transformIndexHtml: () => [{ tag: 'link', attrs: {
      rel: 'preload', as: 'image', href: `./${first.avif ?? first.src}`,
      type: first.avif ? 'image/avif' : 'image/webp', fetchpriority: 'high',
    }, injectTo: 'head' }],
  }],
  base: './', server: { host: '127.0.0.1' },
});
