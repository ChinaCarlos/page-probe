import {
  AlertMetric,
  AlertOperator,
  DeviceType,
  PageStatus,
  PerformanceGrade,
} from "../constants";

// 资源类型枚举
export enum ResourceType {
  // 样式文件
  STYLESHEET = "stylesheet",

  // 脚本文件
  SCRIPT = "script",

  // 图片文件
  IMAGE = "image",
  IMAGE_JPG = "image-jpg",
  IMAGE_PNG = "image-png",
  IMAGE_GIF = "image-gif",
  IMAGE_WEBP = "image-webp",
  IMAGE_SVG = "image-svg",

  // 字体文件
  FONT = "font",
  FONT_WOFF = "font-woff",
  FONT_WOFF2 = "font-woff2",
  FONT_TTF = "font-ttf",
  FONT_OTF = "font-otf",
  FONT_EOT = "font-eot",

  // 视频文件
  VIDEO = "video",
  VIDEO_MP4 = "video-mp4",
  VIDEO_WEBM = "video-webm",

  // 音频文件
  AUDIO = "audio",
  AUDIO_MP3 = "audio-mp3",
  AUDIO_WAV = "audio-wav",
  AUDIO_OGG = "audio-ogg",

  // 文档文件
  DOCUMENT = "document",
  DOCUMENT_PDF = "document-pdf",
  DOCUMENT_WORD = "document-word",
  DOCUMENT_EXCEL = "document-excel",
  DOCUMENT_POWERPOINT = "document-powerpoint",

  // 数据文件
  DATA_JSON = "data-json",
  DATA_XML = "data-xml",

  // 压缩文件
  ARCHIVE = "archive",

  // Web应用清单
  MANIFEST = "manifest",

  // Service Worker
  SERVICEWORKER = "serviceworker",

  // WebAssembly
  WASM = "wasm",

  // 其他
  OTHER = "other",
}

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

// 静态资源信息
export interface ResourceInfo {
  url: string; // 资源URL
  size: number; // 资源大小（字节）
  loadTime: number; // 加载时长（毫秒）
  type: ResourceType; // 资源类型
  status: number; // HTTP状态码
  fromCache: boolean; // 是否来自缓存
}

// 资源统计信息
export interface ResourceStats {
  totalSize: number; // 总体积（字节）
  totalCount: number; // 总数量
  totalLoadTime: number; // 总加载时间（毫秒）
  byType: {
    [type: string]: {
      count: number;
      size: number;
      loadTime: number;
    };
  };
  resources: ResourceInfo[]; // 详细资源列表
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
  duration?: number;
  error?: string;
  resultId?: string; // 关联的监控结果ID
  pageStatus?: PageStatus; // 页面状态：正常/异常/未知/检测中
  pageStatusReason?: string; // 页面状态异常原因
  screenshots?: string[]; // 任务截图文件名列表
  sessionId?: string; // 监控会话ID，用于关联截图
  resourceStats?: ResourceStats; // 静态资源统计数据
}

// 任务统计
export interface TaskStats {
  totalTasks: number;
  pendingTasks: number;
  runningTasks: number;
  successTasks: number;
  failedTasks: number;
}
