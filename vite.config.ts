import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Для GitHub Pages сборка запускается с BASE_URL=/brehlo-game/
  base: process.env.BASE_URL ?? '/',
  plugins: [vue()],
  test: {
    environment: 'jsdom',
  },
})
