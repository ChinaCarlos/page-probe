// 白屏检测默认配置常量

/**
 * 默认错误文案关键词列表
 * 包含常见的404、服务器错误、系统维护等关键词
 */
export const DEFAULT_ERROR_TEXT_KEYWORDS = [
  // 基础404关键词
  "404",
  "not found",
  "page not found",
  "页面不存在",
  "页面未找到",
  "找不到页面",
  "页面丢失",
  "无法找到",
  "访问的页面不存在",
  "file not found",
  "document not found",

  // 服务器错误关键词
  "服务器错误",
  "internal server error",
  "网站维护中",
  "暂时无法访问",
  "系统错误",
  "500 error",
  "502 bad gateway",
  "503 service unavailable",
  "504 gateway timeout",

  // 网络错误关键词
  "网络错误",
  "连接超时",
  "请求超时",
  "网络异常",
  "connection timeout",
  "request timeout",
  "network error",

  // 权限错误关键词
  "访问被拒绝",
  "权限不足",
  "未授权访问",
  "access denied",
  "unauthorized",
  "forbidden",

  // 其他常见错误
  "加载失败",
  "load failed",
  "出错了",
  "something went wrong",
  "系统繁忙",
  "system busy",
];

/**
 * 默认错误状态码列表
 * 包含标准HTTP错误状态码
 */
export const DEFAULT_ERROR_STATUS_CODES = [
  // 4xx 客户端错误
  400, // Bad Request
  401, // Unauthorized
  403, // Forbidden
  404, // Not Found
  405, // Method Not Allowed
  408, // Request Timeout
  409, // Conflict
  410, // Gone
  429, // Too Many Requests

  // 5xx 服务器错误
  500, // Internal Server Error
  501, // Not Implemented
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
  505, // HTTP Version Not Supported
  507, // Insufficient Storage
  508, // Loop Detected
  510, // Not Extended
  511, // Network Authentication Required
];

/**
 * 默认白屏检测配置
 */
export const DEFAULT_BLANK_SCREEN_CONFIG = {
  // 检测规则开关
  enableDOMStructureCheck: true,
  enableContentCheck: true,
  enableTextMatchCheck: true,
  enableHTTPStatusCheck: true,
  enableTimeoutCheck: true,
  enableAICheck: false, // AI检测默认关闭（预留功能）
  enablePixelCheck: false, // 像素检测默认关闭（预留功能）

  // 检测参数
  domElementThreshold: 3,
  heightRatioThreshold: 0.15,
  textLengthThreshold: 10,
  domLoadTimeout: 8000,
  pageLoadTimeout: 10000,

  // AI检测参数（预留）
  aiConfidenceThreshold: 0.8,
  aiModelVersion: "v1.0",

  // 像素算法检测参数（预留）
  pixelSimilarityThreshold: 0.85,
  pixelColorThreshold: 30,
  pixelWhiteRatio: 0.9,

  // 错误关键词和状态码（使用上面定义的常量）
  errorTextKeywords: DEFAULT_ERROR_TEXT_KEYWORDS,
  errorStatusCodes: DEFAULT_ERROR_STATUS_CODES,
};

/**
 * 获取默认配置（深拷贝，避免修改原始常量）
 */
export function getDefaultBlankScreenConfig() {
  return {
    ...DEFAULT_BLANK_SCREEN_CONFIG,
    errorTextKeywords: [...DEFAULT_ERROR_TEXT_KEYWORDS],
    errorStatusCodes: [...DEFAULT_ERROR_STATUS_CODES],
  };
}
