import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginSass } from "@rsbuild/plugin-sass";

export default defineConfig({
  plugins: [pluginReact(), pluginSass()],
  html: {
    template: "./public/index.html",
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  tools: {
    postcss: {
      postcssOptions: {
        plugins: [require("tailwindcss"), require("autoprefixer")],
      },
    },
    rspack: {
      optimization: {
        // 启用 Tree Shaking
        usedExports: true,
        sideEffects: false,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            // React 相关库
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
              name: "lib-react",
              priority: 20,
              chunks: "all",
            },
            // Antd 相关库 - 细分打包
            antdCore: {
              test: /[\\/]node_modules[\\/]antd[\\/]es[\\/](config-provider|locale|theme)[\\/]/,
              name: "lib-antd-core",
              priority: 25,
              chunks: "all",
            },
            antdComponents: {
              test: /[\\/]node_modules[\\/]antd[\\/]es[\\/](?!(config-provider|locale|theme))[\\/]/,
              name: "lib-antd-components",
              priority: 24,
              chunks: "all",
              maxSize: 200000, // 限制单个chunk大小为200KB
            },
            antdIcons: {
              test: /[\\/]node_modules[\\/]@ant-design[\\/]icons[\\/]/,
              name: "lib-antd-icons",
              priority: 23,
              chunks: "all",
            },
            // 图表库
            charts: {
              test: /[\\/]node_modules[\\/](echarts|@chartjs|chart\.js|recharts)[\\/]/,
              name: "lib-charts",
              priority: 20,
              chunks: "all",
            },
            // 工具库
            utils: {
              test: /[\\/]node_modules[\\/](lodash|moment|dayjs|date-fns|clsx|classnames)[\\/]/,
              name: "lib-utils",
              priority: 20,
              chunks: "all",
            },
            // 图片查看器和其他UI库
            ui: {
              test: /[\\/]node_modules[\\/](react-photo-view|react-image-gallery|react-virtualized)[\\/]/,
              name: "lib-ui",
              priority: 20,
              chunks: "all",
            },
            // Polyfill 和兼容性库
            polyfill: {
              test: /[\\/]node_modules[\\/](core-js|regenerator-runtime|@babel\/runtime)[\\/]/,
              name: "lib-polyfill",
              priority: 30,
              chunks: "all",
            },
            // 路由相关
            router: {
              test: /[\\/]node_modules[\\/](history|@remix-run)[\\/]/,
              name: "lib-router",
              priority: 20,
              chunks: "all",
            },
            // 默认的vendor chunk
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendor",
              priority: 10,
              chunks: "all",
              minChunks: 1,
              maxSize: 250000, // 250KB 最大大小
            },
          },
        },
        // 运行时chunk
        runtimeChunk: {
          name: "runtime",
        },
      },
      resolve: {
        // 优化模块解析
        alias: {
          // 确保使用 ES 模块版本的 antd
          antd: "antd/es",
          "@ant-design/icons": "@ant-design/icons/es",
        },
      },
      // 配置 Tree Shaking 更精确的处理
      module: {
        rules: [
          {
            test: /\.js$/,
            include: /node_modules[\\/]antd/,
            sideEffects: false,
          },
        ],
      },
    },
  },
  output: {
    cssModules: {
      localIdentName: "[name]__[local]--[hash:base64:5]",
    },
    // 启用文件名哈希
    filenameHash: true,
    // 清理输出目录
    cleanDistPath: true,
    // 资源文件大小限制 (200KB)
    dataUriLimit: 200000,
  },
});
