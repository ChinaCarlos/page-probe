import React from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatTimestamp } from "../utils/format";

interface ChartData {
  timestamp: number;
  [key: string]: number;
}

interface ChartProps {
  data: ChartData[];
  lines: {
    key: string;
    name: string;
    color: string;
  }[];
  height?: number;
  showLegend?: boolean;
}

const Chart: React.FC<ChartProps> = ({
  data,
  lines,
  height = 300,
  showLegend = true,
}) => {
  const formatXAxisTick = (tickItem: number) => {
    return formatTimestamp(tickItem, "HH:mm");
  };

  const formatTooltipLabel = (label: number) => {
    return formatTimestamp(label, "MM-dd HH:mm:ss");
  };

  const formatTooltipValue = (value: number, name: string) => {
    if (name.includes("CLS")) {
      return [value.toFixed(3), name];
    }
    return [`${Math.round(value)}ms`, name];
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatXAxisTick}
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
          />
          <YAxis />
          <Tooltip
            labelFormatter={formatTooltipLabel}
            formatter={formatTooltipValue}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          />
          {showLegend && <Legend />}
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              stroke={line.color}
              strokeWidth={2}
              dot={false}
              name={line.name}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;
