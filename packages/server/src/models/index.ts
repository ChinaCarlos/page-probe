import {
  AlertMetric,
  AlertOperator,
  DeviceType,
  PageStatus,
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

// 目标分组
export interface TargetGroup {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: number;
  updatedAt?: number;
}

// 性能指标类型
export interface WebVitalsMetrics {
  id: string;
  targetId?: string; // 目标ID
  url: string;
  timestamp: number;
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte
  loadTime?: number | null; // 页面加载时间
  domContentLoaded?: number | null; // DOM内容加载完成时间
  deviceType?: DeviceType; // 设备类型
  sessionId?: string; // 监控会话ID
  screenshots?: string[]; // 截图文件名列表
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
  reasons?: string[]; // 详细的异常原因列表
  enabledChecks?: {
    // 记录哪些检测项被启用
    domStructure?: boolean;
    content?: boolean;
    textMatch?: boolean;
    httpStatus?: boolean;
    timeout?: boolean;
  };
  details?: {
    domStructure?: {
      isBlank: boolean;
      reason?: string;
      elementCount: number;
      bodyHeight: number;
      htmlHeight: number;
      screenHeight: number;
      heightRatio: number;
    };
    content?: {
      isEmpty: boolean;
      reason?: string;
      hasText: boolean;
      hasImages: boolean;
      hasBackgrounds: boolean;
      hasCanvas: boolean;
      textLength: number;
    };
    textMatch?: {
      hasError: boolean;
      reason?: string;
      foundTexts: string[];
    };
    httpStatus?: {
      isError: boolean;
      reason?: string;
      statusCode?: number;
      statusText?: string;
    };
    timeout?: {
      hasTimeout: boolean;
      reason?: string;
      domLoadTime: number;
      pageLoadTime: number;
      domContentLoaded: boolean;
      loadEvent: boolean;
    };
    pageLoadStatus?: any;
    pageInfo?: {
      url: string;
      title: string;
      readyState: string;
      hasBody: boolean;
      bodyHTML: string;
      viewport: {
        width: number;
        height: number;
      };
    };
    config?: any; // 使用的配置信息
  };
}

// 标签接口
export interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

// 监控目标接口
export interface MonitorTarget {
  id: string;
  name: string;
  url: string;
  deviceType: DeviceType;
  groupId: string;
  groupName?: string;
  tagIds?: string[]; // 新增标签ID数组
  tags?: Tag[]; // 新增标签信息
  createdAt: number;
  updatedAt: number;
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

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 监控统计
export interface MonitorStats {
  totalTargets: number;
  activeTargets: number;
  totalChecks: number;
  avgLCP: number;
  avgFID: number;
  avgCLS: number;
  blankScreenRate: number;
  alertCount: number;
}

// 任务状态枚举
export enum TaskStatus {
  PENDING = "pending",
  RUNNING = "running",
  SUCCESS = "success",
  FAILED = "failed",
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

// 监控任务
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
  resultId?: string; // 监控结果ID，用于关联WebVitalsMetrics
  pageStatus?: PageStatus; // 页面状态：正常/异常/未知/检测中
  pageStatusReason?: string; // 页面状态异常原因
  screenshots?: string[]; // 任务截图文件名列表
  sessionId?: string; // 监控会话ID，用于关联截图
  resourceStats?: ResourceStats; // 静态资源统计数据
}

// 任务统计
export interface TaskStats {
  total: number;
  pending: number;
  running: number;
  success: number;
  failed: number;
  successRate: number;
}

// 白屏检测配置
export interface BlankScreenConfig {
  id?: string;
  // 检测规则开关 - 7种主要检测类型
  enableDOMStructureCheck: boolean; // DOM结构检测（元素数量、页面高度）
  enableContentCheck: boolean; // 页面内容检测（文本、图片、背景等）
  enableTextMatchCheck: boolean; // 文案匹配检测（404文案、自定义异常文案）
  enableHTTPStatusCheck: boolean; // HTTP状态检测（标准错误码、自定义状态码）
  enableTimeoutCheck: boolean; // 加载超时检测
  enableAICheck: boolean; // AI智能检测（预留功能）
  enablePixelCheck?: boolean; // 像素算法检测（预留功能）

  // DOM结构检测参数
  domElementThreshold: number; // DOM元素数量阈值，默认3
  heightRatioThreshold: number; // 页面高度比例阈值，默认0.15 (15%)

  // 页面内容检测参数
  textLengthThreshold: number; // 有效文本长度阈值，默认10

  // 加载超时检测参数
  domLoadTimeout: number; // DOM加载超时时间(ms)，默认8000
  pageLoadTimeout: number; // 页面加载超时时间(ms)，默认10000

  // AI检测参数（预留）
  aiConfidenceThreshold: number; // AI检测置信度阈值，默认0.8
  aiModelVersion: string; // AI模型版本，默认"v1.0"

  // 像素算法检测参数（预留）
  pixelSimilarityThreshold?: number; // 像素相似度阈值，默认0.85
  pixelColorThreshold?: number; // 颜色差异阈值，默认30
  pixelWhiteRatio?: number; // 白色像素比例阈值，默认0.9

  // 文案匹配检测 - 合并404文案和自定义异常文案
  errorTextKeywords: string[]; // 错误文案关键词列表（包含404文案和自定义异常文案）

  // HTTP状态检测 - 合并标准错误码和自定义状态码
  errorStatusCodes: number[]; // 错误状态码列表（包含标准错误码和自定义状态码）

  createdAt?: number;
  updatedAt?: number;
}
