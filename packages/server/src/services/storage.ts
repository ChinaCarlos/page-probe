import * as path from "path";
import * as fs from "fs-extra";
import { v4 as uuidv4 } from "uuid";
import {
  AlertRecord,
  AlertRule,
  BlankScreenConfig,
  BlankScreenDetection,
  MonitorTarget,
  TargetGroup,
  WebVitalsMetrics,
  MonitorTask,
  Tag,
} from "../models";
import { getDefaultBlankScreenConfig } from "../constants/blankScreen";

const DATA_DIR = path.join(__dirname, "../../data");

// 确保数据目录存在
fs.ensureDirSync(DATA_DIR);

class Storage {
  private dataFiles = {
    targets: path.join(DATA_DIR, "targets.json"),
    groups: path.join(DATA_DIR, "groups.json"),
    metrics: path.join(DATA_DIR, "metrics.json"),
    blankScreens: path.join(DATA_DIR, "blank-screens.json"),
    alertRules: path.join(DATA_DIR, "alert-rules.json"),
    alertRecords: path.join(DATA_DIR, "alert-records.json"),
    tags: path.join(DATA_DIR, "tags.json"),
  };

  // 通用读取方法
  private async readData<T>(filename: string): Promise<T[]> {
    try {
      const data = await fs.readJSON(filename);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }

  // 通用写入方法
  private async writeData<T>(filename: string, data: T[]): Promise<void> {
    await fs.writeJSON(filename, data, { spaces: 2 });
  }

  // 监控目标管理
  async getTargets(): Promise<MonitorTarget[]> {
    return this.readData<MonitorTarget>(this.dataFiles.targets);
  }

  async saveTarget(target: MonitorTarget): Promise<void> {
    const targets = await this.getTargets();
    targets.push(target);
    await this.writeData(this.dataFiles.targets, targets);
  }

  async saveTargets(targets: MonitorTarget[]): Promise<void> {
    await this.writeData(this.dataFiles.targets, targets);
  }

  async createTarget(
    target: Omit<MonitorTarget, "id" | "createdAt" | "updatedAt">
  ): Promise<MonitorTarget> {
    const targets = await this.getTargets();
    const newTarget: MonitorTarget = {
      ...target,
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    targets.push(newTarget);
    await this.writeData(this.dataFiles.targets, targets);
    return newTarget;
  }

  async updateTarget(
    id: string,
    updates: Partial<MonitorTarget>
  ): Promise<MonitorTarget | null> {
    const targets = await this.getTargets();
    const index = targets.findIndex((t) => t.id === id);
    if (index === -1) return null;

    targets[index] = {
      ...targets[index],
      ...updates,
      updatedAt: Date.now(),
    };
    await this.writeData(this.dataFiles.targets, targets);
    return targets[index];
  }

  async deleteTarget(id: string): Promise<boolean> {
    const targets = await this.getTargets();
    const target = targets.find((t) => t.id === id);
    if (!target) return false;

    // 删除目标本身
    const filtered = targets.filter((t) => t.id !== id);
    await this.writeData(this.dataFiles.targets, filtered);

    // 删除相关的性能指标数据
    const metrics = await this.readData<WebVitalsMetrics>(
      this.dataFiles.metrics
    );
    const filteredMetrics = metrics.filter((m) => m.targetId !== id);
    await this.writeData(this.dataFiles.metrics, filteredMetrics);

    // 删除相关的白屏检测记录
    const detections = await this.readData<BlankScreenDetection>(
      this.dataFiles.blankScreens
    );
    const filteredDetections = detections.filter((d) => d.targetId !== id);
    await this.writeData(this.dataFiles.blankScreens, filteredDetections);

    // 删除相关的告警规则
    const rules = await this.readData<AlertRule>(this.dataFiles.alertRules);
    const filteredRules = rules.filter((r) => r.targetId !== id);
    await this.writeData(this.dataFiles.alertRules, filteredRules);

    // 删除相关的告警记录
    const alertRecords = await this.readData<AlertRecord>(
      this.dataFiles.alertRecords
    );
    const filteredAlertRecords = alertRecords.filter((r) => r.targetId !== id);
    await this.writeData(this.dataFiles.alertRecords, filteredAlertRecords);

    // 清理截图文件（异步执行，不阻塞删除操作）
    try {
      const { monitorService } = await import("./monitor");
      monitorService.cleanupTargetScreenshots(id).catch((error) => {
        console.warn(`清理截图失败: ${target.name}`, error);
      });
    } catch (error) {
      console.warn("导入监控服务失败:", error);
    }

    console.log(`已删除目标 ${target.name} 及其所有相关数据`);
    return true;
  }

  // 性能指标管理
  async getMetrics(
    targetId?: string,
    hours?: number
  ): Promise<WebVitalsMetrics[]> {
    const metrics = await this.readData<WebVitalsMetrics>(
      this.dataFiles.metrics
    );
    let filtered = metrics;

    if (targetId) {
      filtered = filtered.filter((m) => m.targetId === targetId);
    }

    if (hours) {
      const cutoff = Date.now() - hours * 60 * 60 * 1000;
      filtered = filtered.filter((m) => m.timestamp >= cutoff);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  async getMetricsByTargetId(targetId: string): Promise<WebVitalsMetrics[]> {
    const metrics = await this.readData<WebVitalsMetrics>(
      this.dataFiles.metrics
    );
    return metrics.filter((m) => m.targetId === targetId);
  }

  async saveMetrics(metrics: WebVitalsMetrics): Promise<void> {
    const allMetrics = await this.readData<WebVitalsMetrics>(
      this.dataFiles.metrics
    );
    allMetrics.push(metrics);

    // 保留最近1000条记录
    if (allMetrics.length > 1000) {
      allMetrics.sort((a, b) => b.timestamp - a.timestamp);
      allMetrics.splice(1000);
    }

    await this.writeData(this.dataFiles.metrics, allMetrics);
  }

  // 白屏检测管理
  async getBlankScreenDetections(
    targetId?: string,
    hours?: number
  ): Promise<BlankScreenDetection[]> {
    const detections = await this.readData<BlankScreenDetection>(
      this.dataFiles.blankScreens
    );
    let filtered = detections;

    if (targetId) {
      filtered = filtered.filter((d) => d.targetId === targetId);
    }

    if (hours) {
      const cutoff = Date.now() - hours * 60 * 60 * 1000;
      filtered = filtered.filter((d) => d.timestamp >= cutoff);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  async saveBlankScreenDetection(
    detection: BlankScreenDetection
  ): Promise<void> {
    const detections = await this.readData<BlankScreenDetection>(
      this.dataFiles.blankScreens
    );
    detections.push(detection);

    // 保留最近500条记录
    if (detections.length > 500) {
      detections.sort((a, b) => b.timestamp - a.timestamp);
      detections.splice(500);
    }

    await this.writeData(this.dataFiles.blankScreens, detections);
  }

  // 告警规则管理
  async getAlertRules(targetId?: string): Promise<AlertRule[]> {
    const rules = await this.readData<AlertRule>(this.dataFiles.alertRules);
    return targetId ? rules.filter((r) => r.targetId === targetId) : rules;
  }

  async saveAlertRule(rule: AlertRule): Promise<void> {
    const rules = await this.getAlertRules();
    rules.push(rule);
    await this.writeData(this.dataFiles.alertRules, rules);
  }

  async createAlertRule(rule: Omit<AlertRule, "id">): Promise<AlertRule> {
    const rules = await this.getAlertRules();
    const newRule: AlertRule = {
      ...rule,
      id: uuidv4(),
    };
    rules.push(newRule);
    await this.writeData(this.dataFiles.alertRules, rules);
    return newRule;
  }

  async updateAlertRule(
    id: string,
    updates: Partial<AlertRule>
  ): Promise<AlertRule | null> {
    const rules = await this.getAlertRules();
    const index = rules.findIndex((r) => r.id === id);
    if (index === -1) return null;

    rules[index] = { ...rules[index], ...updates };
    await this.writeData(this.dataFiles.alertRules, rules);
    return rules[index];
  }

  async deleteAlertRule(id: string): Promise<boolean> {
    const rules = await this.getAlertRules();
    const filtered = rules.filter((r) => r.id !== id);
    if (filtered.length === rules.length) return false;

    await this.writeData(this.dataFiles.alertRules, filtered);
    return true;
  }

  // 告警记录管理
  async getAlertRecords(hours?: number): Promise<AlertRecord[]> {
    const records = await this.readData<AlertRecord>(
      this.dataFiles.alertRecords
    );
    let filtered = records;

    if (hours) {
      const cutoff = Date.now() - hours * 60 * 60 * 1000;
      filtered = filtered.filter((r) => r.timestamp >= cutoff);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  async saveAlertRecord(record: AlertRecord): Promise<void> {
    const records = await this.readData<AlertRecord>(
      this.dataFiles.alertRecords
    );
    records.push(record);

    // 保留最近1000条记录
    if (records.length > 1000) {
      records.sort((a, b) => b.timestamp - a.timestamp);
      records.splice(1000);
    }

    await this.writeData(this.dataFiles.alertRecords, records);
  }

  // 分组管理
  async getGroups(): Promise<TargetGroup[]> {
    return this.readData<TargetGroup>(this.dataFiles.groups);
  }

  async saveGroup(group: TargetGroup): Promise<void> {
    const groups = await this.getGroups();
    groups.push(group);
    await this.writeData(this.dataFiles.groups, groups);
  }

  async createGroup(
    group: Omit<TargetGroup, "id" | "createdAt" | "updatedAt">
  ): Promise<TargetGroup> {
    const groups = await this.getGroups();

    // 检查分组名称是否重复
    const existing = groups.find((g) => g.name === group.name);
    if (existing) {
      throw new Error(`分组名称 "${group.name}" 已存在`);
    }

    const newGroup: TargetGroup = {
      ...group,
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    groups.push(newGroup);
    await this.writeData(this.dataFiles.groups, groups);
    return newGroup;
  }

  async updateGroup(
    id: string,
    updates: Partial<TargetGroup>
  ): Promise<TargetGroup | null> {
    const groups = await this.getGroups();
    const index = groups.findIndex((g) => g.id === id);
    if (index === -1) return null;

    // 如果更新名称，检查是否重复
    if (updates.name && updates.name !== groups[index].name) {
      const existing = groups.find(
        (g) => g.name === updates.name && g.id !== id
      );
      if (existing) {
        throw new Error(`分组名称 "${updates.name}" 已存在`);
      }
    }

    groups[index] = {
      ...groups[index],
      ...updates,
      updatedAt: Date.now(),
    };
    await this.writeData(this.dataFiles.groups, groups);
    return groups[index];
  }

  async deleteGroup(id: string): Promise<boolean> {
    const groups = await this.getGroups();
    const group = groups.find((g) => g.id === id);
    if (!group) return false;

    // 获取该分组下的所有目标
    const targets = await this.getTargets();
    const groupTargets = targets.filter((t) => t.groupId === id);

    // 删除分组下的所有目标及其相关数据
    for (const target of groupTargets) {
      await this.deleteTarget(target.id);
    }

    // 删除分组本身
    const filtered = groups.filter((g) => g.id !== id);
    await this.writeData(this.dataFiles.groups, filtered);
    console.log(
      `已删除分组: ${group.name} 及其下的 ${groupTargets.length} 个目标`
    );
    return true;
  }

  // 获取带分组信息的目标列表
  async getTargetsWithGroups(): Promise<
    (MonitorTarget & { groupName?: string })[]
  > {
    const targets = await this.getTargets();
    const groups = await this.getGroups();

    return targets.map((target) => {
      const group = groups.find((g) => g.id === target.groupId);
      return {
        ...target,
        groupName: group?.name || "未知分组",
      };
    });
  }

  // 确保默认分组存在
  async ensureDefaultGroup(): Promise<TargetGroup> {
    const groups = await this.getGroups();
    let defaultGroup = groups.find((g) => g.name === "默认分组");

    if (!defaultGroup) {
      defaultGroup = await this.createGroup({
        name: "默认分组",
        color: "#1890ff",
        description: "系统默认分组",
      });
    }

    return defaultGroup;
  }

  // 白屏检测配置管理
  async getBlankScreenConfig(): Promise<BlankScreenConfig> {
    try {
      const configData = await fs.readFile(
        path.join(DATA_DIR, "blank-screen-config.json"),
        "utf-8"
      );
      return JSON.parse(configData);
    } catch (error) {
      // 返回默认配置（使用常量）
      const defaultConfig: BlankScreenConfig = {
        id: uuidv4(),
        ...getDefaultBlankScreenConfig(),
        createdAt: Date.now(),
      };
      await this.saveBlankScreenConfig(defaultConfig);
      return defaultConfig;
    }
  }

  async saveBlankScreenConfig(config: BlankScreenConfig): Promise<void> {
    config.updatedAt = Date.now();
    await fs.writeFile(
      path.join(DATA_DIR, "blank-screen-config.json"),
      JSON.stringify(config, null, 2)
    );
  }

  // 标签管理方法
  async getTags(): Promise<Tag[]> {
    if (!(await fs.pathExists(this.dataFiles.tags))) {
      await this.saveTags([]);
      return [];
    }
    const data = await fs.readJSON(this.dataFiles.tags);
    return data;
  }

  async saveTags(tags: Tag[]): Promise<void> {
    await fs.writeJSON(this.dataFiles.tags, tags, { spaces: 2 });
  }

  async addTag(tag: Omit<Tag, "id" | "createdAt" | "updatedAt">): Promise<Tag> {
    const tags = await this.getTags();
    const newTag: Tag = {
      ...tag,
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    tags.push(newTag);
    await this.saveTags(tags);
    return newTag;
  }

  async updateTag(
    id: string,
    updates: Partial<Omit<Tag, "id" | "createdAt">>
  ): Promise<Tag | null> {
    const tags = await this.getTags();
    const index = tags.findIndex((tag) => tag.id === id);
    if (index === -1) return null;

    tags[index] = {
      ...tags[index],
      ...updates,
      updatedAt: Date.now(),
    };
    await this.saveTags(tags);
    return tags[index];
  }

  async deleteTag(id: string): Promise<boolean> {
    const tags = await this.getTags();
    const index = tags.findIndex((tag) => tag.id === id);
    if (index === -1) return false;

    // 删除标签时，需要从所有监控目标中移除该标签
    const targets = await this.getTargets();
    const updatedTargets = targets.map((target) => ({
      ...target,
      tagIds: target.tagIds?.filter((tagId) => tagId !== id) || [],
    }));
    await this.saveTargets(updatedTargets);

    tags.splice(index, 1);
    await this.saveTags(tags);
    return true;
  }

  // 更新监控目标方法，支持标签
  async getTargetsWithTags(): Promise<MonitorTarget[]> {
    const targets = await this.getTargets();
    const tags = await this.getTags();
    const groups = await this.getGroups();

    return targets.map((target) => {
      const targetTags =
        (target.tagIds
          ?.map((tagId) => tags.find((tag) => tag.id === tagId))
          .filter(Boolean) as Tag[]) || [];

      const group = groups.find((g) => g.id === target.groupId);

      return {
        ...target,
        tags: targetTags,
        groupName: group?.name,
      };
    });
  }
}

export const storage = new Storage();
