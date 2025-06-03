#!/usr/bin/env node

const path = require("path");

async function initializeConfig() {
  try {
    console.log("🔧 开始初始化白屏检测配置...");

    // 直接使用编译后的 TypeScript 模块
    const initServicePath = path.join(
      __dirname,
      "../packages/server/dist/services/initialization.js"
    );

    // 检查编译后的文件是否存在
    if (!require("fs").existsSync(initServicePath)) {
      console.log("⚠️  编译后的初始化服务不存在，需要先编译服务器");
      console.log("请运行: cd packages/server && pnpm build");
      process.exit(1);
    }

    // 动态导入初始化服务
    const { initializationService } = require(initServicePath);

    // 执行完全初始化
    await initializationService.initializeAll();

    console.log("\n🎉 初始化完成，可以启动服务器进行验证");
  } catch (error) {
    console.error("❌ 初始化失败:", error);
    console.error(
      "提示: 如果是模块导入错误，请先编译服务器: cd packages/server && pnpm build"
    );
    process.exit(1);
  }
}

// 执行初始化
initializeConfig();
