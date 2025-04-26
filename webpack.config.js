/** @format */

const path = require('path')
const { VueLoaderPlugin } = require('vue-loader')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    mode: process.env.NODE_ENV || 'development',
    entry: './src/main.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].[contenthash].js',
        clean: true
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'public')
        },
        compress: true, // 启用 gzip 压缩
        port: 9000,
        hot: true, // 启用热更新
        historyApiFallback: true, // 支持 HTML5 路由
        client: {
            overlay: false // 禁用错误覆盖层，减少前端渲染压力
        },
        watchFiles: {
            paths: ['src/**/*', 'public/**/*'], // 仅监听必要的文件
            options: {
                ignored: /node_modules/ // 忽略 node_modules
            }
        },
        devMiddleware: {
            writeToDisk: false // 禁止将文件写入磁盘，仅保留内存中
        }
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader'
            },
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                options: {
                    appendTsSuffixTo: [/\.vue$/]
                }
            },
            {
                test: /\.css$/,
                use: ['vue-style-loader', 'css-loader']
            },
            {
                test: /\.scss$/,
                use: [
                    'vue-style-loader', // 将 CSS 注入到 DOM 中
                    'css-loader', // 解析 CSS 文件
                    'sass-loader' // 编译 SCSS 为 CSS
                ]
            },
            {
                test: /\.(png|jpe?g|gif|svg)$/i,
                type: 'asset/resource'
            }
        ]
    },
    plugins: [
        new VueLoaderPlugin(),
        new HtmlWebpackPlugin({
            template: './index.html'
        })
    ],
    resolve: {
        extensions: ['.ts', '.js', '.vue', '.json'],
        alias: {
            '@': path.resolve(__dirname, 'src')
        }
    },
    optimization: {
        splitChunks: {
            chunks: 'all'
        }
    }
}
