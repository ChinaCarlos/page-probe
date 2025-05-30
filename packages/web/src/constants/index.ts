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

// 设备类型配置
export const DEVICE_TYPE_CONFIG = {
  [DeviceType.MOBILE]: {
    label: "移动端",
    icon: "MobileOutlined",
    color: "green",
    viewport: { width: 390, height: 844 },
  },
  [DeviceType.DESKTOP]: {
    label: "桌面端",
    icon: "DesktopOutlined",
    color: "blue",
    viewport: { width: 1920, height: 1080 },
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

// 性能等级配置
export const PERFORMANCE_GRADE_CONFIG = {
  [PerformanceGrade.S]: {
    label: "S级",
    description: "极优 - 性能表现卓越，用户体验极佳",
    color: "#722ed1",
    scoreThreshold: 95,
  },
  [PerformanceGrade.A_PLUS]: {
    label: "A+级",
    description: "优秀+ - 性能表现优秀，用户体验很好",
    color: "#52c41a",
    scoreThreshold: 90,
  },
  [PerformanceGrade.A]: {
    label: "A级",
    description: "优秀 - 性能表现良好，用户体验好",
    color: "#52c41a",
    scoreThreshold: 80,
  },
  [PerformanceGrade.A_MINUS]: {
    label: "A-级",
    description: "良好+ - 性能表现尚可，用户体验较好",
    color: "#1890ff",
    scoreThreshold: 70,
  },
  [PerformanceGrade.B_PLUS]: {
    label: "B+级",
    description: "良好 - 性能表现一般，有优化空间",
    color: "#1890ff",
    scoreThreshold: 60,
  },
  [PerformanceGrade.B]: {
    label: "B级",
    description: "一般 - 性能表现中等，建议优化",
    color: "#faad14",
    scoreThreshold: 50,
  },
  [PerformanceGrade.B_MINUS]: {
    label: "B-级",
    description: "一般- - 性能表现较差，需要优化",
    color: "#faad14",
    scoreThreshold: 40,
  },
  [PerformanceGrade.C]: {
    label: "C级",
    description: "较差 - 性能表现差，急需优化",
    color: "#fa8c16",
    scoreThreshold: 30,
  },
  [PerformanceGrade.D]: {
    label: "D级",
    description: "很差 - 性能表现很差，严重影响用户体验",
    color: "#ff4d4f",
    scoreThreshold: 0,
  },
} as const;

// 性能指标类型枚举
export enum MetricType {
  LCP = "lcp",
  FID = "fid",
  CLS = "cls",
  FCP = "fcp",
  TTFB = "ttfb",
}

// 性能指标配置
export const METRIC_CONFIG = {
  [MetricType.LCP]: {
    name: "最大内容绘制 (LCP)",
    description: "页面主要内容加载完成的时间。好的LCP应该在2.5秒以内。",
    unit: "ms",
    thresholds: {
      excellent: 2500,
      good: 4000,
      needsImprovement: 6000,
    },
    colors: {
      excellent: "#52c41a",
      good: "#fa8c16",
      poor: "#f5222d",
    },
  },
  [MetricType.FID]: {
    name: "首次输入延迟 (FID)",
    description:
      "用户首次与页面交互到浏览器响应的时间。好的FID应该在100毫秒以内。",
    unit: "ms",
    thresholds: {
      excellent: 100,
      good: 300,
      needsImprovement: 500,
    },
    colors: {
      excellent: "#52c41a",
      good: "#fa8c16",
      poor: "#f5222d",
    },
  },
  [MetricType.CLS]: {
    name: "累积布局偏移 (CLS)",
    description: "页面加载过程中元素位置变化的累积量。好的CLS应该小于0.1。",
    unit: "",
    thresholds: {
      excellent: 0.1,
      good: 0.25,
      needsImprovement: 0.5,
    },
    colors: {
      excellent: "#52c41a",
      good: "#fa8c16",
      poor: "#f5222d",
    },
  },
  [MetricType.FCP]: {
    name: "首次内容绘制 (FCP)",
    description: "页面开始渲染任何内容的时间。好的FCP应该在1.8秒以内。",
    unit: "ms",
    thresholds: {
      excellent: 1800,
      good: 3000,
      needsImprovement: 5000,
    },
    colors: {
      excellent: "#52c41a",
      good: "#fa8c16",
      poor: "#f5222d",
    },
  },
  [MetricType.TTFB]: {
    name: "首字节时间 (TTFB)",
    description: "服务器响应第一个字节的时间。好的TTFB应该在800毫秒以内。",
    unit: "ms",
    thresholds: {
      excellent: 800,
      good: 1800,
      needsImprovement: 3000,
    },
    colors: {
      excellent: "#52c41a",
      good: "#fa8c16",
      poor: "#f5222d",
    },
  },
} as const;

// 状态枚举
export enum StatusType {
  GOOD = "good",
  NEEDS_IMPROVEMENT = "needs-improvement",
  POOR = "poor",
  UNKNOWN = "unknown",
}

// 状态配置
export const STATUS_CONFIG = {
  [StatusType.GOOD]: {
    label: "良好",
    color: "green",
    className: "text-success-600 bg-success-50",
  },
  [StatusType.NEEDS_IMPROVEMENT]: {
    label: "需要改进",
    color: "orange",
    className: "text-warning-600 bg-warning-50",
  },
  [StatusType.POOR]: {
    label: "差",
    color: "red",
    className: "text-danger-600 bg-danger-50",
  },
  [StatusType.UNKNOWN]: {
    label: "未知",
    color: "gray",
    className: "text-gray-600 bg-gray-50",
  },
} as const;

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

// 告警操作符配置
export const ALERT_OPERATOR_CONFIG = {
  [AlertOperator.GREATER_THAN]: {
    label: "大于",
    symbol: ">",
  },
  [AlertOperator.LESS_THAN]: {
    label: "小于",
    symbol: "<",
  },
  [AlertOperator.EQUAL]: {
    label: "等于",
    symbol: "=",
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

// 截图阶段配置
export const SCREENSHOT_STAGE_CONFIG = {
  [ScreenshotStage.FP]: {
    label: "首次绘制",
    description: "页面开始绘制的时机",
  },
  [ScreenshotStage.FCP]: {
    label: "首次内容绘制",
    description: "页面首次绘制文本或图像的时机",
  },
  [ScreenshotStage.LCP]: {
    label: "最大内容绘制",
    description: "页面主要内容加载完成的时机",
  },
  [ScreenshotStage.DOM_CONTENT_LOADED]: {
    label: "DOM加载完成",
    description: "HTML文档完全加载和解析的时机",
  },
  [ScreenshotStage.LOAD]: {
    label: "页面加载完成",
    description: "所有资源（图片、样式等）加载完成的时机",
  },
  [ScreenshotStage.TTI]: {
    label: "可交互时间",
    description: "页面变为完全可交互的时机",
  },
  [ScreenshotStage.BLANK_SCREEN_CHECK]: {
    label: "白屏检测",
    description: "检查页面是否为白屏的时机",
  },
  [ScreenshotStage.ERROR]: {
    label: "错误截图",
    description: "页面加载出错时的截图",
  },
} as const;

// 颜色常量
export const COLORS = {
  PRIMARY: "#1890ff",
  SUCCESS: "#52c41a",
  WARNING: "#faad14",
  ERROR: "#f5222d",
  INFO: "#1890ff",
  PURPLE: "#722ed1",
  ORANGE: "#fa8c16",
  GRAY: "#8c8c8c",

  // Tailwind CSS 类名
  TEXT_RED_500: "text-red-500",
  TEXT_GREEN_500: "text-green-500",
  TEXT_YELLOW_500: "text-yellow-500",
  TEXT_BLUE_500: "text-blue-500",
  TEXT_GRAY_400: "text-gray-400",
  TEXT_GRAY_600: "text-gray-600",
} as const;

// 时间范围枚举
export enum TimeRange {
  ONE_HOUR = 1,
  SIX_HOURS = 6,
  ONE_DAY = 24,
  ONE_WEEK = 168,
}

// 时间范围配置
export const TIME_RANGE_CONFIG = {
  [TimeRange.ONE_HOUR]: {
    label: "过去1小时",
    description: "最近1小时的数据",
  },
  [TimeRange.SIX_HOURS]: {
    label: "过去6小时",
    description: "最近6小时的数据",
  },
  [TimeRange.ONE_DAY]: {
    label: "过去24小时",
    description: "最近24小时的数据",
  },
  [TimeRange.ONE_WEEK]: {
    label: "过去7天",
    description: "最近7天的数据",
  },
} as const;

// 分组相关常量
export const GROUP_CONFIG = {
  NAME_MAX_LENGTH: 10,
  DEFAULT_GROUP: "默认分组",
  COLORS: [
    "#1890ff", // 蓝色
    "#52c41a", // 绿色
    "#faad14", // 橙色
    "#722ed1", // 紫色
    "#f5222d", // 红色
    "#fa8c16", // 橙红色
    "#13c2c2", // 青色
    "#eb2f96", // 洋红色
  ],
} as const;
 