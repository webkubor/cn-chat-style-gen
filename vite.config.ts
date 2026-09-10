import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { refreshGuard } from 'vite-plugin-refresh-guard'
import fs from 'node:fs'
import path from 'node:path'

// 读取包版本号
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'))

// https://vite.dev/config/
export default defineConfig(() => {
  return {
  define: {
    '__APP_VERSION__': JSON.stringify(pkg.version)
  },
  plugins: [
    vue(),
    tailwindcss(),
    refreshGuard({ changelog: false }),
    VitePWA({
      registerType: 'prompt', // 关键：检测到更新时提示用户，最安全
      includeAssets: ['favicon.ico', 'logo.svg', 'assets/*.jpg'],
      manifest: {
        name: 'WeChat Gen - 莫兰迪聊天生成器',
        short_name: 'WeChatGen',
        description: '高保真莫兰迪风格微信聊天截图生成器',
        theme_color: '#2C3639',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: '语料库管理',
            short_name: '语料库',
            description: '快速管理您的对话素材',
            url: '/corpus',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: '查看更新日志',
            short_name: '更新日志',
            description: '查看版本变动历史',
            url: '/changelog',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true, // 关键：自动清理老版本缓存
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg}']
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
}
})
