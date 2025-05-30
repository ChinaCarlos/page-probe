#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

/**
 * 标签ID迁移脚本
 * 将现有的时间戳格式标签ID迁移为UUID格式
 * 同时更新所有监控目标中对标签ID的引用
 */

const DATA_DIR = path.join(__dirname, "../packages/server/data");
const TAGS_FILE = path.join(DATA_DIR, "tags.json");
const TARGETS_FILE = path.join(DATA_DIR, "targets.json");

// 颜色定义
const COLORS = {
  RESET: "\x1b[0m",
  BRIGHT: "\x1b[1m",
  DIM: "\x1b[2m",
  RED: "\x1b[31m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
  BLUE: "\x1b[34m",
  MAGENTA: "\x1b[35m",
  CYAN: "\x1b[36m",
};

function log(color, message) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

function isTimestampId(id) {
  // 检查是否为时间戳格式的ID（13位数字）
  return /^\d{13}$/.test(id);
}

async function migrateTagIds() {
  try {
    log(COLORS.CYAN, "🔄 开始迁移标签ID...\n");

    // 1. 检查文件是否存在
    if (!fs.existsSync(TAGS_FILE)) {
      log(COLORS.YELLOW, "⚠️  标签文件不存在，跳过迁移");
      return;
    }

    if (!fs.existsSync(TARGETS_FILE)) {
      log(COLORS.YELLOW, "⚠️  目标文件不存在，跳过迁移");
      return;
    }

    // 2. 读取现有数据
    log(COLORS.BLUE, "📖 读取现有数据...");
    const tags = JSON.parse(fs.readFileSync(TAGS_FILE, "utf-8"));
    const targets = JSON.parse(fs.readFileSync(TARGETS_FILE, "utf-8"));

    // 3. 检查是否需要迁移
    const timestampTags = tags.filter((tag) => isTimestampId(tag.id));
    if (timestampTags.length === 0) {
      log(COLORS.GREEN, "✅ 所有标签ID已经是UUID格式，无需迁移");
      return;
    }

    log(
      COLORS.YELLOW,
      `📊 发现 ${timestampTags.length} 个需要迁移的时间戳格式标签ID`
    );

    // 4. 创建ID映射表
    const idMapping = {};
    timestampTags.forEach((tag) => {
      const newId = uuidv4();
      idMapping[tag.id] = newId;
      log(COLORS.DIM, `   "${tag.name}": ${tag.id} → ${newId}`);
    });

    // 5. 备份原始文件
    log(COLORS.BLUE, "💾 备份原始文件...");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const tagsBackup = `${TAGS_FILE}.backup.${timestamp}`;
    const targetsBackup = `${TARGETS_FILE}.backup.${timestamp}`;

    fs.copyFileSync(TAGS_FILE, tagsBackup);
    fs.copyFileSync(TARGETS_FILE, targetsBackup);
    log(COLORS.GREEN, `   标签备份: ${path.basename(tagsBackup)}`);
    log(COLORS.GREEN, `   目标备份: ${path.basename(targetsBackup)}`);

    // 6. 更新标签数据
    log(COLORS.BLUE, "🔄 更新标签数据...");
    const updatedTags = tags.map((tag) => {
      if (isTimestampId(tag.id)) {
        return {
          ...tag,
          id: idMapping[tag.id],
          updatedAt: Date.now(),
        };
      }
      return tag;
    });

    // 7. 更新监控目标中的标签引用
    log(COLORS.BLUE, "🔄 更新监控目标中的标签引用...");
    let updatedTargetCount = 0;
    const updatedTargets = targets.map((target) => {
      if (target.tagIds && Array.isArray(target.tagIds)) {
        const originalTagIds = [...target.tagIds];
        const newTagIds = target.tagIds.map((tagId) => {
          return idMapping[tagId] || tagId; // 如果有映射就使用新ID，否则保持原样
        });

        // 检查是否有变化
        const hasChanges = originalTagIds.some(
          (id, index) => id !== newTagIds[index]
        );

        if (hasChanges) {
          updatedTargetCount++;
          log(
            COLORS.DIM,
            `   目标 "${target.name}": 更新了 ${originalTagIds.length} 个标签引用`
          );
          return {
            ...target,
            tagIds: newTagIds,
            updatedAt: Date.now(),
          };
        }
      }
      return target;
    });

    // 8. 保存更新后的数据
    log(COLORS.BLUE, "💾 保存更新后的数据...");
    fs.writeFileSync(TAGS_FILE, JSON.stringify(updatedTags, null, 2));
    fs.writeFileSync(TARGETS_FILE, JSON.stringify(updatedTargets, null, 2));

    // 9. 显示迁移结果
    log(COLORS.GREEN, "\n✅ 标签ID迁移完成！");
    log(COLORS.BRIGHT, "📊 迁移统计:");
    log(COLORS.RESET, `   • 迁移标签数量: ${timestampTags.length}`);
    log(COLORS.RESET, `   • 更新目标数量: ${updatedTargetCount}`);
    log(COLORS.RESET, `   • 总标签数量: ${updatedTags.length}`);
    log(COLORS.RESET, `   • 总目标数量: ${updatedTargets.length}`);

    log(COLORS.CYAN, "\n📁 备份文件位置:");
    log(COLORS.DIM, `   ${tagsBackup}`);
    log(COLORS.DIM, `   ${targetsBackup}`);

    log(COLORS.YELLOW, "\n💡 提示: 如果迁移有问题，可以从备份文件恢复");
  } catch (error) {
    log(COLORS.RED, `❌ 迁移失败: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// 确认操作
function confirmMigration() {
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("⚠️  警告：此操作将修改标签和监控目标数据");
  console.log("📋 迁移内容：");
  console.log("   - 将时间戳格式的标签ID转换为UUID格式");
  console.log("   - 更新所有监控目标中对这些标签的引用");
  console.log("   - 自动创建数据备份");
  console.log("");

  rl.question('确定要继续吗？输入 "yes" 确认: ', (answer) => {
    if (answer.toLowerCase() === "yes") {
      rl.close();
      migrateTagIds();
    } else {
      console.log("操作已取消");
      rl.close();
    }
  });
}

// 检查是否有强制参数
if (process.argv.includes("--force") || process.argv.includes("-f")) {
  migrateTagIds();
} else {
  confirmMigration();
}
