import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import path from 'path'

export default defineConfig({
    plugins: [vue(), vueJsx()],
    base: './', // 设置基本路径
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src') // 设置 `@` 为 `src` 目录的别名
        }
    },
    server: {
        port: 9000, // 开发服务器端口
        open: true, // 自动打开浏览器
        proxy: {
            // 配置代理（如果需要）
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, '')
            }
        }
    },
    build: {
        outDir: 'dist', // 构建输出目录
        sourcemap: true // 生成 source map 文件
    }
})
