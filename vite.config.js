import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [react(), svgr()],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        silenceDeprecations: ['import', 'legacy-js-api'],
        additionalData: `
          @import "${resolve(__dirname, 'src/styles/_variables.scss').replace(/\\/g, '/')}";
          @import "${resolve(__dirname, 'src/styles/_mixins.scss').replace(/\\/g, '/')}";
          @import "${resolve(__dirname, 'src/styles/_animations.scss').replace(/\\/g, '/')}";
        `
      }
    }
  }
})