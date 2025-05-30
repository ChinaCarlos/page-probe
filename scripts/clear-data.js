#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * 数据清理脚本
 * 执行此脚本将清空所有监控数据，包括：
 * - 监控目标
 * - 分组数据
 * - 标签数据
 * - 任务记录
 * - 性能指标数据
 * - 白屏检测结果
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

// 默认标签数据
const DEFAULT_TAGS = [
  {
    id: "tag-001",
    name: "重要页面",
    color: "#f50",
    description: "核心业务页面",
    createdAt: Date.now(),
  },
  {
    id: "tag-002",
    name: "测试页面",
    color: "#2db7f5",
    description: "测试环境页面",
    createdAt: Date.now(),
  },
];

// 默认错误文案关键词（与后端常量保持一致）
const DEFAULT_ERROR_TEXT_KEYWORDS = [
  // 基础404关键词
  "404",
  "not found",
  "page not found",
  "页面不存在",
  "页面未找到",
  "找不到页面",
  "页面丢失",
  "无法找到",
  "访问的页面不存在",
  "file not found",
  "document not found",

  // 服务器错误关键词
  "服务器错误",
  "internal server error",
  "网站维护中",
  "暂时无法访问",
  "系统错误",
  "500 error",
  "502 bad gateway",
  "503 service unavailable",
  "504 gateway timeout",

  // 网络错误关键词
  "网络错误",
  "连接超时",
  "请求超时",
  "网络异常",
  "connection timeout",
  "request timeout",
  "network error",

  // 权限错误关键词
  "访问被拒绝",
  "权限不足",
  "未授权访问",
  "access denied",
  "unauthorized",
  "forbidden",

  // 其他常见错误
  "加载失败",
  "load failed",
  "出错了",
  "something went wrong",
  "系统繁忙",
  "system busy",
];

// 默认错误状态码（与后端常量保持一致）
const DEFAULT_ERROR_STATUS_CODES = [
  // 4xx 客户端错误
  400, 401, 403, 404, 405, 408, 409, 410, 429,
  // 5xx 服务器错误
  500, 501, 502, 503, 504, 505, 507, 508, 510, 511,
];

// 默认白屏检测配置
const DEFAULT_BLANK_SCREEN_CONFIG = {
  id: "blank-screen-config-001",
  // 检测规则开关
  enableDOMStructureCheck: true,
  enableContentCheck: true,
  enableTextMatchCheck: true,
  enableHTTPStatusCheck: true,
  enableTimeoutCheck: true,
  enableAICheck: false, // AI检测默认关闭（预留功能）
  enablePixelCheck: false, // 像素检测默认关闭（预留功能）

  // 检测参数
  domElementThreshold: 3,
  heightRatioThreshold: 0.15,
  textLengthThreshold: 10,
  domLoadTimeout: 8000,
  pageLoadTimeout: 10000,

  // AI检测参数（预留）
  aiConfidenceThreshold: 0.8,
  aiModelVersion: "v1.0",

  // 像素算法检测参数（预留）
  pixelSimilarityThreshold: 0.85,
  pixelColorThreshold: 30,
  pixelWhiteRatio: 0.9,

  // 错误关键词和状态码（使用常量）
  errorTextKeywords: DEFAULT_ERROR_TEXT_KEYWORDS,
  errorStatusCodes: DEFAULT_ERROR_STATUS_CODES,

  createdAt: Date.now(),
  updatedAt: Date.now(),
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
 * 创建.gitkeep文件
 */
function createGitkeep(dirPath) {
  const gitkeepPath = path.join(dirPath, ".gitkeep");
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, "");
    console.log(`创建 .gitkeep: ${gitkeepPath}`);
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

  // 3. 创建.gitkeep文件
  createGitkeep(DATA_DIR);
  createGitkeep(SCREENSHOTS_DIR);

  // 4. 清理各种数据文件
  console.log("📊 清理数据文件...");

  // 清理监控目标
  clearJsonFile(path.join(DATA_DIR, "targets.json"), []);

  // 清理分组数据（保留默认分组）
  clearJsonFile(path.join(DATA_DIR, "groups.json"), DEFAULT_GROUPS);

  // 清理标签数据（保留默认标签）
  clearJsonFile(path.join(DATA_DIR, "tags.json"), DEFAULT_TAGS);

  // 清理任务记录
  clearJsonFile(path.join(DATA_DIR, "tasks.json"), []);

  // 清理性能指标数据
  clearJsonFile(path.join(DATA_DIR, "metrics.json"), []);

  // 清理白屏检测结果
  clearJsonFile(path.join(DATA_DIR, "blank-screens.json"), []);

  // 恢复默认白屏检测配置
  clearJsonFile(
    path.join(DATA_DIR, "blank-screen-config.json"),
    DEFAULT_BLANK_SCREEN_CONFIG
  );

  console.log("\n✅ 数据清理完成！");
  console.log("\n📋 清理结果:");
  console.log("  ✓ 监控目标: 已清空");
  console.log("  ✓ 分组数据: 已恢复为默认分组");
  console.log("  ✓ 标签数据: 已恢复为默认标签");
  console.log("  ✓ 任务记录: 已清空");
  console.log("  ✓ 性能指标: 已清空");
  console.log("  ✓ 白屏检测结果: 已清空");
  console.log("  ✓ 截图文件: 已清空");
  console.log("  ✓ 白屏检测配置: 已恢复默认（包含完整错误关键词和状态码）");
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
  console.log("   - 所有标签（除默认标签外）");
  console.log("   - 所有任务记录");
  console.log("   - 所有性能指标数据");
  console.log("   - 所有白屏检测结果");
  console.log("   - 所有截图文件");
  console.log("   - 白屏检测配置（恢复为包含完整错误关键词的默认配置）");
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
