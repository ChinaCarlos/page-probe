import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginSass } from "@rsbuild/plugin-sass";

export default defineConfig({
  plugins: [pluginReact(), pluginSass()],
  html: {
    template: "./public/index.html",
  },
  mode: "production",
  server: {
    port: 4173,
    host: "0.0.0.0",
    strictPort: true,
    // 预览模式的代理配置 - 可以配置为生产环境API地址
    proxy: {
      "/api": {
        // 在预览时可以指向生产环境或测试环境的API
        target: process.env.PREVIEW_API_URL || "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
    headers: {
      // 添加一些生产环境相关的安全头
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
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
            // Antd 相关库
            antd: {
              test: /[\\/]node_modules[\\/](antd|@ant-design)[\\/]/,
              name: "lib-antd",
              priority: 20,
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
    // 资源文件大小限制
    dataUriLimit: 200000,
    // 生产环境资源路径
    assetPrefix: process.env.PREVIEW_ASSET_PREFIX || "/",
  },
  performance: {
    // 提高性能阈值
    chunkSizeLimit: 500000, // 500KB
    assetSizeLimit: 300000, // 300KB
    printFileSize: true,
  },
  // 开发工具
  tools: {
    ...{
      postcss: {
        postcssOptions: {
          plugins: [require("tailwindcss"), require("autoprefixer")],
        },
      },
      rspack: {
        optimization: {
          splitChunks: {
            chunks: "all",
            cacheGroups: {
              react: {
                test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
                name: "lib-react",
                priority: 20,
                chunks: "all",
              },
              antd: {
                test: /[\\/]node_modules[\\/](antd|@ant-design)[\\/]/,
                name: "lib-antd",
                priority: 20,
                chunks: "all",
              },
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: "vendor",
                priority: 10,
                chunks: "all",
                minChunks: 1,
                maxSize: 250000,
              },
            },
          },
          runtimeChunk: {
            name: "runtime",
          },
        },
      },
    },
    // 生产环境下禁用source map以减少文件大小
    bundlerChain: (chain) => {
      if (process.env.NODE_ENV === "production") {
        chain.devtool(false);
      }
    },
  },
});
