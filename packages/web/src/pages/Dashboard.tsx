import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Layout,
  XCircle,
  Zap,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import Chart from "../components/Chart";
import MetricCard from "../components/MetricCard";
import { monitorAPI } from "../services/api";
import { AlertRecord, MonitorStats, WebVitalsMetrics } from "../types";
import { formatRelativeTime, formatTimestamp } from "../utils/format";

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<WebVitalsMetrics[]>([]);
  const [stats, setStats] = useState<MonitorStats | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<number>(24); // 默认24小时

  const loadData = async () => {
    try {
      setLoading(true);
      const [metricsRes, statsRes, alertsRes] = await Promise.all([
        monitorAPI.getMetrics(undefined, timeRange),
        monitorAPI.getStats(),
        monitorAPI.getAlertRecords(24),
      ]);

      if (metricsRes.success) setMetrics(metricsRes.data || []);
      if (statsRes.success) setStats(statsRes.data || null);
      if (alertsRes.success) setRecentAlerts(alertsRes.data?.slice(0, 5) || []);
    } catch (error) {
      console.error("加载数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // 30秒刷新一次
    return () => clearInterval(interval);
  }, [timeRange]);

  // 计算平均值
  const getAverageMetric = (metric: "lcp" | "fid" | "cls") => {
    const values = metrics
      .map((m) => m[metric])
      .filter((v) => v !== null && v !== undefined) as number[];
    return values.length > 0
      ? values.reduce((a, b) => a + b, 0) / values.length
      : null;
  };

  // 准备图表数据
  const chartData = metrics.map((metric) => ({
    timestamp: metric.timestamp,
    LCP: metric.lcp || 0,
    FID: metric.fid || 0,
    CLS: metric.cls ? metric.cls * 1000 : 0, // CLS放大1000倍以便显示
  }));

  const chartLines = [
    { key: "LCP", name: "LCP (ms)", color: "#3b82f6" },
    { key: "FID", name: "FID (ms)", color: "#ef4444" },
    { key: "CLS", name: "CLS (×1000)", color: "#f59e0b" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">性能监控仪表板</h1>
          <p className="text-gray-600">实时监控落地页核心性能指标</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value={1}>过去1小时</option>
            <option value={6}>过去6小时</option>
            <option value={24}>过去24小时</option>
            <option value={168}>过去7天</option>
          </select>
          <button
            onClick={loadData}
            className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            刷新数据
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="平均 LCP"
          value={getAverageMetric("lcp")}
          metric="lcp"
          icon={<Clock className="h-6 w-6 text-primary-600" />}
          description="最大内容绘制时间"
        />
        <MetricCard
          title="平均 FID"
          value={getAverageMetric("fid")}
          metric="fid"
          icon={<Zap className="h-6 w-6 text-warning-600" />}
          description="首次输入延迟"
        />
        <MetricCard
          title="平均 CLS"
          value={getAverageMetric("cls")}
          unit="score"
          metric="cls"
          icon={<Layout className="h-6 w-6 text-danger-600" />}
          description="累积布局偏移"
        />
        <MetricCard
          title="监控目标"
          value={stats?.totalTargets || 0}
          unit=""
          icon={<CheckCircle className="h-6 w-6 text-success-600" />}
          description={`${stats?.activeTargets || 0} 个活跃目标`}
        />
      </div>

      {/* 性能趋势图表 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          性能指标趋势
        </h2>
        {chartData.length > 0 ? (
          <Chart data={chartData} lines={chartLines} height={400} />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">暂无数据</p>
          </div>
        )}
      </div>

      {/* 最近告警 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">最近告警</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {recentAlerts.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div
                      className={`p-2 rounded-full ${
                        alert.status === "triggered"
                          ? "bg-danger-100"
                          : "bg-success-100"
                      }`}
                    >
                      {alert.status === "triggered" ? (
                        <AlertTriangle className="h-4 w-4 text-danger-600" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-success-600" />
                      )}
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {alert.message}
                      </p>
                      <p className="text-sm text-gray-500">{alert.targetUrl}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">
                      {formatRelativeTime(alert.timestamp)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTimestamp(alert.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-success-600 mx-auto mb-4" />
              <p className="text-gray-500">暂无告警记录</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
