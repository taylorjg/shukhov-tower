import { defineConfig } from 'vite';

export default defineConfig({
  base: "/shukhov-tower",
  server: {
    open: true,
  },
  build: {
    target: 'esnext',
  },
});
