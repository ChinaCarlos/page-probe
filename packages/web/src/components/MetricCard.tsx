import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import React from "react";
import {
  formatMetric,
  getMetricStatus,
  getStatusColor,
  getStatusLabel,
} from "../utils/format";

interface MetricCardProps {
  title: string;
  value: number | null;
  unit?: string;
  metric?: "lcp" | "fid" | "cls";
  trend?: number;
  description?: string;
  icon?: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit = "ms",
  metric,
  trend,
  description,
  icon,
}) => {
  const status = metric ? getMetricStatus(metric, value) : "unknown";
  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);

  const getTrendIcon = () => {
    if (trend === undefined || trend === null) return null;
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-danger-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-success-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getTrendText = () => {
    if (trend === undefined || trend === null) return "";
    const absValue = Math.abs(trend);
    const direction = trend > 0 ? "上升" : trend < 0 ? "下降" : "持平";
    return `${direction} ${absValue.toFixed(1)}%`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {icon && <div className="mr-3">{icon}</div>}
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatMetric(value, unit)}
            </p>
          </div>
        </div>
        {metric && (
          <div
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}
          >
            {statusLabel}
          </div>
        )}
      </div>

      <div className="mt-4">
        {trend !== undefined && trend !== null && (
          <div className="flex items-center text-sm">
            {getTrendIcon()}
            <span className="ml-1 text-gray-600">{getTrendText()}</span>
          </div>
        )}

        {description && (
          <p className="text-sm text-gray-500 mt-2">{description}</p>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
