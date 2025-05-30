import {
  ArrowLeftOutlined,
  CalculatorOutlined,
  ClockCircleOutlined,
  DesktopOutlined,
  InfoCircleOutlined,
  MobileOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Modal,
  Progress,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import React, { useEffect, useState } from "react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import { useNavigate, useParams } from "react-router-dom";
import "react-photo-view/dist/react-photo-view.css";
import {
  COLORS,
  DEVICE_TYPE_CONFIG,
  DeviceType,
  METRIC_CONFIG,
  MetricType,
  PageStatus,
  SCREENSHOT_STAGE_CONFIG,
  ScreenshotStage,
} from "../../constants";
import {
  MonitorTarget,
  MonitorTask,
  TaskStatus,
  WebVitalsMetrics,
} from "../../types/api";
import {
  METRICS_INFO,
  PERFORMANCE_GRADE_INFO,
  calculatePerformanceScore,
  getGradeColor,
  getGradeLabel,
  getMetricColor,
  getPerformanceGrade,
} from "../../utils/performanceGrading";
import { PageStatusTag } from "../../components/PageStatusTag";

const { Title, Text } = Typography;

const TargetDetail: React.FC = () => {
  const { targetId } = useParams<{ targetId: string }>();
  const navigate = useNavigate();
  const [target, setTarget] = useState<MonitorTarget | null>(null);
  const [metrics, setMetrics] = useState<WebVitalsMetrics[]>([]);
  const [tasks, setTasks] = useState<MonitorTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [performanceCalculationVisible, setPerformanceCalculationVisible] =
    useState(false);

  useEffect(() => {
    if (targetId) {
      fetchTargetDetail();
      fetchMetrics();
      fetchTasks();
    }
  }, [targetId]);

  const fetchTargetDetail = async () => {
    try {
      const response = await fetch(`/api/targets/${targetId}`);
      const data = await response.json();
      setTarget(data.data);
    } catch (error) {
      console.error("获取目标详情失败:", error);
    }
  };

  const fetchMetrics = async (showRefreshState = false) => {
    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(`/api/metrics?targetId=${targetId}`);
      const data = await response.json();
      const newMetrics = data.data || [];

      // 检查是否有新数据
      if (newMetrics.length > 0 && metrics.length > 0) {
        const latestTimestamp = newMetrics[0].timestamp;
        const currentLatestTimestamp = metrics[0].timestamp;

        if (latestTimestamp > currentLatestTimestamp) {
          message.success("检测到新的监控数据！");
        }
      }

      setMetrics(newMetrics);
    } catch (error) {
      console.error("获取监控数据失败:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?targetId=${targetId}`);
      const data = await response.json();
      setTasks(data.data || []);
    } catch (error) {
      console.error("获取任务数据失败:", error);
    }
  };

  const handleManualRefresh = () => {
    fetchMetrics(true);
    fetchTasks();
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    });
  };

  const latestMetric = metrics.length > 0 ? metrics[0] : null;

  const renderDeviceType = (deviceType: DeviceType) => {
    const config = DEVICE_TYPE_CONFIG[deviceType];
    const IconComponent =
      deviceType === DeviceType.MOBILE ? MobileOutlined : DesktopOutlined;

    return (
      <Tag color={config.color}>
        <IconComponent /> {config.label}
      </Tag>
    );
  };

  const renderTaskStatus = (status: TaskStatus) => {
    const statusConfig = {
      [TaskStatus.PENDING]: { color: "blue", label: "等待中" },
      [TaskStatus.RUNNING]: { color: "orange", label: "执行中" },
      [TaskStatus.SUCCESS]: { color: "green", label: "成功" },
      [TaskStatus.FAILED]: { color: "red", label: "失败" },
    };

    const config = statusConfig[status];
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  const renderMetricValue = (value: number | null, metricType: MetricType) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400">N/A</span>;
    }

    const color = getMetricColor(metricType, value);
    return (
      <span style={{ color }}>
        {value}
        {metricType === MetricType.CLS ? "" : "ms"}
      </span>
    );
  };

  const renderGrade = (metric: WebVitalsMetrics) => {
    const grade = getPerformanceGrade(metric);
    const color = getGradeColor(grade);
    const gradeInfo = PERFORMANCE_GRADE_INFO[grade];

    return (
      <Tooltip title={gradeInfo?.description || ""}>
        <span className="cursor-help border-b border-dotted border-gray-400">
          {grade} 级
          <QuestionCircleOutlined className="text-gray-400 text-xs" />
        </span>
      </Tooltip>
    );
  };

  const renderColumnTitle = (
    title: string,
    metricKey: keyof typeof METRICS_INFO
  ) => {
    const metricInfo = METRICS_INFO[metricKey];
    return (
      <Tooltip title={metricInfo.description} placement="top">
        <span style={{ cursor: "help", borderBottom: "1px dotted #8c8c8c" }}>
          {title}{" "}
          <QuestionCircleOutlined style={{ color: "#8c8c8c", fontSize: 12 }} />
        </span>
      </Tooltip>
    );
  };

  const getMetricColorClass = (
    metricType: MetricType,
    value: number | null
  ): string => {
    if (value === null) return COLORS.TEXT_GRAY_400;

    const color = getMetricColor(metricType, value);
    if (color === "#52c41a") return COLORS.TEXT_GREEN_500;
    if (color === "#fa8c16") return "text-orange-500";
    if (color === "#f5222d") return COLORS.TEXT_RED_500;
    return COLORS.TEXT_GRAY_600;
  };

  const columns = [
    {
      title: "监控时间",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (timestamp: number) => formatTimestamp(timestamp),
    },
    {
      title: "设备类型",
      dataIndex: "deviceType",
      key: "deviceType",
      render: (deviceType: DeviceType) => renderDeviceType(deviceType),
    },
    {
      title: "性能等级",
      key: "grade",
      render: (record: WebVitalsMetrics) => {
        const grade = getPerformanceGrade(record);
        return <Tag color={getGradeColor(grade)}>{grade} 级</Tag>;
      },
    },
    {
      title: renderColumnTitle("LCP", "LCP"),
      dataIndex: "lcp",
      key: "lcp",
      render: (value: number | null) =>
        renderMetricValue(value, MetricType.LCP),
    },
    {
      title: renderColumnTitle("FID", "FID"),
      dataIndex: "fid",
      key: "fid",
      render: (value: number | null) =>
        renderMetricValue(value, MetricType.FID),
    },
    {
      title: renderColumnTitle("CLS", "CLS"),
      dataIndex: "cls",
      key: "cls",
      render: (value: number | null) =>
        renderMetricValue(value, MetricType.CLS),
    },
    {
      title: renderColumnTitle("FCP", "FCP"),
      dataIndex: "fcp",
      key: "fcp",
      render: (value: number | null) =>
        renderMetricValue(value, MetricType.FCP),
    },
    {
      title: renderColumnTitle("TTFB", "TTFB"),
      dataIndex: "ttfb",
      key: "ttfb",
      render: (value: number | null) =>
        renderMetricValue(value, MetricType.TTFB),
    },
  ];

  // 任务表格列定义
  const taskColumns = [
    {
      title: "任务ID",
      dataIndex: "id",
      key: "id",
      width: 320,
      render: (id: string) => (
        <Tooltip title="点击复制完整ID">
          <code
            style={{
              cursor: "pointer",
              wordBreak: "break-all",
              fontSize: "12px",
              padding: "2px 4px",
              backgroundColor: "#f5f5f5",
              borderRadius: "3px",
            }}
            onClick={() => {
              navigator.clipboard.writeText(id);
              message.success("任务ID已复制到剪贴板");
            }}
          >
            {id}
          </code>
        </Tooltip>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (timestamp: number) => formatTimestamp(timestamp),
    },
    {
      title: "任务状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: TaskStatus) => renderTaskStatus(status),
    },
    {
      title: "页面状态",
      key: "pageStatus",
      width: 120,
      render: (record: MonitorTask) => (
        <PageStatusTag
          status={record.pageStatus || PageStatus.UNKNOWN}
          reason={record.pageStatusReason}
        />
      ),
    },
    {
      title: "执行时长",
      dataIndex: "duration",
      key: "duration",
      width: 100,
      render: (duration: number | undefined) => {
        if (!duration) return <span style={{ color: "#8c8c8c" }}>-</span>;
        return <span>{duration}ms</span>;
      },
    },
    {
      title: "错误信息",
      dataIndex: "error",
      key: "error",
      render: (error: string | undefined) => {
        if (!error) return <span style={{ color: "#8c8c8c" }}>-</span>;
        return (
          <Tooltip title={error}>
            <span style={{ color: "#ff4d4f", cursor: "help" }}>
              {error.length > 30 ? `${error.substring(0, 30)}...` : error}
            </span>
          </Tooltip>
        );
      },
    },
  ];

  // 渲染本次数据的性能计算过程
  const renderPerformanceCalculation = () => {
    if (!latestMetric) return null;

    const currentScore = calculatePerformanceScore(latestMetric);
    const currentGrade = getPerformanceGrade(latestMetric);

    // 计算各指标的得分
    const calculateMetricScore = (
      value: number | null,
      metric: MetricType
    ): number => {
      if (value === null || value === undefined) return 0;
      const thresholds = METRIC_CONFIG[metric].thresholds;

      if (metric === MetricType.CLS) {
        if (value <= thresholds.excellent) return 100;
        if (value <= thresholds.good) return 75;
        if (value <= thresholds.needsImprovement) return 50;
        return 25;
      } else {
        if (value <= thresholds.excellent) return 100;
        if (value <= thresholds.good) return 75;
        if (value <= thresholds.needsImprovement) return 50;
        return 25;
      }
    };

    const metricScores = [
      {
        metric: MetricType.LCP,
        name: "LCP (最大内容绘制)",
        weight: 35,
        value: latestMetric.lcp,
        score: calculateMetricScore(latestMetric.lcp, MetricType.LCP),
        thresholds: METRIC_CONFIG[MetricType.LCP].thresholds,
        unit: "ms",
      },
      {
        metric: MetricType.FID,
        name: "FID (首次输入延迟)",
        weight: 25,
        value: latestMetric.fid,
        score: calculateMetricScore(latestMetric.fid, MetricType.FID),
        thresholds: METRIC_CONFIG[MetricType.FID].thresholds,
        unit: "ms",
      },
      {
        metric: MetricType.CLS,
        name: "CLS (累积布局偏移)",
        weight: 25,
        value: latestMetric.cls,
        score: calculateMetricScore(latestMetric.cls, MetricType.CLS),
        thresholds: METRIC_CONFIG[MetricType.CLS].thresholds,
        unit: "",
      },
      {
        metric: MetricType.FCP,
        name: "FCP (首次内容绘制)",
        weight: 10,
        value: latestMetric.fcp,
        score: calculateMetricScore(latestMetric.fcp, MetricType.FCP),
        thresholds: METRIC_CONFIG[MetricType.FCP].thresholds,
        unit: "ms",
      },
      {
        metric: MetricType.TTFB,
        name: "TTFB (首字节时间)",
        weight: 5,
        value: latestMetric.ttfb,
        score: calculateMetricScore(latestMetric.ttfb, MetricType.TTFB),
        thresholds: METRIC_CONFIG[MetricType.TTFB].thresholds,
        unit: "ms",
      },
    ];

    // 计算加权分数
    const weightedScores = metricScores.map((item) => ({
      ...item,
      weightedScore: (item.score * item.weight) / 100,
    }));

    const totalWeightedScore = weightedScores.reduce(
      (sum, item) => sum + item.weightedScore,
      0
    );

    return (
      <Modal
        title={
          <Space>
            <CalculatorOutlined />
            <span>本次性能数据计算过程</span>
            <Tag color="blue">
              {new Date(latestMetric.timestamp).toLocaleString()}
            </Tag>
          </Space>
        }
        open={performanceCalculationVisible}
        onCancel={() => setPerformanceCalculationVisible(false)}
        width={900}
        footer={null}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* 最终结果 */}
          <Card
            size="small"
            style={{
              background: "linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{ fontSize: 24, fontWeight: "bold", marginBottom: 8 }}
              >
                计算结果
              </div>
              <Tag
                color={getGradeColor(currentGrade)}
                style={{
                  fontSize: 16,
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontWeight: "bold",
                }}
              >
                {currentGrade} 级
              </Tag>
              <div style={{ marginTop: 8, color: "#666" }}>
                综合得分: {currentScore.toFixed(1)}
              </div>
              <Progress
                percent={currentScore}
                strokeColor={getGradeColor(currentGrade)}
                style={{ marginTop: 8 }}
              />
            </div>
          </Card>

          {/* 本次数据详情 */}
          <div>
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
              本次监控数据
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {metricScores.map((item) => (
                <Card
                  key={item.metric}
                  size="small"
                  style={{ border: "1px solid #e8e8e8" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span style={{ fontWeight: 500 }}>{item.name}</span>
                      <Tag color="blue">{item.weight}% 权重</Tag>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontWeight: "bold",
                          color: getMetricColor(item.metric, item.value),
                        }}
                      >
                        {item.value?.toFixed(
                          item.metric === MetricType.CLS ? 4 : 0
                        ) || "N/A"}
                        {item.unit}
                      </div>
                      <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                        得分: {item.score}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                      fontSize: 12,
                    }}
                  >
                    <div
                      style={{
                        textAlign: "center",
                        padding: 8,
                        backgroundColor: "#f6ffed",
                        borderRadius: 4,
                      }}
                    >
                      <div style={{ color: "#52c41a", fontWeight: 500 }}>
                        优秀阈值: ≤ {item.thresholds.excellent}
                        {item.unit}
                      </div>
                    </div>
                    <div
                      style={{
                        textAlign: "center",
                        padding: 8,
                        backgroundColor: "#fff7e6",
                        borderRadius: 4,
                      }}
                    >
                      <div style={{ color: "#fa8c16", fontWeight: 500 }}>
                        良好阈值: ≤ {item.thresholds.good}
                        {item.unit}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* 详细计算过程 */}
          <div>
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
              详细计算过程
            </h4>
            <Card size="small" style={{ backgroundColor: "#fafafa" }}>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                <div style={{ marginBottom: 12, fontWeight: 600 }}>
                  加权分数计算：
                </div>
                {weightedScores.map((item, index) => (
                  <div key={item.metric} style={{ marginBottom: 6 }}>
                    <span style={{ color: "#1890ff" }}>{item.name}</span>:{" "}
                    {item.score} × {item.weight}% ={" "}
                    {item.weightedScore.toFixed(2)} 分
                  </div>
                ))}
                <Divider style={{ margin: "12px 0" }} />
                <div style={{ fontWeight: 600, color: "#1890ff" }}>
                  最终得分 ={" "}
                  {weightedScores
                    .map((item) => item.weightedScore.toFixed(2))
                    .join(" + ")}{" "}
                  = {totalWeightedScore.toFixed(1)} 分
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: "#8c8c8c" }}>
                  根据得分 {totalWeightedScore.toFixed(1)} 分，评定为{" "}
                  <span
                    style={{
                      color: getGradeColor(currentGrade),
                      fontWeight: 600,
                    }}
                  >
                    {currentGrade} 级
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* 等级标准参考 */}
          <div>
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
              等级标准参考
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 8,
              }}
            >
              {Object.entries(PERFORMANCE_GRADE_INFO).map(([grade, info]) => (
                <div
                  key={grade}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    border:
                      currentGrade === grade
                        ? `2px solid ${info.color}`
                        : "1px solid #e8e8e8",
                    backgroundColor:
                      currentGrade === grade ? "#f0f5ff" : "#fff",
                    textAlign: "center",
                  }}
                >
                  <Tag color={info.color} style={{ fontWeight: "bold" }}>
                    {grade} 级
                  </Tag>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    ≥ {info.scoreThreshold}分
                  </div>
                  <div style={{ fontSize: 11, color: "#8c8c8c", marginTop: 4 }}>
                    {info.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    );
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 384,
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!target) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 384,
        }}
      >
        <Text type="secondary">未找到监控目标</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/targets")}
            style={{ padding: 8, borderRadius: 6, color: "#8c8c8c" }}
          >
            返回
          </Button>
          <Title level={2} style={{ margin: 0, color: "#333" }}>
            {target.name}
          </Title>
        </div>

        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={handleManualRefresh}
          loading={refreshing}
          style={{ borderRadius: 6 }}
        >
          {refreshing ? "刷新中..." : "手动刷新"}
        </Button>
      </div>

      <Card title="目标信息" style={{ marginBottom: 24 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="名称">
            <span style={{ fontWeight: 500 }}>{target.name}</span>
          </Descriptions.Item>
          <Descriptions.Item label="URL">
            <Tooltip title={target.url}>
              <a
                href={target.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#1890ff" }}
              >
                {target.url.length > 80
                  ? `${target.url.substring(0, 80)}...`
                  : target.url}
              </a>
            </Tooltip>
          </Descriptions.Item>
          <Descriptions.Item label="设备类型">
            {renderDeviceType(target.deviceType)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {latestMetric && (
        <Card
          title={
            <Space>
              <span>最新性能数据</span>
              <Tag
                color={getGradeColor(getPerformanceGrade(latestMetric))}
                style={{ marginLeft: 8 }}
              >
                性能等级: {getPerformanceGrade(latestMetric)}
              </Tag>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 16,
            }}
          >
            <Statistic
              title={
                <span>
                  {METRICS_INFO.LCP.name}
                  <Tooltip title={METRICS_INFO.LCP.description}>
                    <QuestionCircleOutlined
                      style={{ marginLeft: 4, color: "#8c8c8c" }}
                    />
                  </Tooltip>
                </span>
              }
              value={latestMetric.lcp || "N/A"}
              suffix={latestMetric.lcp ? "ms" : ""}
              valueStyle={{
                color: getMetricColor(MetricType.LCP, latestMetric.lcp),
              }}
            />
            <Statistic
              title={
                <span>
                  {METRICS_INFO.FID.name}
                  <Tooltip title={METRICS_INFO.FID.description}>
                    <QuestionCircleOutlined
                      style={{ marginLeft: 4, color: "#8c8c8c" }}
                    />
                  </Tooltip>
                </span>
              }
              value={latestMetric.fid || "N/A"}
              suffix={latestMetric.fid ? "ms" : ""}
              valueStyle={{
                color: getMetricColor(MetricType.FID, latestMetric.fid),
              }}
            />
            <Statistic
              title={
                <span>
                  {METRICS_INFO.CLS.name}
                  <Tooltip title={METRICS_INFO.CLS.description}>
                    <QuestionCircleOutlined
                      style={{ marginLeft: 4, color: "#8c8c8c" }}
                    />
                  </Tooltip>
                </span>
              }
              value={latestMetric.cls || "N/A"}
              valueStyle={{
                color: getMetricColor(MetricType.CLS, latestMetric.cls),
              }}
            />
            <Statistic
              title={
                <span>
                  {METRICS_INFO.FCP.name}
                  <Tooltip title={METRICS_INFO.FCP.description}>
                    <QuestionCircleOutlined
                      style={{ marginLeft: 4, color: "#8c8c8c" }}
                    />
                  </Tooltip>
                </span>
              }
              value={latestMetric.fcp || "N/A"}
              suffix={latestMetric.fcp ? "ms" : ""}
              valueStyle={{
                color: getMetricColor(MetricType.FCP, latestMetric.fcp),
              }}
            />
            <Statistic
              title={
                <span>
                  {METRICS_INFO.TTFB.name}
                  <Tooltip title={METRICS_INFO.TTFB.description}>
                    <QuestionCircleOutlined
                      style={{ marginLeft: 4, color: "#8c8c8c" }}
                    />
                  </Tooltip>
                </span>
              }
              value={latestMetric.ttfb || "N/A"}
              suffix={latestMetric.ttfb ? "ms" : ""}
              valueStyle={{
                color: getMetricColor(MetricType.TTFB, latestMetric.ttfb),
              }}
            />
          </div>

          {/* 添加简要评分提示 */}
          <div
            style={{
              marginTop: 16,
              padding: 12,
              backgroundColor: "#fafafa",
              borderRadius: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 14,
              }}
            >
              <span style={{ color: "#666" }}>
                💡 综合得分:{" "}
                <span style={{ fontWeight: 600, color: "#333" }}>
                  {calculatePerformanceScore(latestMetric).toFixed(1)}
                </span>{" "}
                分
              </span>
              <Button
                type="link"
                size="small"
                onClick={() => setPerformanceCalculationVisible(true)}
                style={{ color: "#1890ff", padding: 0, height: "auto" }}
              >
                查看详细计算过程 →
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 最新截图展示 */}
      {latestMetric &&
        latestMetric.screenshots &&
        latestMetric.screenshots.length > 0 && (
          <Card
            title={
              <Space>
                <span>最新监控截图</span>
                <Tag color="blue">
                  {new Date(latestMetric.timestamp).toLocaleString()}
                </Tag>
              </Space>
            }
            style={{ marginBottom: 24 }}
          >
            <PhotoProvider>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                  gap: 16,
                }}
              >
                {latestMetric.screenshots.map(
                  (screenshot: string, index: number) => {
                    // 从文件名中提取阶段信息
                    // 文件名格式：{sessionId}_{stage}_{timestamp}.png
                    const parts = screenshot.split("_");
                    const stageKey = parts.length >= 2 ? parts[1] : "";

                    // 使用预定义的截图阶段配置
                    const stageConfig =
                      SCREENSHOT_STAGE_CONFIG[stageKey as ScreenshotStage];
                    const stageLabel = stageConfig?.label || "未知截图";
                    const stageDescription = stageConfig?.description || "";

                    // 添加时间戳参数避免缓存
                    const screenshotUrl = `/api/screenshots/${screenshot}?t=${latestMetric.timestamp}`;

                    return (
                      <div key={screenshot} style={{ textAlign: "center" }}>
                        <PhotoView src={screenshotUrl}>
                          <div
                            style={{
                              width: "100%",
                              height: 96,
                              backgroundColor: "#f5f5f5",
                              border: "1px solid #e8e8e8",
                              borderRadius: 6,
                              cursor: "pointer",
                              backgroundImage: `url(${screenshotUrl})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = "#1890ff";
                              e.currentTarget.style.boxShadow =
                                "0 2px 8px rgba(0,0,0,0.1)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "#e8e8e8";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                            title={stageDescription}
                          />
                        </PhotoView>
                        <p
                          style={{
                            fontSize: 12,
                            color: "#666",
                            marginTop: 8,
                            lineHeight: 1.2,
                          }}
                          title={stageDescription}
                        >
                          {stageLabel}
                        </p>
                      </div>
                    );
                  }
                )}
              </div>
            </PhotoProvider>

            <div
              style={{
                marginTop: 16,
                fontSize: 12,
                color: "#8c8c8c",
                textAlign: "center",
              }}
            >
              💡
              提示：每次监控执行完成后，截图会自动更新为最新结果，旧截图会被清理
            </div>
          </Card>
        )}

      <Card
        title="历史监控任务记录"
        style={{
          marginBottom: 24,
          borderRadius: 8,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          border: "1px solid #f0f0f0",
        }}
      >
        <Table
          dataSource={tasks}
          columns={taskColumns}
          rowKey="id"
          pagination={{ pageSize: 20 }}
          size="middle"
        />
      </Card>

      <Card
        title="性能指标记录"
        style={{
          marginBottom: 24,
          borderRadius: 8,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          border: "1px solid #f0f0f0",
        }}
      >
        <Table
          dataSource={metrics}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 20 }}
          size="middle"
        />
      </Card>

      {renderPerformanceCalculation()}
    </div>
  );
};

export default TargetDetail;
