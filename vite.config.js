import { defineConfig } from 'vite';
import { resolve } from 'path';
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        reportPage2: resolve(__dirname, 'src/Pages/ReportPage2.html'),
      },
    },
  },
});
