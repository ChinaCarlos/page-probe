import * as fs from "fs-extra";
import * as path from "path";
import { storage } from "./storage";
import { getDefaultBlankScreenConfig } from "../constants/blankScreen";
import { BlankScreenConfig } from "../models";
import { v4 as uuidv4 } from "uuid";

const DATA_DIR = path.join(__dirname, "../../data");

/**
 * 项目初始化服务
 * 负责强制初始化默认配置和数据
 */
class InitializationService {
  /**
   * 强制初始化白屏检测配置
   * 无论配置文件是否存在，都会创建/覆盖默认配置
   */
  async forceInitializeBlankScreenConfig(): Promise<void> {
    try {
      console.log("正在强制初始化白屏检测配置...");

      // 创建默认配置
      const defaultConfig: BlankScreenConfig = {
        id: uuidv4(),
        ...getDefaultBlankScreenConfig(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // 保存默认配置到存储
      await storage.saveBlankScreenConfig(defaultConfig);

      console.log("✅ 白屏检测配置强制初始化完成");
      console.log(
        `   - 错误文案关键词: ${defaultConfig.errorTextKeywords.length} 个`
      );
      console.log(
        `   - 错误状态码: ${defaultConfig.errorStatusCodes.length} 个`
      );
      console.log(
        `   - 检测方法开关: ${
          Object.keys(defaultConfig).filter((key) => key.startsWith("enable"))
            .length
        } 个`
      );
    } catch (error) {
      console.error("❌ 白屏检测配置强制初始化失败:", error);
      throw error;
    }
  }

  /**
   * 完全初始化所有系统配置（用于脚本调用）
   * 会强制重新创建所有默认配置
   */
  async initializeAll(): Promise<void> {
    console.log("🔧 开始完全初始化系统配置...");

    try {
      // 确保数据目录存在
      await fs.ensureDir(DATA_DIR);

      // 强制初始化白屏检测配置
      await this.forceInitializeBlankScreenConfig();

      // 可以在这里添加其他强制初始化任务
      // await this.forceInitializeOtherConfigs();

      console.log("🎉 系统配置完全初始化完成");
    } catch (error) {
      console.error("❌ 系统配置完全初始化失败:", error);
      throw error;
    }
  }
}

// 导出单例实例
export const initializationService = new InitializationService();
