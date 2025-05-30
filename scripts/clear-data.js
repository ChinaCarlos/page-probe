#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * 数据清理脚本
 * 执行此脚本将清空所有监控数据，包括：
 * - 监控目标
 * - 分组数据
 * - 任务记录
 * - 性能指标数据
 * - 截图文件
 * - 白屏检测配置（恢复默认）
 */

const DATA_DIR = path.join(__dirname, "../packages/server/data");
const SCREENSHOTS_DIR = path.join(__dirname, "../packages/server/screenshots");

// 默认分组数据
const DEFAULT_GROUPS = [
  {
    id: "default-group-001",
    name: "默认分组",
    color: "#1890ff",
    description: "系统默认分组",
    createdAt: Date.now(),
  },
];

// 默认白屏检测配置
const DEFAULT_BLANK_SCREEN_CONFIG = {
  // 检测开关
  enableDOMStructureCheck: true,
  enableContentCheck: true,
  enableTextMatchCheck: true,
  enableHTTPStatusCheck: true,
  enableTimeoutCheck: true,

  // DOM结构检测参数
  domElementThreshold: 3,
  heightRatioThreshold: 0.15,

  // 页面内容检测参数
  textLengthThreshold: 10,

  // 超时检测参数
  domLoadTimeout: 10000,
  pageLoadTimeout: 20000,

  // 错误文案关键词（留空使用系统内置）
  errorTextKeywords: [],

  // 错误状态码（留空使用系统内置）
  errorStatusCodes: [],
};

/**
 * 递归删除目录及其内容
 */
function removeDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        removeDirectory(filePath);
      } else {
        fs.unlinkSync(filePath);
        console.log(`删除文件: ${filePath}`);
      }
    }

    fs.rmdirSync(dirPath);
    console.log(`删除目录: ${dirPath}`);
  }
}

/**
 * 清空JSON数据文件
 */
function clearJsonFile(filePath, defaultData = []) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), "utf8");
    console.log(`清空数据文件: ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`清空数据文件失败 ${filePath}:`, error.message);
  }
}

/**
 * 确保目录存在
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`创建目录: ${dirPath}`);
  }
}

/**
 * 主清理函数
 */
function clearAllData() {
  console.log("🧹 开始清理所有监控数据...\n");

  // 1. 清理截图文件
  console.log("📸 清理截图文件...");
  if (fs.existsSync(SCREENSHOTS_DIR)) {
    const screenshots = fs
      .readdirSync(SCREENSHOTS_DIR)
      .filter(
        (file) =>
          file.endsWith(".png") ||
          file.endsWith(".jpg") ||
          file.endsWith(".jpeg")
      );

    screenshots.forEach((screenshot) => {
      const screenshotPath = path.join(SCREENSHOTS_DIR, screenshot);
      fs.unlinkSync(screenshotPath);
      console.log(`删除截图: ${screenshot}`);
    });

    console.log(`清理完成，删除了 ${screenshots.length} 个截图文件\n`);
  } else {
    console.log("截图目录不存在，跳过清理\n");
  }

  // 2. 确保数据目录存在
  ensureDirectoryExists(DATA_DIR);
  ensureDirectoryExists(SCREENSHOTS_DIR);

  // 3. 清理各种数据文件
  console.log("📊 清理数据文件...");

  // 清理监控目标
  clearJsonFile(path.join(DATA_DIR, "targets.json"), []);

  // 清理分组数据（保留默认分组）
  clearJsonFile(path.join(DATA_DIR, "groups.json"), DEFAULT_GROUPS);

  // 清理任务记录
  clearJsonFile(path.join(DATA_DIR, "tasks.json"), []);

  // 清理性能指标数据
  clearJsonFile(path.join(DATA_DIR, "metrics.json"), []);

  // 恢复默认白屏检测配置
  clearJsonFile(
    path.join(DATA_DIR, "blank-screen-config.json"),
    DEFAULT_BLANK_SCREEN_CONFIG
  );

  console.log("\n✅ 数据清理完成！");
  console.log("\n📋 清理结果:");
  console.log("  ✓ 监控目标: 已清空");
  console.log("  ✓ 分组数据: 已恢复为默认分组");
  console.log("  ✓ 任务记录: 已清空");
  console.log("  ✓ 性能指标: 已清空");
  console.log("  ✓ 截图文件: 已清空");
  console.log("  ✓ 白屏检测配置: 已恢复默认");
  console.log("\n🚀 系统已恢复到初始状态，可以重新开始使用！");
}

// 确认清理操作
function confirmAndClear() {
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("⚠️  警告：此操作将清空所有监控数据，包括：");
  console.log("   - 所有监控目标");
  console.log("   - 所有分组（除默认分组外）");
  console.log("   - 所有任务记录");
  console.log("   - 所有性能指标数据");
  console.log("   - 所有截图文件");
  console.log("   - 白屏检测配置（恢复默认）");
  console.log("");

  rl.question('确定要继续吗？输入 "yes" 确认: ', (answer) => {
    if (answer.toLowerCase() === "yes") {
      rl.close();
      clearAllData();
    } else {
      console.log("操作已取消");
      rl.close();
    }
  });
}

// 检查是否有强制参数
if (process.argv.includes("--force") || process.argv.includes("-f")) {
  clearAllData();
} else {
  confirmAndClear();
}
