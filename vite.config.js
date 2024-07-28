import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import sw from './src/lib/vite-plugin-sw.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), sw()],
  build: {
    target: 'esnext',
  },
  worker: {
    format: 'es',
  },
})
