import { v4 as uuidv4 } from "uuid";
import { AlertMetric } from "../constants";
import {
  AlertRecord,
  AlertRule,
  BlankScreenDetection,
  WebVitalsMetrics,
} from "../models";
import { storage } from "./storage";

class AlertService {
  // 检查指标是否触发告警
  async checkAlerts(metrics: WebVitalsMetrics): Promise<void> {
    const rules = await storage.getAlertRules();
    const activeRules = rules.filter((rule) => rule.enabled);

    for (const rule of activeRules) {
      if (rule.targetId && rule.targetId !== metrics.targetId) {
        continue; // 跳过不匹配的目标
      }

      let value: number | null = null;
      switch (rule.metric) {
        case AlertMetric.LCP:
          value = metrics.lcp;
          break;
        case AlertMetric.FID:
          value = metrics.fid;
          break;
        case AlertMetric.CLS:
          value = metrics.cls;
          break;
      }

      if (value !== null && this.shouldTriggerAlert(value, rule)) {
        await this.triggerAlert(rule, value, metrics);
      }
    }
  }

  // 检查白屏是否触发告警
  async checkBlankScreenAlert(detection: BlankScreenDetection): Promise<void> {
    if (!detection.isBlankScreen) return;

    const rules = await storage.getAlertRules();
    const blankScreenRules = rules.filter(
      (rule) =>
        rule.enabled &&
        rule.metric === AlertMetric.BLANK_SCREEN &&
        (!rule.targetId || rule.targetId === detection.targetId)
    );

    for (const rule of blankScreenRules) {
      const alertRecord: AlertRecord = {
        id: uuidv4(),
        ruleId: rule.id,
        targetId: detection.targetId,
        metric: AlertMetric.BLANK_SCREEN,
        value: 1, // 白屏检测，1表示检测到白屏
        threshold: rule.threshold,
        message: `检测到白屏: ${detection.reason || "页面显示异常"}`,
        timestamp: Date.now(),
        resolved: false,
      };

      await storage.saveAlertRecord(alertRecord);
      console.log(`白屏告警触发: ${rule.name}`, alertRecord);
    }
  }

  private shouldTriggerAlert(value: number, rule: AlertRule): boolean {
    switch (rule.operator) {
      case "gt":
        return value > rule.threshold;
      case "lt":
        return value < rule.threshold;
      case "eq":
        return Math.abs(value - rule.threshold) < 0.001; // 浮点数比较
      default:
        return false;
    }
  }

  private async triggerAlert(
    rule: AlertRule,
    value: number,
    metrics: WebVitalsMetrics
  ): Promise<void> {
    const alertRecord: AlertRecord = {
      id: uuidv4(),
      ruleId: rule.id,
      targetId: metrics.targetId || "",
      metric: rule.metric,
      value,
      threshold: rule.threshold,
      message: `${rule.name}: ${rule.metric} = ${value} ${rule.operator} ${rule.threshold}`,
      timestamp: Date.now(),
      resolved: false,
    };

    await storage.saveAlertRecord(alertRecord);

    console.log(`告警触发: ${rule.name}`, alertRecord);

    // 这里可以添加其他告警通知方式，如邮件、短信、Webhook等
    // await this.sendNotification(alertRecord);
  }

  // 发送告警通知（预留接口）
  private async sendNotification(alertRecord: AlertRecord): Promise<void> {
    console.log("发送告警通知:", alertRecord);
    // TODO: 实现具体的通知逻辑
  }

  // 获取活跃告警（未解决的告警）
  async getActiveAlerts(): Promise<AlertRecord[]> {
    const records = await storage.getAlertRecords(24); // 获取最近24小时的告警
    return records.filter((record) => !record.resolved);
  }

  // 解决告警
  async resolveAlert(alertId: string): Promise<boolean> {
    const records = await storage.getAlertRecords(168); // 获取最近一周的告警
    const record = records.find((r) => r.id === alertId);

    if (!record) {
      return false;
    }

    record.resolved = true;
    record.resolvedAt = Date.now();

    // 这里需要更新存储中的记录
    // TODO: 实现更新单个记录的方法
    return true;
  }

  // 统计告警数据
  async getAlertStats(hours = 24): Promise<{
    total: number;
    active: number;
    resolved: number;
    byMetric: Record<string, number>;
  }> {
    const records = await storage.getAlertRecords(hours);

    const stats = {
      total: records.length,
      active: records.filter((r) => !r.resolved).length,
      resolved: records.filter((r) => r.resolved).length,
      byMetric: {} as Record<string, number>,
    };

    // 按指标统计
    records.forEach((record) => {
      const metric = record.metric;
      stats.byMetric[metric] = (stats.byMetric[metric] || 0) + 1;
    });

    return stats;
  }
}

export const alertService = new AlertService();
