import {
  AlertTriangle,
  ArrowLeft,
  Award,
  BarChart3,
  Camera,
  Monitor,
  Play,
  Smartphone,
  TrendingUp,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  PerformanceGrade,
  getMetricGrade,
  gradePerformance,
} from "../utils/performanceGrading";
import {
  DEVICE_TYPE_CONFIG,
  DeviceType,
  MetricType,
  PageStatus,
  SCREENSHOT_STAGE_CONFIG,
  ScreenshotStage,
} from "../constants";

interface TargetDetails {
  target: {
    id: string;
    name: string;
    url: string;
    enabled: boolean;
    createdAt: number;
  };
  metrics: Array<{
    id: string;
    url: string;
    timestamp: number;
    lcp: number | null;
    fid: number | null;
    cls: number | null;
    fcp: number | null;
    ttfb: number | null;
    loadTime?: number | null;
    domContentLoaded?: number | null;
    deviceType?: string;
    sessionId?: string;
    screenshots?: string[];
  }>;
  blankScreens: Array<{
    id: string;
    url: string;
    timestamp: number;
    isBlankScreen: boolean;
    reason?: string;
    screenshot?: string;
    sessionId?: string;
    deviceType?: string;
  }>;
  alertRules: Array<{
    id: string;
    name: string;
    metric: string;
    threshold: number;
    operator: string;
    enabled: boolean;
  }>;
  alerts: Array<{
    id: string;
    metric: string;
    value: number;
    threshold: number;
    timestamp: number;
    status: string;
    message: string;
  }>;
  summary: {
    totalChecks: number;
    blankScreenCount: number;
    alertCount: number;
    lastCheck: number | null;
    avgLCP: number | null;
    avgFID: number | null;
    avgCLS: number | null;
  };
}

const TargetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [details, setDetails] = useState<TargetDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [monitoring, setMonitoring] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(24);
  const [selectedScreenshots, setSelectedScreenshots] = useState<{
    sessionId: string;
    deviceType: string;
  } | null>(null);

  useEffect(() => {
    fetchTargetDetails();
  }, [id, timeRange]);

  const fetchTargetDetails = async () => {
    try {
      const response = await fetch(
        `/api/targets/${id}/details?hours=${timeRange}`
      );
      const result = await response.json();
      if (response.ok) {
        setDetails(result.data);
      }
    } catch (error) {
      console.error("获取目标详情失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const startMonitoring = async () => {
    setMonitoring(true);
    try {
      const response = await fetch(`/api/targets/${id}/monitor`, {
        method: "POST",
      });
      const result = await response.json();
      if (response.ok) {
        // 延迟刷新数据，等待监控完成
        setTimeout(() => {
          fetchTargetDetails();
        }, 10000);
      }
    } catch (error) {
      console.error("启动监控失败:", error);
    } finally {
      setMonitoring(false);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (ms: number | null) => {
    if (ms === null) return "N/A";
    return `${ms.toFixed(0)}ms`;
  };

  const getMetricColor = (metric: string, value: number | null) => {
    if (value === null) return "text-gray-400";

    switch (metric) {
      case "lcp":
        return value > 2500
          ? "text-red-500"
          : value > 1000
          ? "text-yellow-500"
          : "text-green-500";
      case "fid":
        return value > 100
          ? "text-red-500"
          : value > 50
          ? "text-yellow-500"
          : "text-green-500";
      case "cls":
        return value > 0.25
          ? "text-red-500"
          : value > 0.1
          ? "text-yellow-500"
          : "text-green-500";
      case "fcp":
        return value > 1800
          ? "text-red-500"
          : value > 1000
          ? "text-yellow-500"
          : "text-green-500";
      case "ttfb":
        return value > 800
          ? "text-red-500"
          : value > 200
          ? "text-yellow-500"
          : "text-green-500";
      default:
        return "text-gray-600";
    }
  };

  // 计算平均性能评级
  const getAverageGrade = (): PerformanceGrade | null => {
    if (!details?.summary) return null;

    const avgMetrics = {
      lcp: details.summary.avgLCP,
      fid: details.summary.avgFID,
      cls: details.summary.avgCLS,
    };

    return gradePerformance(avgMetrics);
  };

  // 获取最新的性能数据
  const getLatestMetrics = () => {
    if (!details?.metrics || details.metrics.length === 0) return null;
    return details.metrics[0]; // 已按时间戳排序，第一个是最新的
  };

  // 渲染性能等级徽章
  const PerformanceGradeBadge: React.FC<{
    grade: PerformanceGrade;
    size?: "sm" | "lg";
  }> = ({ grade, size = "sm" }) => {
    const sizeClasses =
      size === "lg"
        ? "text-2xl px-4 py-2 min-w-[80px]"
        : "text-sm px-2 py-1 min-w-[50px]";

    return (
      <div
        className={`inline-flex items-center justify-center font-bold rounded-lg ${sizeClasses}`}
        style={{
          backgroundColor: grade.color + "20",
          color: grade.color,
          border: `2px solid ${grade.color}`,
        }}
      >
        {grade.grade}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载目标详情中...</p>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            目标不存在
          </h2>
          <p className="mt-2 text-gray-600">请检查目标ID是否正确</p>
          <button
            onClick={() => navigate("/targets")}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            返回目标列表
          </button>
        </div>
      </div>
    );
  }

  const averageGrade = getAverageGrade();
  const latestMetrics = getLatestMetrics();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/targets")}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {details.target.name}
                </h1>
                <p className="text-sm text-gray-500">{details.target.url}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {averageGrade && (
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-gray-400" />
                  <PerformanceGradeBadge grade={averageGrade} />
                  <span className="text-sm text-gray-600">
                    {averageGrade.description}
                  </span>
                </div>
              )}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
                className="border rounded-lg px-3 py-1 text-sm"
              >
                <option value={1}>最近1小时</option>
                <option value={6}>最近6小时</option>
                <option value={24}>最近24小时</option>
                <option value={168}>最近7天</option>
              </select>
              <button
                onClick={startMonitoring}
                disabled={monitoring}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                <Play className="h-4 w-4 mr-2" />
                {monitoring ? "监控中..." : "立即监控"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 概览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">总检查次数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {details.summary.totalChecks}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Camera className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">白屏检测</p>
                <p className="text-2xl font-bold text-gray-900">
                  {details.summary.blankScreenCount}
                </p>
                <p className="text-xs text-gray-500">次白屏</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">告警次数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {details.summary.alertCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">最后检查</p>
                <p className="text-sm font-semibold text-gray-900">
                  {details.summary.lastCheck
                    ? formatTime(details.summary.lastCheck)
                    : "暂无"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 平均性能指标 */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            平均性能指标
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">LCP</p>
              <p
                className={`text-3xl font-bold ${getMetricColor(
                  "lcp",
                  details.summary.avgLCP
                )}`}
              >
                {formatDuration(details.summary.avgLCP)}
              </p>
              {details.summary.avgLCP && (
                <PerformanceGradeBadge
                  grade={getMetricGrade(details.summary.avgLCP, "lcp")}
                />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">FID</p>
              <p
                className={`text-3xl font-bold ${getMetricColor(
                  "fid",
                  details.summary.avgFID
                )}`}
              >
                {formatDuration(details.summary.avgFID)}
              </p>
              {details.summary.avgFID && (
                <PerformanceGradeBadge
                  grade={getMetricGrade(details.summary.avgFID, "fid")}
                />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">CLS</p>
              <p
                className={`text-3xl font-bold ${getMetricColor(
                  "cls",
                  details.summary.avgCLS
                )}`}
              >
                {details.summary.avgCLS?.toFixed(3) || "N/A"}
              </p>
              {details.summary.avgCLS && (
                <PerformanceGradeBadge
                  grade={getMetricGrade(details.summary.avgCLS, "cls")}
                />
              )}
            </div>
          </div>
        </div>

        {/* 最新监控数据和截图 */}
        {latestMetrics && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              最新监控数据
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 性能指标 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">性能指标</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">设备类型:</span>
                    <div className="flex items-center">
                      {latestMetrics.deviceType === "desktop" ? (
                        <Monitor className="h-4 w-4 mr-1" />
                      ) : (
                        <Smartphone className="h-4 w-4 mr-1" />
                      )}
                      <span className="text-sm font-medium">
                        {latestMetrics.deviceType === "desktop"
                          ? "桌面端"
                          : "移动端"}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">检测时间:</span>
                    <span className="text-sm font-medium">
                      {formatTime(latestMetrics.timestamp)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500">LCP</p>
                      <p
                        className={`font-semibold ${getMetricColor(
                          "lcp",
                          latestMetrics.lcp
                        )}`}
                      >
                        {formatDuration(latestMetrics.lcp)}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500">FID</p>
                      <p
                        className={`font-semibold ${getMetricColor(
                          "fid",
                          latestMetrics.fid
                        )}`}
                      >
                        {formatDuration(latestMetrics.fid)}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500">CLS</p>
                      <p
                        className={`font-semibold ${getMetricColor(
                          "cls",
                          latestMetrics.cls
                        )}`}
                      >
                        {latestMetrics.cls?.toFixed(3) || "N/A"}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500">TTFB</p>
                      <p
                        className={`font-semibold ${getMetricColor(
                          "ttfb",
                          latestMetrics.ttfb
                        )}`}
                      >
                        {formatDuration(latestMetrics.ttfb)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 截图展示 */}
              {latestMetrics.screenshots &&
                latestMetrics.screenshots.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">页面截图</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {latestMetrics.screenshots.map((screenshot, index) => {
                        // 从文件名中提取阶段信息
                        // 文件名格式：{sessionId}_{stage}_{timestamp}.png
                        const parts = screenshot.split("_");
                        const stageKey = parts.length >= 2 ? parts[1] : "";

                        // 使用预定义的截图阶段配置
                        const stageConfig =
                          SCREENSHOT_STAGE_CONFIG[stageKey as ScreenshotStage];
                        const stageLabel = stageConfig?.label || "未知截图";

                        return (
                          <div key={index} className="text-center">
                            <img
                              src={`/api/screenshots/${screenshot}`}
                              alt={stageLabel}
                              className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() =>
                                window.open(
                                  `/api/screenshots/${screenshot}`,
                                  "_blank"
                                )
                              }
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {stageLabel}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* 历史监控记录 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">监控历史</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    设备
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    LCP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    FID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    CLS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    TTFB
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    综合评级
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    截图
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {details.metrics.map((metric) => {
                  const grade = gradePerformance({
                    lcp: metric.lcp,
                    fid: metric.fid,
                    cls: metric.cls,
                    fcp: metric.fcp,
                    ttfb: metric.ttfb,
                  });

                  return (
                    <tr key={metric.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTime(metric.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          {metric.deviceType === "desktop" ? (
                            <Monitor className="h-4 w-4 mr-1" />
                          ) : (
                            <Smartphone className="h-4 w-4 mr-1" />
                          )}
                          {metric.deviceType === "desktop"
                            ? "桌面端"
                            : "移动端"}
                        </div>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getMetricColor(
                          "lcp",
                          metric.lcp
                        )}`}
                      >
                        {formatDuration(metric.lcp)}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getMetricColor(
                          "fid",
                          metric.fid
                        )}`}
                      >
                        {formatDuration(metric.fid)}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getMetricColor(
                          "cls",
                          metric.cls
                        )}`}
                      >
                        {metric.cls?.toFixed(3) || "N/A"}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getMetricColor(
                          "ttfb",
                          metric.ttfb
                        )}`}
                      >
                        {formatDuration(metric.ttfb)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PerformanceGradeBadge grade={grade} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {metric.screenshots &&
                          metric.screenshots.length > 0 && (
                            <button
                              onClick={() =>
                                setSelectedScreenshots({
                                  sessionId: metric.sessionId || "",
                                  deviceType: metric.deviceType || "",
                                })
                              }
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Camera className="h-4 w-4" />
                            </button>
                          )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 截图查看模态框 */}
      {selectedScreenshots && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">页面截图</h3>
                <button
                  onClick={() => setSelectedScreenshots(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {details.metrics
                  .find(
                    (m) =>
                      m.sessionId === selectedScreenshots.sessionId &&
                      m.deviceType === selectedScreenshots.deviceType
                  )
                  ?.screenshots?.map((screenshot, index) => {
                    // 从文件名中提取阶段信息
                    // 文件名格式：{sessionId}_{stage}_{timestamp}.png
                    const parts = screenshot.split("_");
                    const stageKey = parts.length >= 2 ? parts[1] : "";

                    // 使用预定义的截图阶段配置
                    const stageConfig =
                      SCREENSHOT_STAGE_CONFIG[stageKey as ScreenshotStage];
                    const stageLabel = stageConfig?.label || "未知截图";

                    return (
                      <div key={index} className="text-center">
                        <h4 className="font-medium mb-2">{stageLabel}</h4>
                        <img
                          src={`/api/screenshots/${screenshot}`}
                          alt={stageLabel}
                          className="w-full border rounded cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() =>
                            window.open(
                              `/api/screenshots/${screenshot}`,
                              "_blank"
                            )
                          }
                        />
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TargetDetail;
