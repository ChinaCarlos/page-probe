import { format, formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  METRIC_CONFIG,
  MetricType,
  STATUS_CONFIG,
  StatusType,
} from "../constants";

// 格式化时间戳
export const formatTimestamp = (
  timestamp: number,
  formatStr = "yyyy-MM-dd HH:mm:ss"
) => {
  return format(new Date(timestamp), formatStr, { locale: zhCN });
};

// 格式化相对时间
export const formatRelativeTime = (timestamp: number) => {
  return formatDistanceToNow(new Date(timestamp), {
    addSuffix: true,
    locale: zhCN,
  });
};

// 格式化性能指标
export const formatMetric = (value: number | null, unit = "ms") => {
  if (value === null || value === undefined) return "-";

  if (unit === "ms") {
    return `${value}ms`;
  }

  if (unit === "score") {
    return value.toString();
  }

  return `${value}${unit}`;
};

// 获取性能指标状态
export const getMetricStatus = (
  metric: MetricType,
  value: number | null
): StatusType => {
  if (value === null) return StatusType.UNKNOWN;

  const config = METRIC_CONFIG[metric];

  if (metric === MetricType.CLS) {
    // CLS越小越好
    if (value <= config.thresholds.excellent) return StatusType.GOOD;
    if (value <= config.thresholds.good) return StatusType.NEEDS_IMPROVEMENT;
    return StatusType.POOR;
  } else {
    // 时间指标越小越好
    if (value <= config.thresholds.excellent) return StatusType.GOOD;
    if (value <= config.thresholds.good) return StatusType.NEEDS_IMPROVEMENT;
    return StatusType.POOR;
  }
};

// 获取状态颜色
export const getStatusColor = (status: StatusType) => {
  return (
    STATUS_CONFIG[status]?.className ||
    STATUS_CONFIG[StatusType.UNKNOWN].className
  );
};

// 获取状态标签
export const getStatusLabel = (status: StatusType) => {
  return (
    STATUS_CONFIG[status]?.label || STATUS_CONFIG[StatusType.UNKNOWN].label
  );
};

// 格式化URL显示
export const formatUrl = (url: string, maxLength = 50) => {
  if (url.length <= maxLength) return url;
  return `${url.substring(0, maxLength)}...`;
};
