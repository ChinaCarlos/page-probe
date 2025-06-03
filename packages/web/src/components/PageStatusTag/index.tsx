import React from "react";
import { Tag, Tooltip } from "antd";
import { PageStatus } from "../../constants";

export interface PageStatusTagProps {
  /** 页面状态 */
  status?: PageStatus | string;
  /** 异常原因（仅在异常状态时显示） */
  reason?: string;
  /** Tooltip 显示位置 */
  placement?:
    | "topLeft"
    | "top"
    | "topRight"
    | "leftTop"
    | "left"
    | "leftBottom"
    | "rightTop"
    | "right"
    | "rightBottom"
    | "bottomLeft"
    | "bottom"
    | "bottomRight";
  /** 是否显示为简洁模式（不显示图标） */
  simple?: boolean;
}

/**
 * 页面状态标签组件
 * 支持异常状态时显示条目式的悬浮提示
 */
export const PageStatusTag: React.FC<PageStatusTagProps> = ({
  status,
  reason,
  placement = "topLeft",
  simple = false,
}) => {
  // 状态配置
  const getStatusConfig = (status?: PageStatus | string) => {
    switch (status) {
      case PageStatus.NORMAL:
        return { color: "success", label: "正常" };
      case PageStatus.ABNORMAL:
        return { color: "error", label: "异常" };
      case PageStatus.UNKNOWN:
        return { color: "processing", label: "待检测" };
      case PageStatus.QUEUED:
        return { color: "blue", label: "队列中" };
      case PageStatus.CHECKING:
        return { color: "processing", label: "检测中" };
      default:
        return { color: "processing", label: "待检测" };
    }
  };

  const config = getStatusConfig(status);
  const tag = <Tag color={config.color}>{config.label}</Tag>;

  // 如果是异常状态且有原因，添加条目式的Tooltip
  if (status === PageStatus.ABNORMAL && reason) {
    // 将异常原因按分号或换行符分割为条目
    const reasons = reason
      .split(/[;；\n]/)
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    const tooltipContent = (
      <div style={{ maxWidth: 300 }}>
        <div style={{ fontWeight: "bold", marginBottom: 8, color: "#fff" }}>
          页面异常详情：
        </div>
        {reasons.length > 1 ? (
          <ul style={{ margin: 0, paddingLeft: 16, color: "#fff" }}>
            {reasons.map((r, index) => (
              <li key={index} style={{ marginBottom: 4 }}>
                {r}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ color: "#fff" }}>{reasons[0]}</div>
        )}
      </div>
    );

    return (
      <Tooltip
        title={tooltipContent}
        placement={placement}
        overlayStyle={{ maxWidth: 400 }}
        color="#ff4d4f"
      >
        {tag}
      </Tooltip>
    );
  }

  return tag;
};

export default PageStatusTag;
