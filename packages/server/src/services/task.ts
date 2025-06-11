import { v4 as uuidv4 } from "uuid";
import * as fs from "fs-extra";
import * as path from "path";
import { PageStatus } from "../constants";
import { MonitorTarget, MonitorTask, TaskStats, TaskStatus } from "../models";
import { monitorService } from "./monitor";
import { storage } from "./storage";

const DATA_DIR = path.join(__dirname, "../../data");
const TASKS_FILE = path.join(DATA_DIR, "tasks.json");

class TaskService {
  private tasks: MonitorTask[] = [];
  private runningTasks = new Set<string>(); // 正在运行的任务ID集合
  private maxConcurrentTasks = 2; // 默认最大并发数
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    // 启动时加载任务数据和配置（异步，不阻塞启动）
    this.loadTasks().catch(console.error);
    this.loadTaskConfig().catch(console.error);
    // 启动任务处理器
    this.startTaskProcessor();
  }

  // 加载任务数据
  private async loadTasks(): Promise<void> {
    try {
      await fs.ensureDir(DATA_DIR);
      if (await fs.pathExists(TASKS_FILE)) {
        const data = await fs.readJSON(TASKS_FILE);
        this.tasks = data || [];
        console.log(`加载任务数据: ${this.tasks.length} 个任务`);
      }
    } catch (error) {
      console.error("加载任务数据失败:", error);
      this.tasks = [];
    }
  }

  // 保存任务数据
  private async saveTasks(): Promise<void> {
    try {
      await fs.ensureDir(DATA_DIR);
      await fs.writeJSON(TASKS_FILE, this.tasks, { spaces: 2 });
    } catch (error) {
      console.error("保存任务数据失败:", error);
    }
  }

  // 加载任务配置
  private async loadTaskConfig(): Promise<void> {
    try {
      const config = await storage.getTaskConfig();
      this.maxConcurrentTasks = config.maxConcurrentTasks || 2;
      console.log(`加载任务配置: 最大并发数 = ${this.maxConcurrentTasks}`);
    } catch (error) {
      console.error("加载任务配置失败:", error);
      this.maxConcurrentTasks = 2; // 使用默认值
    }
  }

  // 重新加载任务配置（用于配置更新时热重载）
  async reloadTaskConfig(): Promise<void> {
    await this.loadTaskConfig();
    console.log(`任务配置已重新加载: 最大并发数 = ${this.maxConcurrentTasks}`);
  }

  // 创建单个监控任务
  async createTask(targetId: string): Promise<MonitorTask> {
    const targets = await storage.getTargets();
    const target = targets.find((t) => t.id === targetId);

    if (!target) {
      throw new Error("监控目标不存在");
    }

    const task: MonitorTask = {
      id: uuidv4(),
      targetId: target.id,
      targetName: target.name,
      targetUrl: target.url,
      deviceType: target.deviceType,
      status: TaskStatus.PENDING,
      pageStatus: PageStatus.QUEUED,
      createdAt: Date.now(),
    };

    this.tasks.push(task);
    await this.saveTasks(); // 保存任务数据
    console.log(`创建监控任务: ${task.targetName} (${task.id})`);

    // 立即检查是否可以启动新任务
    this.checkAndStartTasks().catch(console.error);

    return task;
  }

  // 批量创建监控任务
  async createBatchTasks(targetIds: string[]): Promise<MonitorTask[]> {
    const targets = await storage.getTargets();
    const validTargets = targets.filter((t) => targetIds.includes(t.id));

    if (validTargets.length === 0) {
      throw new Error("没有找到有效的监控目标");
    }

    const tasks: MonitorTask[] = validTargets.map((target) => ({
      id: uuidv4(),
      targetId: target.id,
      targetName: target.name,
      targetUrl: target.url,
      deviceType: target.deviceType,
      status: TaskStatus.PENDING,
      pageStatus: PageStatus.QUEUED,
      createdAt: Date.now(),
    }));

    this.tasks.push(...tasks);
    await this.saveTasks(); // 保存任务数据
    console.log(`批量创建监控任务: ${tasks.length} 个任务`);

    // 立即检查是否可以启动新任务
    this.checkAndStartTasks().catch(console.error);

    return tasks;
  }

  // 获取所有任务
  getTasks(): MonitorTask[] {
    return [...this.tasks].sort((a, b) => b.createdAt - a.createdAt);
  }

  // 获取指定目标的任务
  getTasksByTargetId(targetId: string): MonitorTask[] {
    return this.tasks
      .filter((task) => task.targetId === targetId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // 获取任务统计
  getTaskStats(): TaskStats {
    const total = this.tasks.length;
    const pending = this.tasks.filter(
      (t) => t.status === TaskStatus.PENDING
    ).length;
    const running = this.tasks.filter(
      (t) => t.status === TaskStatus.RUNNING
    ).length;
    const success = this.tasks.filter(
      (t) => t.status === TaskStatus.SUCCESS
    ).length;
    const failed = this.tasks.filter(
      (t) => t.status === TaskStatus.FAILED
    ).length;
    const successRate = total > 0 ? Math.round((success / total) * 100) : 0;

    return {
      total,
      pending,
      running,
      success,
      failed,
      successRate,
    };
  }

  // 删除任务
  async deleteTask(taskId: string): Promise<boolean> {
    const index = this.tasks.findIndex((t) => t.id === taskId);
    if (index === -1) {
      return false;
    }

    const task = this.tasks[index];
    // 只允许删除已完成或失败的任务
    if (
      task.status === TaskStatus.RUNNING ||
      task.status === TaskStatus.PENDING
    ) {
      throw new Error("无法删除正在进行或等待中的任务");
    }

    // 删除任务关联的截图
    if (task.screenshots && task.screenshots.length > 0) {
      try {
        const { monitorService } = await import("./monitor");
        await monitorService.cleanupTaskScreenshots(task.screenshots);
        console.log(`删除任务 ${task.id} 的 ${task.screenshots.length} 个截图`);
      } catch (error) {
        console.warn(`删除任务截图失败:`, error);
      }
    }

    this.tasks.splice(index, 1);
    await this.saveTasks(); // 保存任务数据
    console.log(`删除任务: ${task.targetName} (${task.id})`);
    return true;
  }

  // 删除指定目标的所有任务（用于删除监控目标时）
  async deleteTasksByTargetId(targetId: string): Promise<number> {
    const tasksToDelete = this.tasks.filter((t) => t.targetId === targetId);
    if (tasksToDelete.length === 0) {
      return 0;
    }

    let deletedCount = 0;
    let screenshotsToCleanup: string[] = [];

    // 收集所有需要删除的任务和截图
    for (const task of tasksToDelete) {
      // 如果任务正在运行，将其标记为取消
      if (task.status === TaskStatus.RUNNING) {
        this.runningTasks.delete(task.id);
        console.log(`取消正在运行的任务: ${task.targetName} (${task.id})`);
      }

      // 收集截图信息
      if (task.screenshots && task.screenshots.length > 0) {
        screenshotsToCleanup.push(...task.screenshots);
      }
    }

    // 从任务列表中移除所有相关任务
    const beforeLength = this.tasks.length;
    this.tasks = this.tasks.filter((t) => t.targetId !== targetId);
    deletedCount = beforeLength - this.tasks.length;

    // 保存任务数据
    await this.saveTasks();

    // 清理截图文件
    if (screenshotsToCleanup.length > 0) {
      try {
        const { monitorService } = await import("./monitor");
        await monitorService.cleanupTaskScreenshots(screenshotsToCleanup);
        console.log(
          `删除目标 ${targetId} 的 ${screenshotsToCleanup.length} 个截图`
        );
      } catch (error) {
        console.warn(`删除截图失败:`, error);
      }
    }

    console.log(`删除目标 ${targetId} 的 ${deletedCount} 个任务`);
    return deletedCount;
  }

  // 检查并启动新任务
  private async checkAndStartTasks() {
    // 获取等待处理的任务
    const pendingTasks = this.tasks.filter(
      (t) => t.status === TaskStatus.PENDING
    );

    if (pendingTasks.length === 0) {
      return;
    }

    // 计算当前可以启动的任务数量
    const availableSlots = this.maxConcurrentTasks - this.runningTasks.size;
    if (availableSlots <= 0) {
      return; // 已达到最大并发数
    }

    // 选择要启动的任务
    const tasksToStart = pendingTasks.slice(0, availableSlots);

    // 并行启动所有可用的任务
    for (const task of tasksToStart) {
      // 将任务标记为正在运行
      this.runningTasks.add(task.id);

      // 异步执行任务（不等待完成）
      this.processTask(task).finally(() => {
        // 任务完成后从运行集合中移除
        this.runningTasks.delete(task.id);

        // 立即检查是否可以启动新任务（流水线执行）
        this.checkAndStartTasks().catch(console.error);
      });
    }

    if (tasksToStart.length > 0) {
      console.log(
        `🚀 启动了 ${tasksToStart.length} 个并行任务，当前运行: ${this.runningTasks.size}/${this.maxConcurrentTasks}`
      );
    }
  }

  // 任务处理器
  private async startTaskProcessor() {
    // 立即检查一次
    await this.checkAndStartTasks();

    // 定期检查（作为备份机制，防止遗漏）
    this.processingInterval = setInterval(async () => {
      await this.checkAndStartTasks();
    }, 2000); // 降低检查频率，因为主要依靠任务完成时的触发
  }

  // 处理单个任务
  private async processTask(task: MonitorTask) {
    try {
      console.log(`开始执行任务: ${task.targetName} (${task.id})`);

      // 更新任务状态为运行中
      task.status = TaskStatus.RUNNING;
      task.startedAt = Date.now();
      task.pageStatus = PageStatus.CHECKING; // 设置为检测中状态
      await this.saveTasks(); // 保存任务数据

      // 获取目标信息
      const targets = await storage.getTargets();
      const target = targets.find((t) => t.id === task.targetId);

      if (!target) {
        throw new Error("监控目标不存在");
      }

      // 获取最新的白屏检测配置
      const blankScreenConfig = await storage.getBlankScreenConfig();
      console.log(`任务使用的白屏检测配置:`, {
        taskId: task.id,
        targetName: task.targetName,
        enabledChecks: {
          domStructure: blankScreenConfig.enableDOMStructureCheck,
          content: blankScreenConfig.enableContentCheck,
          textMatch: blankScreenConfig.enableTextMatchCheck,
          httpStatus: blankScreenConfig.enableHTTPStatusCheck,
          timeout: blankScreenConfig.enableTimeoutCheck,
        },
        thresholds: {
          domElementThreshold: blankScreenConfig.domElementThreshold,
          heightRatioThreshold: blankScreenConfig.heightRatioThreshold,
          textLengthThreshold: blankScreenConfig.textLengthThreshold,
        },
      });

      // 执行监控
      const result = await monitorService.monitorTargetImmediately(target);

      // 检查页面状态
      let pageStatus: PageStatus = PageStatus.UNKNOWN;
      let pageStatusReason = "";

      if (result.blankScreen) {
        if (result.blankScreen.isBlankScreen) {
          pageStatus = PageStatus.ABNORMAL;

          // 收集详细的异常原因
          const reasons = [];
          const details = result.blankScreen.details;

          if (details?.domStructure?.isBlank) {
            reasons.push(`DOM结构异常: ${details.domStructure.reason}`);
          }
          if (details?.textMatch?.hasError) {
            reasons.push(`异常文案检测: ${details.textMatch.reason}`);
          }
          if (details?.content?.isEmpty) {
            reasons.push(`页面内容检测: ${details.content.reason}`);
          }
          if (details?.httpStatus?.isError) {
            reasons.push(`HTTP状态异常: ${details.httpStatus.reason}`);
          }
          if (details?.timeout?.hasTimeout) {
            reasons.push(`超时检测: ${details.timeout.reason}`);
          }

          pageStatusReason =
            reasons.length > 0
              ? reasons.join("; ")
              : result.blankScreen.reason || "检测到白屏或页面异常";
        } else {
          pageStatus = PageStatus.NORMAL;
        }
      }

      // 任务成功完成
      task.status = TaskStatus.SUCCESS;
      task.completedAt = Date.now();
      task.duration = task.completedAt - (task.startedAt || task.createdAt);
      task.resultId = result.metrics.id;
      task.pageStatus = pageStatus;
      task.pageStatusReason = pageStatusReason;
      // 保存截图信息
      task.screenshots = result.metrics.screenshots || [];
      task.sessionId = result.metrics.sessionId;
      // 保存资源统计数据
      task.resourceStats = result.resourceStats;

      console.log(
        `任务执行成功: ${task.targetName} (${task.id}), 耗时: ${task.duration}ms`
      );
    } catch (error) {
      // 任务执行失败
      task.status = TaskStatus.FAILED;
      task.completedAt = Date.now();
      task.duration = task.completedAt - (task.startedAt || task.createdAt);
      task.error = error instanceof Error ? error.message : "未知错误";
      task.pageStatus = PageStatus.UNKNOWN; // 任务失败时设置为未知状态
      task.pageStatusReason = "任务执行失败，无法检测页面状态";

      console.error(`任务执行失败: ${task.targetName} (${task.id})`, error);
    } finally {
      await this.saveTasks(); // 保存任务数据
    }
  }

  // 清理完成的任务（可选，定期清理旧任务）
  cleanupOldTasks(maxAge: number = 7 * 24 * 60 * 60 * 1000) {
    // 默认保留7天
    const cutoff = Date.now() - maxAge;
    const before = this.tasks.length;

    this.tasks = this.tasks.filter((task) => {
      const isRecent = task.createdAt > cutoff;
      const isActive =
        task.status === TaskStatus.PENDING ||
        task.status === TaskStatus.RUNNING;
      return isRecent || isActive;
    });

    const after = this.tasks.length;
    if (before !== after) {
      console.log(`清理旧任务: ${before - after} 个任务被删除`);
    }
  }

  // 获取当前运行状态信息
  getProcessingStatus() {
    return {
      runningTasks: this.runningTasks.size,
      maxConcurrentTasks: this.maxConcurrentTasks,
      pendingTasks: this.tasks.filter((t) => t.status === TaskStatus.PENDING)
        .length,
      isAtCapacity: this.runningTasks.size >= this.maxConcurrentTasks,
    };
  }

  // 清理资源（用于服务关闭时）
  cleanup() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log("任务处理器已停止");
    }
  }
}

export const taskService = new TaskService();
