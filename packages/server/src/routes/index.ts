import Router from "koa-router";
import { v4 as uuidv4 } from "uuid";
import {
  AlertRecord,
  AlertRule,
  ApiResponse,
  BlankScreenConfig,
  MonitorStats,
  MonitorTarget,
  TargetGroup,
} from "../models";
import { alertService } from "../services/alert";
import { monitorService } from "../services/monitor";
import { storage } from "../services/storage";
import { taskService } from "../services/task";

const router = new Router({ prefix: "/api" });

// 健康检查
router.get("/health", async (ctx) => {
  ctx.body = { status: "ok", timestamp: new Date().toISOString() };
});

// 获取所有监控目标
router.get("/targets", async (ctx) => {
  try {
    const targets = await storage.getTargetsWithTags();

    // 为每个目标获取最新的任务状态
    const targetsWithStatus = await Promise.all(
      targets.map(async (target) => {
        // 获取该目标的最新任务
        const tasks = taskService.getTasksByTargetId(target.id);
        const latestTask = tasks.length > 0 ? tasks[tasks.length - 1] : null;

        return {
          ...target,
          pageStatus: latestTask?.pageStatus || "unknown",
          pageStatusReason: latestTask?.pageStatusReason || "",
          lastTaskTime: latestTask?.createdAt || null,
        };
      })
    );

    ctx.body = { success: true, data: targetsWithStatus };
  } catch (error) {
    console.error("获取监控目标失败:", error);
    ctx.status = 500;
    ctx.body = { success: false, error: "获取监控目标失败" };
  }
});

// 获取单个监控目标
router.get("/targets/:id", async (ctx) => {
  try {
    const { id } = ctx.params;
    const targets = await storage.getTargetsWithGroups();
    const target = targets.find((t) => t.id === id);

    if (!target) {
      ctx.status = 404;
      ctx.body = { error: "监控目标不存在" };
      return;
    }

    ctx.body = { data: target };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: "获取监控目标失败" };
  }
});

// 创建监控目标
router.post("/targets", async (ctx) => {
  try {
    const targetData = ctx.request.body as any;

    // 确保分组存在
    const groups = await storage.getGroups();
    let targetGroupId = targetData.groupId;

    if (!targetGroupId) {
      // 如果没有指定分组，使用默认分组
      const defaultGroup = groups.find((g) => g.name === "默认分组");
      targetGroupId = defaultGroup?.id || groups[0]?.id;
    } else {
      // 验证分组是否存在
      const groupExists = groups.some((g) => g.id === targetGroupId);
      if (!groupExists) {
        ctx.status = 400;
        ctx.body = { success: false, error: "指定的分组不存在" };
        return;
      }
    }

    const target: MonitorTarget = {
      id: uuidv4(),
      name: targetData.name,
      url: targetData.url,
      deviceType: targetData.deviceType || "desktop",
      groupId: targetGroupId,
      tagIds: targetData.tagIds || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await storage.saveTarget(target);

    console.log(`新目标添加成功: ${target.name} (${target.id})`);

    ctx.body = { data: target, message: "监控目标创建成功" };
  } catch (error) {
    console.error("创建监控目标失败:", error);
    ctx.status = 500;
    ctx.body = { success: false, error: "创建监控目标失败" };
  }
});

// 批量导入监控目标
router.post("/targets/batch-import", async (ctx) => {
  try {
    const importData = ctx.request.body as any;

    if (!importData.targets || !Array.isArray(importData.targets)) {
      ctx.status = 400;
      ctx.body = { success: false, error: "无效的导入数据格式" };
      return;
    }

    const results = [];
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const targetData of importData.targets) {
      try {
        // 验证必填字段
        if (!targetData.name || !targetData.url) {
          const error = `目标 "${
            targetData.name || targetData.url
          }" 缺少必填字段`;
          errors.push(error);
          results.push({
            target: targetData,
            success: false,
            error,
          });
          failedCount++;
          continue;
        }

        // 验证分组ID是否存在
        if (targetData.groupId) {
          const groups = await storage.getGroups();
          const groupExists = groups.some((g) => g.id === targetData.groupId);
          if (!groupExists) {
            const error = `目标 "${targetData.name}" 的分组ID不存在`;
            errors.push(error);
            results.push({
              target: targetData,
              success: false,
              error,
            });
            failedCount++;
            continue;
          }
        }

        // 验证标签ID是否存在
        if (targetData.tagIds && Array.isArray(targetData.tagIds)) {
          const tags = await storage.getTags();
          const invalidTagIds = targetData.tagIds.filter(
            (tagId: string) => !tags.some((t) => t.id === tagId)
          );
          if (invalidTagIds.length > 0) {
            const error = `目标 "${
              targetData.name
            }" 包含无效的标签ID: ${invalidTagIds.join(", ")}`;
            errors.push(error);
            results.push({
              target: targetData,
              success: false,
              error,
            });
            failedCount++;
            continue;
          }
        }

        // 创建监控目标
        const target = {
          id: uuidv4(),
          name: targetData.name,
          url: targetData.url,
          deviceType: targetData.deviceType || "desktop",
          groupId: targetData.groupId,
          tagIds: targetData.tagIds || [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        await storage.saveTarget(target);

        results.push({
          target: targetData,
          success: true,
        });
        successCount++;
      } catch (error) {
        const errorMsg = `创建目标 "${targetData.name}" 失败: ${error}`;
        errors.push(errorMsg);
        results.push({
          target: targetData,
          success: false,
          error: errorMsg,
        });
        failedCount++;
      }
    }

    ctx.body = {
      success: true,
      data: {
        success: successCount,
        failed: failedCount,
        errors,
        details: results,
      },
      message: `批量导入完成: ${successCount} 个成功, ${failedCount} 个失败`,
    };
  } catch (error) {
    console.error("批量导入失败:", error);
    ctx.status = 500;
    ctx.body = { success: false, error: "批量导入失败" };
  }
});

// 更新监控目标
router.put("/targets/:id", async (ctx) => {
  try {
    const { id } = ctx.params;
    const updateData = ctx.request.body as any;

    const targets = await storage.getTargets();
    const index = targets.findIndex((target) => target.id === id);
    if (index === -1) {
      ctx.status = 404;
      ctx.body = { success: false, error: "监控目标不存在" };
      return;
    }

    // 如果更新了分组，验证分组是否存在
    if (updateData.groupId) {
      const groups = await storage.getGroups();
      const groupExists = groups.some((g) => g.id === updateData.groupId);
      if (!groupExists) {
        ctx.status = 400;
        ctx.body = { success: false, error: "指定的分组不存在" };
        return;
      }
    }

    targets[index] = {
      ...targets[index],
      ...updateData,
      tagIds: updateData.tagIds || [], // 支持标签更新
      updatedAt: Date.now(),
    };

    await storage.saveTargets(targets);
    ctx.body = { success: true, data: targets[index] };
  } catch (error) {
    console.error("更新监控目标失败:", error);
    ctx.status = 500;
    ctx.body = { success: false, error: "更新监控目标失败" };
  }
});

// 批量删除监控目标（必须在单个删除路由之前）
router.delete("/targets/batch", async (ctx) => {
  try {
    const { targetIds } = ctx.request.body as any;

    if (!targetIds || !Array.isArray(targetIds) || targetIds.length === 0) {
      ctx.status = 400;
      ctx.body = { error: "缺少有效的目标ID列表" };
      return;
    }

    let deletedCount = 0;
    for (const targetId of targetIds) {
      const success = await storage.deleteTarget(targetId);
      if (success) {
        deletedCount++;
      }
    }

    ctx.body = {
      message: `批量删除完成: ${deletedCount} 个目标删除成功`,
      data: { deletedCount, totalRequested: targetIds.length },
    };
  } catch (error) {
    console.error("批量删除目标失败:", error);
    ctx.status = 500;
    ctx.body = { error: "批量删除目标失败" };
  }
});

// 删除监控目标
router.delete("/targets/:id", async (ctx) => {
  try {
    const { id } = ctx.params;
    const success = await storage.deleteTarget(id);

    if (!success) {
      ctx.status = 404;
      ctx.body = { error: "监控目标不存在" };
      return;
    }

    ctx.body = { message: "监控目标及相关数据删除成功" };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: "删除监控目标失败" };
  }
});

// 启动监控
router.post("/targets/:id/monitor", async (ctx) => {
  try {
    const { id } = ctx.params;
    const targets = await storage.getTargets();
    const target = targets.find((t) => t.id === id);

    if (!target) {
      ctx.status = 404;
      ctx.body = { error: "监控目标不存在" };
      return;
    }

    // 立即执行监控
    await monitorService.monitorTargetImmediately(target);

    ctx.body = { message: "监控已启动" };
  } catch (error) {
    console.error("启动监控失败:", error);
    ctx.status = 500;
    ctx.body = { error: "启动监控失败" };
  }
});

// 获取目标详情和历史数据
router.get("/targets/:id/details", async (ctx) => {
  try {
    const { id } = ctx.params;
    const { hours = 24 } = ctx.query;

    const targets = await storage.getTargets();
    const target = targets.find((t) => t.id === id);

    if (!target) {
      ctx.status = 404;
      ctx.body = { error: "监控目标不存在" };
      return;
    }

    // 获取历史数据
    const history = await monitorService.getTargetHistory(
      id,
      Number.parseInt(hours as string) || 24
    );

    // 获取相关告警规则
    const allRules = await storage.getAlertRules();
    const targetRules = allRules.filter((rule) => rule.targetId === id);

    // 获取最近的告警记录
    const allAlerts = await storage.getAlertRecords(
      Number.parseInt(hours as string) || 24
    );
    const targetAlerts = allAlerts.filter((alert) => alert.targetId === id);

    // 格式化为四位小数的辅助函数
    const formatToFourDecimals = (value: number): number => {
      return Number(value.toFixed(4));
    };

    ctx.body = {
      data: {
        target,
        metrics: history.metrics,
        blankScreens: history.blankScreens,
        alertRules: targetRules,
        alerts: targetAlerts,
        summary: {
          totalChecks: history.metrics.length,
          blankScreenCount: history.blankScreens.filter((b) => b.isBlankScreen)
            .length,
          alertCount: targetAlerts.length,
          lastCheck:
            history.metrics.length > 0
              ? Math.max(...history.metrics.map((m) => m.timestamp))
              : null,
          avgLCP:
            history.metrics.length > 0
              ? formatToFourDecimals(
                  history.metrics
                    .filter((m) => m.lcp !== null)
                    .reduce((sum, m) => sum + (m.lcp || 0), 0) /
                    history.metrics.filter((m) => m.lcp !== null).length
                )
              : null,
          avgFID:
            history.metrics.length > 0
              ? formatToFourDecimals(
                  history.metrics
                    .filter((m) => m.fid !== null)
                    .reduce((sum, m) => sum + (m.fid || 0), 0) /
                    history.metrics.filter((m) => m.fid !== null).length
                )
              : null,
          avgCLS:
            history.metrics.length > 0
              ? formatToFourDecimals(
                  history.metrics
                    .filter((m) => m.cls !== null)
                    .reduce((sum, m) => sum + (m.cls || 0), 0) /
                    history.metrics.filter((m) => m.cls !== null).length
                )
              : null,
        },
      },
    };
  } catch (error) {
    console.error("获取目标详情失败:", error);
    ctx.status = 500;
    ctx.body = { error: "获取目标详情失败" };
  }
});

// 获取性能指标
router.get("/metrics", async (ctx) => {
  try {
    const { hours = 24, targetId } = ctx.query;
    const metrics = await storage.getMetrics(
      targetId as string,
      Number.parseInt(hours as string)
    );
    ctx.body = { data: metrics };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: "获取性能指标失败" };
  }
});

// 获取白屏检测结果
router.get("/blank-screens", async (ctx) => {
  try {
    const { hours = 24 } = ctx.query;
    const detections = await storage.getBlankScreenDetections(
      undefined,
      Number.parseInt(hours as string)
    );
    ctx.body = { data: detections };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: "获取白屏检测结果失败" };
  }
});

// 获取告警规则
router.get("/alert-rules", async (ctx) => {
  try {
    const rules = await storage.getAlertRules();
    ctx.body = { data: rules };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: "获取告警规则失败" };
  }
});

// 创建告警规则
router.post("/alert-rules", async (ctx) => {
  try {
    const ruleData = ctx.request.body as any;
    const rule: AlertRule = {
      id: uuidv4(),
      name: ruleData.name,
      targetId: ruleData.targetId,
      metric: ruleData.metric,
      operator: ruleData.operator,
      threshold: ruleData.threshold,
      enabled: ruleData.enabled ?? true,
      createdAt: Date.now(),
    };

    await storage.saveAlertRule(rule);
    ctx.body = { data: rule, message: "告警规则创建成功" };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: "创建告警规则失败" };
  }
});

// 获取告警记录
router.get("/alert-records", async (ctx) => {
  try {
    const { hours = 24 } = ctx.query;
    const records = await storage.getAlertRecords(
      Number.parseInt(hours as string)
    );
    ctx.body = { data: records };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: "获取告警记录失败" };
  }
});

// 获取截图
router.get("/screenshots/:filename", async (ctx) => {
  try {
    const { filename } = ctx.params;
    const fs = require("fs-extra");
    const path = require("path");

    const screenshotPath = path.join(__dirname, "../../screenshots", filename);

    if (!fs.existsSync(screenshotPath)) {
      ctx.status = 404;
      ctx.body = { error: "截图文件不存在" };
      return;
    }

    ctx.type = "image/png";
    ctx.body = fs.createReadStream(screenshotPath);
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: "获取截图失败" };
  }
});

// 统计数据
router.get("/stats", async (ctx) => {
  try {
    const targets = await storage.getTargets();
    const metrics = await storage.getMetrics(undefined, 24); // 最近24小时
    const alerts = await storage.getAlertRecords(24);
    const blankScreens = await storage.getBlankScreenDetections(undefined, 24);

    // 计算平均值
    const lcpValues = metrics
      .map((m) => m.lcp)
      .filter((v) => v !== null) as number[];
    const fidValues = metrics
      .map((m) => m.fid)
      .filter((v) => v !== null) as number[];
    const clsValues = metrics
      .map((m) => m.cls)
      .filter((v) => v !== null) as number[];

    // 格式化为四位小数的辅助函数
    const formatToFourDecimals = (value: number): number => {
      return Number(value.toFixed(4));
    };

    const stats: MonitorStats = {
      totalTargets: targets.length,
      activeTargets: targets.length,
      totalChecks: metrics.length,
      avgLCP:
        lcpValues.length > 0
          ? formatToFourDecimals(
              lcpValues.reduce((a, b) => a + b, 0) / lcpValues.length
            )
          : 0,
      avgFID:
        fidValues.length > 0
          ? formatToFourDecimals(
              fidValues.reduce((a, b) => a + b, 0) / fidValues.length
            )
          : 0,
      avgCLS:
        clsValues.length > 0
          ? formatToFourDecimals(
              clsValues.reduce((a, b) => a + b, 0) / clsValues.length
            )
          : 0,
      blankScreenRate: formatToFourDecimals(
        blankScreens.filter((b) => b.isBlankScreen).length /
          Math.max(metrics.length, 1)
      ),
      alertCount: alerts.length,
    };

    ctx.body = { success: true, data: stats } as ApiResponse;
  } catch (error) {
    ctx.body = { success: false, error: "获取统计数据失败" } as ApiResponse;
  }
});

// 分组管理API

// 获取所有分组
router.get("/groups", async (ctx) => {
  try {
    const groups = await storage.getGroups();
    ctx.body = { data: groups };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: "获取分组失败" };
  }
});

// 获取单个分组
router.get("/groups/:id", async (ctx) => {
  try {
    const { id } = ctx.params;
    const groups = await storage.getGroups();
    const group = groups.find((g) => g.id === id);

    if (!group) {
      ctx.status = 404;
      ctx.body = { error: "分组不存在" };
      return;
    }

    ctx.body = { data: group };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: "获取分组失败" };
  }
});

// 创建分组
router.post("/groups", async (ctx) => {
  try {
    const groupData = ctx.request.body as any;

    // 验证分组名称长度
    if (!groupData.name || groupData.name.trim().length === 0) {
      ctx.status = 400;
      ctx.body = { error: "分组名称不能为空" };
      return;
    }

    if (groupData.name.length > 10) {
      ctx.status = 400;
      ctx.body = { error: "分组名称不能超过10个字符" };
      return;
    }

    const group = await storage.createGroup({
      name: groupData.name.trim(),
      color: groupData.color || "#1890ff",
      description: groupData.description || "",
    });

    ctx.body = { data: group, message: "分组创建成功" };
  } catch (error) {
    if (error instanceof Error && error.message.includes("已存在")) {
      ctx.status = 400;
      ctx.body = { error: error.message };
    } else {
      ctx.status = 500;
      ctx.body = { error: "创建分组失败" };
    }
  }
});

// 更新分组
router.put("/groups/:id", async (ctx) => {
  try {
    const { id } = ctx.params;
    const updateData = ctx.request.body as any;

    // 验证分组名称长度
    if (updateData.name !== undefined) {
      if (!updateData.name || updateData.name.trim().length === 0) {
        ctx.status = 400;
        ctx.body = { error: "分组名称不能为空" };
        return;
      }

      if (updateData.name.length > 10) {
        ctx.status = 400;
        ctx.body = { error: "分组名称不能超过10个字符" };
        return;
      }

      updateData.name = updateData.name.trim();
    }

    const updatedGroup = await storage.updateGroup(id, updateData);

    if (!updatedGroup) {
      ctx.status = 404;
      ctx.body = { error: "分组不存在" };
      return;
    }

    ctx.body = { data: updatedGroup, message: "分组更新成功" };
  } catch (error) {
    if (error instanceof Error && error.message.includes("已存在")) {
      ctx.status = 400;
      ctx.body = { error: error.message };
    } else {
      ctx.status = 500;
      ctx.body = { error: "更新分组失败" };
    }
  }
});

// 删除分组
router.delete("/groups/:id", async (ctx) => {
  try {
    const { id } = ctx.params;
    const success = await storage.deleteGroup(id);

    if (!success) {
      ctx.status = 404;
      ctx.body = { error: "分组不存在" };
      return;
    }

    ctx.body = { message: "分组删除成功" };
  } catch (error) {
    if (error instanceof Error && error.message.includes("还有监控目标")) {
      ctx.status = 400;
      ctx.body = { error: error.message };
    } else {
      ctx.status = 500;
      ctx.body = { error: "删除分组失败" };
    }
  }
});

// 获取分组下的目标数量
router.get("/groups/:id/targets/count", async (ctx) => {
  try {
    const { id } = ctx.params;
    const targets = await storage.getTargets();
    const count = targets.filter((t) => t.groupId === id).length;

    ctx.body = { data: { count } };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: "获取分组目标数量失败" };
  }
});

// 任务管理API

// 创建单个监控任务
router.post("/tasks", async (ctx) => {
  try {
    const { targetId } = ctx.request.body as any;

    if (!targetId) {
      ctx.status = 400;
      ctx.body = { error: "缺少目标ID" };
      return;
    }

    const task = await taskService.createTask(targetId);
    ctx.body = { data: task, message: "监控任务创建成功" };
  } catch (error) {
    console.error("创建监控任务失败:", error);
    ctx.status = 500;
    ctx.body = {
      error: error instanceof Error ? error.message : "创建监控任务失败",
    };
  }
});

// 批量创建监控任务
router.post("/tasks/batch", async (ctx) => {
  try {
    const { targetIds } = ctx.request.body as any;

    if (!targetIds || !Array.isArray(targetIds) || targetIds.length === 0) {
      ctx.status = 400;
      ctx.body = { error: "缺少有效的目标ID列表" };
      return;
    }

    const tasks = await taskService.createBatchTasks(targetIds);
    ctx.body = {
      data: tasks,
      message: `批量创建监控任务成功: ${tasks.length} 个任务`,
    };
  } catch (error) {
    console.error("批量创建监控任务失败:", error);
    ctx.status = 500;
    ctx.body = {
      error: error instanceof Error ? error.message : "批量创建监控任务失败",
    };
  }
});

// 获取所有任务
router.get("/tasks", async (ctx) => {
  try {
    const { targetId } = ctx.query;

    let tasks;
    if (targetId) {
      tasks = taskService.getTasksByTargetId(targetId as string);
    } else {
      tasks = taskService.getTasks();
    }

    ctx.body = { data: tasks };
  } catch (error) {
    console.error("获取任务列表失败:", error);
    ctx.status = 500;
    ctx.body = { error: "获取任务列表失败" };
  }
});

// 获取任务统计
router.get("/tasks/stats", async (ctx) => {
  try {
    const stats = taskService.getTaskStats();
    ctx.body = { data: stats };
  } catch (error) {
    console.error("获取任务统计失败:", error);
    ctx.status = 500;
    ctx.body = { error: "获取任务统计失败" };
  }
});

// 删除任务
router.delete("/tasks/:id", async (ctx) => {
  try {
    const { id } = ctx.params;
    const success = taskService.deleteTask(id);

    if (!success) {
      ctx.status = 404;
      ctx.body = { error: "任务不存在" };
      return;
    }

    ctx.body = { message: "任务删除成功" };
  } catch (error) {
    console.error("删除任务失败:", error);
    ctx.status = 400;
    ctx.body = {
      error: error instanceof Error ? error.message : "删除任务失败",
    };
  }
});

// 白屏检测配置路由
router.get("/blank-screen-config", async (ctx) => {
  try {
    const config = await storage.getBlankScreenConfig();
    ctx.body = { success: true, data: config };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error instanceof Error ? error.message : "获取配置失败",
    };
  }
});

router.put("/blank-screen-config", async (ctx) => {
  try {
    const config = ctx.request.body as BlankScreenConfig;
    await storage.saveBlankScreenConfig(config);
    ctx.body = { success: true, message: "配置保存成功" };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error instanceof Error ? error.message : "保存配置失败",
    };
  }
});

// 标签管理路由
// 获取所有标签
router.get("/tags", async (ctx) => {
  try {
    const tags = await storage.getTags();
    ctx.body = { success: true, data: tags };
  } catch (error) {
    console.error("获取标签失败:", error);
    ctx.status = 500;
    ctx.body = { success: false, error: "获取标签失败" };
  }
});

// 创建标签
router.post("/tags", async (ctx) => {
  try {
    const tagData = ctx.request.body as any;

    // 验证标签名称长度
    if (!tagData.name || tagData.name.trim().length === 0) {
      ctx.status = 400;
      ctx.body = { success: false, error: "标签名称不能为空" };
      return;
    }

    if (tagData.name.length > 20) {
      ctx.status = 400;
      ctx.body = { success: false, error: "标签名称不能超过20个字符" };
      return;
    }

    // 检查标签名称是否已存在
    const existingTags = await storage.getTags();
    if (existingTags.some((tag) => tag.name === tagData.name.trim())) {
      ctx.status = 400;
      ctx.body = { success: false, error: "标签名称已存在" };
      return;
    }

    const tag = await storage.addTag({
      name: tagData.name.trim(),
      color: tagData.color || "#1890ff",
      description: tagData.description?.trim() || "",
    });

    ctx.body = { success: true, data: tag };
  } catch (error) {
    console.error("创建标签失败:", error);
    ctx.status = 500;
    ctx.body = { success: false, error: "创建标签失败" };
  }
});

// 更新标签
router.put("/tags/:id", async (ctx) => {
  try {
    const { id } = ctx.params;
    const updateData = ctx.request.body as any;

    // 验证标签名称长度
    if (updateData.name !== undefined) {
      if (!updateData.name || updateData.name.trim().length === 0) {
        ctx.status = 400;
        ctx.body = { success: false, error: "标签名称不能为空" };
        return;
      }

      if (updateData.name.length > 20) {
        ctx.status = 400;
        ctx.body = { success: false, error: "标签名称不能超过20个字符" };
        return;
      }

      // 检查标签名称是否已存在（排除当前标签）
      const existingTags = await storage.getTags();
      if (
        existingTags.some(
          (tag) => tag.id !== id && tag.name === updateData.name.trim()
        )
      ) {
        ctx.status = 400;
        ctx.body = { success: false, error: "标签名称已存在" };
        return;
      }
    }

    const updatedTag = await storage.updateTag(id, {
      name: updateData.name?.trim(),
      color: updateData.color,
      description: updateData.description?.trim(),
    });

    if (!updatedTag) {
      ctx.status = 404;
      ctx.body = { success: false, error: "标签不存在" };
      return;
    }

    ctx.body = { success: true, data: updatedTag };
  } catch (error) {
    console.error("更新标签失败:", error);
    ctx.status = 500;
    ctx.body = { success: false, error: "更新标签失败" };
  }
});

// 删除标签
router.delete("/tags/:id", async (ctx) => {
  try {
    const { id } = ctx.params;
    const success = await storage.deleteTag(id);

    if (!success) {
      ctx.status = 404;
      ctx.body = { success: false, error: "标签不存在" };
      return;
    }

    ctx.body = { success: true };
  } catch (error) {
    console.error("删除标签失败:", error);
    ctx.status = 500;
    ctx.body = { success: false, error: "删除标签失败" };
  }
});

export default router;
