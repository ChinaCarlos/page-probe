#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// ANSI颜色代码
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(color, text) {
  console.log(`${colors[color]}${text}${colors.reset}`);
}

function displayBanner() {
  console.log("\n" + "=".repeat(60));
  log("cyan", "🚀 Page Probe 预览服务器");
  console.log("=".repeat(60));
  log("yellow", "📦 正在构建生产版本...");
  console.log("");
}

function displayPreviewInfo() {
  console.log("\n" + "=".repeat(60));
  log("green", "✅ 构建完成！预览服务器已启动");
  console.log("=".repeat(60));
  log("bright", "🌐 访问地址:");
  log("blue", "   ➜ 本地:   http://localhost:4173");
  log("blue", "   ➜ 网络:   http://0.0.0.0:4173");
  console.log("");
  log("bright", "📋 可用操作:");
  log("yellow", "   • 按 Ctrl+C 停止服务器");
  log("yellow", "   • 在浏览器中预览应用");
  log("yellow", "   • 检查生产环境功能");
  console.log("");
  log("bright", "📂 构建产物位置:");
  log("magenta", "   ➜ ./dist/");
  console.log("");
  log("bright", "🔍 性能检查:");
  log("cyan", "   • 检查加载速度");
  log("cyan", "   • 验证代码分割效果");
  log("cyan", "   • 确认懒加载工作正常");
  console.log("=".repeat(60) + "\n");
}

function displayBuildSize() {
  const distPath = path.join(__dirname, "../dist");

  if (!fs.existsSync(distPath)) {
    return;
  }

  try {
    const statsPath = path.join(distPath, "rsbuild-stats.json");
    if (fs.existsSync(statsPath)) {
      log("bright", "📊 构建统计:");

      // 简单的文件大小统计
      const jsFiles = [];
      const cssFiles = [];

      function getFilesRecursively(dir, fileList = []) {
        const files = fs.readdirSync(dir);
        files.forEach((file) => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);

          if (stat.isDirectory()) {
            getFilesRecursively(filePath, fileList);
          } else {
            fileList.push({
              name: file,
              path: filePath,
              size: stat.size,
            });
          }
        });
        return fileList;
      }

      const allFiles = getFilesRecursively(distPath);

      allFiles.forEach((file) => {
        if (file.name.endsWith(".js")) {
          jsFiles.push(file);
        } else if (file.name.endsWith(".css")) {
          cssFiles.push(file);
        }
      });

      // 显示主要JS文件
      if (jsFiles.length > 0) {
        log("cyan", "   JavaScript 文件:");
        jsFiles
          .sort((a, b) => b.size - a.size)
          .slice(0, 10) // 只显示前10个最大的文件
          .forEach((file) => {
            const size = (file.size / 1024).toFixed(1);
            const gzipSize = Math.round((file.size * 0.3) / 1024); // 估算gzip大小
            log(
              "yellow",
              `     ${file.name} - ${size}KB (≈${gzipSize}KB gzipped)`
            );
          });
      }

      // 显示CSS文件
      if (cssFiles.length > 0) {
        log("cyan", "   CSS 文件:");
        cssFiles.forEach((file) => {
          const size = (file.size / 1024).toFixed(1);
          log("yellow", `     ${file.name} - ${size}KB`);
        });
      }

      console.log("");
    }
  } catch (error) {
    // 忽略统计错误，不影响预览
  }
}

async function runPreview() {
  displayBanner();

  // 检查是否有现有的构建产物
  const distExists = fs.existsSync(path.join(__dirname, "../dist"));

  const buildArgs =
    process.argv.includes("--skip-build") && distExists ? [] : ["build"];

  if (buildArgs.length > 0) {
    // 先构建
    log("yellow", "📦 开始构建...");
    const buildProcess = spawn("npm", ["run", "build"], {
      stdio: "inherit",
      shell: true,
      cwd: __dirname + "/..",
    });

    buildProcess.on("close", (code) => {
      if (code === 0) {
        displayBuildSize();
        startPreviewServer();
      } else {
        log("red", "❌ 构建失败！");
        process.exit(1);
      }
    });
  } else {
    log("green", "⚡ 跳过构建，使用现有产物");
    displayBuildSize();
    startPreviewServer();
  }
}

function startPreviewServer() {
  displayPreviewInfo();

  // 启动预览服务器
  const previewProcess = spawn(
    "npx",
    ["rsbuild", "preview", "--host", "0.0.0.0", "--port", "4173"],
    {
      stdio: "inherit",
      shell: true,
      cwd: __dirname + "/..",
    }
  );

  // 处理进程退出
  process.on("SIGINT", () => {
    log("yellow", "\n👋 正在停止预览服务器...");
    previewProcess.kill("SIGINT");
    setTimeout(() => process.exit(0), 1000);
  });

  previewProcess.on("close", (code) => {
    if (code !== 0) {
      log("red", "❌ 预览服务器异常退出");
    }
    process.exit(code);
  });
}

// 处理未捕获的错误
process.on("uncaughtException", (error) => {
  log("red", `❌ 未捕获的错误: ${error.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  log("red", `❌ 未处理的Promise拒绝: ${error.message}`);
  process.exit(1);
});

// 启动预览
runPreview();
