// 设备类型枚举
export enum DeviceType {
  MOBILE = "mobile",
  DESKTOP = "desktop",
}

// 页面状态枚举
export enum PageStatus {
  NORMAL = "normal", // 正常
  ABNORMAL = "abnormal", // 异常
  UNKNOWN = "unknown", // 未知
  CHECKING = "checking", // 检测中
  QUEUED = "queued", // 队列中
}

// 移动设备配置
export const MOBILE_DEVICE_CONFIG = {
  "iPhone 12": {
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
    viewport: {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    },
  },
  "iPhone SE": {
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
    viewport: {
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    },
  },
  Android: {
    userAgent:
      "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36",
    viewport: {
      width: 360,
      height: 640,
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    },
  },
} as const;

// 桌面设备配置
export const DESKTOP_DEVICE_CONFIG = {
  viewport: {
    width: 1920,
    height: 1080,
  },
} as const;

// 性能等级枚举
export enum PerformanceGrade {
  S = "S",
  A_PLUS = "A+",
  A = "A",
  A_MINUS = "A-",
  B_PLUS = "B+",
  B = "B",
  B_MINUS = "B-",
  C = "C",
  D = "D",
}

// 性能等级分数阈值
export const PERFORMANCE_GRADE_THRESHOLDS = {
  [PerformanceGrade.S]: 95,
  [PerformanceGrade.A_PLUS]: 90,
  [PerformanceGrade.A]: 80,
  [PerformanceGrade.A_MINUS]: 70,
  [PerformanceGrade.B_PLUS]: 60,
  [PerformanceGrade.B]: 50,
  [PerformanceGrade.B_MINUS]: 40,
  [PerformanceGrade.C]: 30,
  [PerformanceGrade.D]: 0,
} as const;

// 性能指标类型枚举
export enum MetricType {
  LCP = "lcp",
  FID = "fid",
  CLS = "cls",
  FCP = "fcp",
  TTFB = "ttfb",
}

// 性能指标权重
export const METRIC_WEIGHTS = {
  [MetricType.LCP]: 0.35,
  [MetricType.FID]: 0.25,
  [MetricType.CLS]: 0.25,
  [MetricType.FCP]: 0.1,
  [MetricType.TTFB]: 0.05,
} as const;

// 性能指标阈值
export const METRIC_THRESHOLDS = {
  [MetricType.LCP]: {
    excellent: 2500,
    good: 4000,
    needsImprovement: 6000,
  },
  [MetricType.FID]: {
    excellent: 100,
    good: 300,
    needsImprovement: 500,
  },
  [MetricType.CLS]: {
    excellent: 0.1,
    good: 0.25,
    needsImprovement: 0.5,
  },
  [MetricType.FCP]: {
    excellent: 1800,
    good: 3000,
    needsImprovement: 5000,
  },
  [MetricType.TTFB]: {
    excellent: 800,
    good: 1800,
    needsImprovement: 3000,
  },
} as const;

// 截图阶段枚举
export enum ScreenshotStage {
  FP = "fp",
  FCP = "fcp",
  LCP = "lcp",
  DOM_CONTENT_LOADED = "domContentLoaded",
  LOAD = "load",
  TTI = "tti",
  BLANK_SCREEN_CHECK = "blank_screen_check",
  ERROR = "error",
}

// 告警指标枚举
export enum AlertMetric {
  LCP = "lcp",
  FID = "fid",
  CLS = "cls",
  BLANK_SCREEN = "blank_screen",
}

// 告警操作符枚举
export enum AlertOperator {
  GREATER_THAN = "gt",
  LESS_THAN = "lt",
  EQUAL = "eq",
}

// Chrome 路径配置
export const CHROME_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", // macOS
  "/usr/bin/google-chrome", // Linux
  "/usr/bin/chromium-browser", // Linux Chromium
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // Windows
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe", // Windows 32-bit
] as const;

// 监控配置常量
export const MONITOR_CONFIG = {
  TIMEOUT: 30000, // 30秒超时
  WAIT_TIME: 5000, // 等待5秒收集指标
  CLS_WAIT_TIME: 2000, // CLS额外等待2秒
  CHECK_INTERVAL: 200, // 每200ms检查一次时机
  INTERACTION_WAIT: 500, // 交互等待时间
} as const;

// 默认设备选择
export const DEFAULT_MOBILE_DEVICE = "iPhone 12" as const;
