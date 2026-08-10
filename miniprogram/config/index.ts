import { defineConfig } from '@tarojs/cli'
import { WeappTailwindcssDisabled, UnifiedWebpackLogger } from '@tarojs/helper'

export default defineConfig(async (merge, { command, mode }) => {
  const baseConfig = {
    projectName: 'cocktail-miniprogram',
    date: '2026-8-9',
    designWidth: 750,
    deviceRatio: { 640: 2.34 / 2, 750: 1, 828: 1.81 / 2, 375: 2 / 1 },
    sourceRoot: 'src',
    outputRoot: 'dist',
    plugins: ['@tarojs/plugin-framework-react'],
    defineConstants: {},
    copy: { patterns: [], options: {} },
    framework: 'react',
    compiler: 'webpack5',
    cache: { enable: true },
    sass: { resource: [] },
    mini: {
      webpackChain(chain: any) {
        // 可在此处扩展 webpack 配置
      },
      postcss: {
        pxtransform: { enable: true, config: {} },
        cssModules: { enable: false }
      }
    },
    h5: {
      publicPath: '/',
      staticDirectory: 'static',
      output: { filename: 'js/[name].[hash:8].js', chunkFilename: 'js/[name].[chunkhash:8].js' },
      miniCssExtractPluginOption: { ignoreOrder: true, filename: 'css/[name].[hash].css' },
      postcss: { autoprefixer: { enable: true } },
      chainWebpack(chain: any) {},
      devServer: { port: 10086, host: '0.0.0.0', open: false, https: false }
    }
  }

  if (process.env.NODE_ENV === 'development') {
    return merge({}, baseConfig, { defineConstants: { 'process.env.NODE_ENV': '"development"' } })
  }
  if (process.env.NODE_ENV === 'production') {
    return merge({}, baseConfig, { defineConstants: { 'process.env.NODE_ENV': '"production"' } })
  }
  return baseConfig
})
