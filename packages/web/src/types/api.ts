import {
  AlertMetric,
  AlertOperator,
  DeviceType,
  PageStatus,
  PerformanceGrade,
} from "../constants";

// API 响应格式
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 目标分组类型
export interface TargetGroup {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: number;
  updatedAt?: number;
}

// 监控目标类型
export interface MonitorTarget {
  id: string;
  name: string;
  url: string;
  deviceType: DeviceType;
  groupId: string;
  groupName?: string; // 用于显示，后端查询时会填充
  createdAt: number;
}

// Web 性能指标类型
export interface WebVitalsMetrics {
  id: string;
  url: string;
  timestamp: number;
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte
  loadTime: number | null;
  domContentLoaded: number | null;
  targetId: string;
  deviceType: DeviceType;
  sessionId: string;
  screenshots: string[];
}

// 白屏检测类型
export interface BlankScreenDetection {
  id: string;
  targetId: string;
  url: string;
  timestamp: number;
  isBlankScreen: boolean;
  reason?: string;
  screenshot?: string;
  sessionId: string;
  deviceType: DeviceType;
}

// 告警规则
export interface AlertRule {
  id: string;
  name: string;
  targetId: string;
  metric: AlertMetric;
  operator: AlertOperator;
  threshold: number;
  enabled: boolean;
  createdAt: number;
}

// 告警记录
export interface AlertRecord {
  id: string;
  ruleId: string;
  targetId: string;
  metric: AlertMetric;
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
  resolved?: boolean;
  resolvedAt?: number;
}

// 监控统计
export interface MonitorStats {
  totalTargets: number;
  activeTargets: number;
  totalAlerts: number;
  activeAlerts: number;
  avgLCP: number;
  avgFID: number;
  avgCLS: number;
  blankScreenCount: number;
}

// 任务状态枚举
export enum TaskStatus {
  PENDING = "pending", // 未开始
  RUNNING = "running", // 执行中
  SUCCESS = "success", // 执行成功
  FAILED = "failed", // 执行失败
}

// 监控任务类型
export interface MonitorTask {
  id: string;
  targetId: string;
  targetName: string;
  targetUrl: string;
  deviceType: DeviceType;
  status: TaskStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  resultId?: string; // 关联的监控结果ID
  pageStatus?: PageStatus; // 页面状态：正常/异常/未知/检测中
  pageStatusReason?: string; // 页面状态异常原因
  screenshots?: string[]; // 任务截图文件名列表
  sessionId?: string; // 监控会话ID，用于关联截图
}

// 任务统计
export interface TaskStats {
  totalTasks: number;
  pendingTasks: number;
  runningTasks: number;
  successTasks: number;
  failedTasks: number;
}
