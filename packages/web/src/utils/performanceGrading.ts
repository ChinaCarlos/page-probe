import {
  METRIC_CONFIG,
  MetricType,
  PERFORMANCE_GRADE_CONFIG,
  PerformanceGrade,
} from "../constants";
import { WebVitalsMetrics } from "../types/api";

// 性能评级权重
const WEIGHTS = {
  [MetricType.LCP]: 0.35, // Largest Contentful Paint
  [MetricType.FID]: 0.25, // First Input Delay
  [MetricType.CLS]: 0.25, // Cumulative Layout Shift
  [MetricType.FCP]: 0.1, // First Contentful Paint
  [MetricType.TTFB]: 0.05, // Time to First Byte
};

// 性能阈值配置 (分数越高越好)
const THRESHOLDS = {
  [MetricType.LCP]: METRIC_CONFIG[MetricType.LCP].thresholds,
  [MetricType.FID]: METRIC_CONFIG[MetricType.FID].thresholds,
  [MetricType.CLS]: METRIC_CONFIG[MetricType.CLS].thresholds,
  [MetricType.FCP]: METRIC_CONFIG[MetricType.FCP].thresholds,
  [MetricType.TTFB]: METRIC_CONFIG[MetricType.TTFB].thresholds,
};

// 等级对应的分数范围
const GRADE_RANGES = Object.entries(PERFORMANCE_GRADE_CONFIG).reduce(
  (acc, [grade, config]) => {
    acc[grade as PerformanceGrade] = config.scoreThreshold;
    return acc;
  },
  {} as Record<PerformanceGrade, number>
);

// 重新导出性能等级和指标信息
export const PERFORMANCE_GRADE_INFO = PERFORMANCE_GRADE_CONFIG;
export const METRICS_INFO = {
  LCP: METRIC_CONFIG[MetricType.LCP],
  FID: METRIC_CONFIG[MetricType.FID],
  CLS: METRIC_CONFIG[MetricType.CLS],
  FCP: METRIC_CONFIG[MetricType.FCP],
  TTFB: METRIC_CONFIG[MetricType.TTFB],
};

/**
 * 计算单个指标的分数 (0-100)
 */
function calculateMetricScore(
  value: number | null,
  metric: MetricType
): number {
  if (value === null || value === undefined) return 0;

  const thresholds = THRESHOLDS[metric];

  if (metric === MetricType.CLS) {
    // CLS 分数计算 (越小越好)
    if (value <= thresholds.excellent) return 100;
    if (value <= thresholds.good) return 75;
    if (value <= thresholds.needsImprovement) return 50;
    return 25;
  } else {
    // 时间指标分数计算 (越小越好)
    if (value <= thresholds.excellent) return 100;
    if (value <= thresholds.good) return 75;
    if (value <= thresholds.needsImprovement) return 50;
    return 25;
  }
}

/**
 * 计算综合性能分数
 */
export function calculatePerformanceScore(metrics: WebVitalsMetrics): number {
  const scores = {
    [MetricType.LCP]: calculateMetricScore(metrics.lcp, MetricType.LCP),
    [MetricType.FID]: calculateMetricScore(metrics.fid, MetricType.FID),
    [MetricType.CLS]: calculateMetricScore(metrics.cls, MetricType.CLS),
    [MetricType.FCP]: calculateMetricScore(metrics.fcp, MetricType.FCP),
    [MetricType.TTFB]: calculateMetricScore(metrics.ttfb, MetricType.TTFB),
  };

  // 加权计算总分
  const totalScore =
    scores[MetricType.LCP] * WEIGHTS[MetricType.LCP] +
    scores[MetricType.FID] * WEIGHTS[MetricType.FID] +
    scores[MetricType.CLS] * WEIGHTS[MetricType.CLS] +
    scores[MetricType.FCP] * WEIGHTS[MetricType.FCP] +
    scores[MetricType.TTFB] * WEIGHTS[MetricType.TTFB];

  return Number(totalScore.toFixed(4));
}

/**
 * 根据分数获取性能等级
 */
export function getGradeFromScore(score: number): PerformanceGrade {
  if (score >= GRADE_RANGES[PerformanceGrade.S]) return PerformanceGrade.S;
  if (score >= GRADE_RANGES[PerformanceGrade.A_PLUS])
    return PerformanceGrade.A_PLUS;
  if (score >= GRADE_RANGES[PerformanceGrade.A]) return PerformanceGrade.A;
  if (score >= GRADE_RANGES[PerformanceGrade.A_MINUS])
    return PerformanceGrade.A_MINUS;
  if (score >= GRADE_RANGES[PerformanceGrade.B_PLUS])
    return PerformanceGrade.B_PLUS;
  if (score >= GRADE_RANGES[PerformanceGrade.B]) return PerformanceGrade.B;
  if (score >= GRADE_RANGES[PerformanceGrade.B_MINUS])
    return PerformanceGrade.B_MINUS;
  if (score >= GRADE_RANGES[PerformanceGrade.C]) return PerformanceGrade.C;
  return PerformanceGrade.D;
}

/**
 * 获取性能等级
 */
export function getPerformanceGrade(
  metrics: WebVitalsMetrics
): PerformanceGrade {
  const score = calculatePerformanceScore(metrics);
  return getGradeFromScore(score);
}

/**
 * 获取等级对应的颜色
 */
export function getGradeColor(grade: PerformanceGrade): string {
  return PERFORMANCE_GRADE_CONFIG[grade]?.color || "#8c8c8c";
}

/**
 * 获取等级描述
 */
export function getGradeDescription(grade: PerformanceGrade): string {
  return PERFORMANCE_GRADE_CONFIG[grade]?.description || "未知";
}

/**
 * 获取等级标签
 */
export function getGradeLabel(grade: PerformanceGrade): string {
  return PERFORMANCE_GRADE_CONFIG[grade]?.label || "未知";
}

/**
 * 获取指标颜色（根据阈值）
 */
export function getMetricColor(
  metricType: MetricType,
  value: number | null
): string {
  if (value === null) return "#8c8c8c";

  const config = METRIC_CONFIG[metricType];
  if (metricType === MetricType.CLS) {
    if (value <= config.thresholds.excellent) return config.colors.excellent;
    if (value <= config.thresholds.good) return config.colors.good;
    return config.colors.poor;
  } else {
    if (value <= config.thresholds.excellent) return config.colors.excellent;
    if (value <= config.thresholds.good) return config.colors.good;
    return config.colors.poor;
  }
}
