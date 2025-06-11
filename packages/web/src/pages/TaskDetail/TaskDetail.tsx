import {
  ArrowLeftOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DesktopOutlined,
  InfoCircleOutlined,
  MobileOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
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
  PerformanceGrade,
  SCREENSHOT_STAGE_CONFIG,
  ScreenshotStage,
} from "../../constants";
import {
  MonitorTask,
  TaskStatus,
  WebVitalsMetrics,
  BlankScreenDetection,
  ResourceType,
} from "../../types/api";
import {
  calculatePerformanceScore,
  getGradeColor,
  getGradeLabel,
  getMetricColor,
  getPerformanceGrade,
} from "../../utils/performanceGrading";
import { PageStatusTag } from "../../components/PageStatusTag";

const { Title, Text } = Typography;

interface TaskDetailData {
  task: MonitorTask;
  metrics?: WebVitalsMetrics;
  blankScreen?: BlankScreenDetection;
}

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<TaskDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedResourceTypes, setSelectedResourceTypes] = useState<
    ResourceType[]
  >([]);

  useEffect(() => {
    if (id) {
      fetchTaskDetail();
    }
  }, [id]);

  const fetchTaskDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tasks/${id}`);
      const result = await response.json();

      if (response.ok) {
        setData(result.data);
      } else {
        message.error(result.error || "获取任务详情失败");
        navigate("/tasks");
      }
    } catch (error) {
      console.error("获取任务详情失败:", error);
      message.error("获取任务详情失败");
      navigate("/tasks");
    } finally {
      setLoading(false);
    }
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

  const renderPerformanceSection = () => {
    if (!data?.metrics) {
      return null;
    }

    const metrics = data.metrics;
    const performanceScore = metrics ? calculatePerformanceScore(metrics) : 0;
    const grade = metrics ? getPerformanceGrade(metrics) : PerformanceGrade.D;

    return (
      <Card
        title="性能指标"
        style={{ marginBottom: 24 }}
        extra={
          <Tag color={getGradeColor(grade)} style={{ fontSize: "14px" }}>
            {getGradeLabel(grade)} ({performanceScore}分)
          </Tag>
        }
      >
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Statistic
              title="LCP (最大内容绘制)"
              value={metrics.lcp || "N/A"}
              suffix="ms"
              valueStyle={{
                color: metrics.lcp
                  ? getMetricColor(MetricType.LCP, metrics.lcp)
                  : "#8c8c8c",
              }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="FID (首次输入延迟)"
              value={metrics.fid || "N/A"}
              suffix="ms"
              valueStyle={{
                color: metrics.fid
                  ? getMetricColor(MetricType.FID, metrics.fid)
                  : "#8c8c8c",
              }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="CLS (累积布局偏移)"
              value={metrics.cls?.toFixed(3) || "N/A"}
              valueStyle={{
                color: metrics.cls
                  ? getMetricColor(MetricType.CLS, metrics.cls)
                  : "#8c8c8c",
              }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="TTFB (首字节时间)"
              value={metrics.ttfb || "N/A"}
              suffix="ms"
              valueStyle={{
                color: metrics.ttfb
                  ? getMetricColor(MetricType.TTFB, metrics.ttfb)
                  : "#8c8c8c",
              }}
            />
          </Col>
        </Row>

        <Divider />

        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Statistic
              title="FCP (首次内容绘制)"
              value={metrics.fcp || "N/A"}
              suffix="ms"
              valueStyle={{
                color: metrics.fcp
                  ? getMetricColor(MetricType.FCP, metrics.fcp)
                  : "#8c8c8c",
              }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="页面加载时间"
              value={metrics.loadTime || "N/A"}
              suffix="ms"
              valueStyle={{ color: "#595959" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="DOM加载时间"
              value={metrics.domContentLoaded || "N/A"}
              suffix="ms"
              valueStyle={{ color: "#595959" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="设备类型"
              value={
                metrics.deviceType === DeviceType.MOBILE ? "移动端" : "桌面端"
              }
            />
          </Col>
        </Row>
      </Card>
    );
  };

  const renderScreenshotsSection = () => {
    const screenshots =
      data?.task.screenshots || data?.metrics?.screenshots || [];

    if (screenshots.length === 0) {
      return null;
    }

    return (
      <Card title="任务截图" style={{ marginBottom: 24 }}>
        <PhotoProvider>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: 16,
            }}
          >
            {screenshots.map((screenshot: string, index: number) => {
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
              const screenshotUrl = `/api/screenshots/${screenshot}?t=${
                data?.task.createdAt || Date.now()
              }`;

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
            })}
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
          💡 提示：点击截图可放大查看，每个截图对应页面加载的不同阶段
        </div>
      </Card>
    );
  };

  const renderBlankScreenSection = () => {
    if (!data?.blankScreen) {
      return null;
    }

    const blankScreen = data.blankScreen;

    return (
      <Card
        title="白屏检测结果"
        style={{ marginBottom: 24 }}
        extra={
          <Tag color={blankScreen.isBlankScreen ? "red" : "green"}>
            {blankScreen.isBlankScreen ? "检测到白屏" : "页面正常"}
          </Tag>
        }
      >
        {blankScreen.isBlankScreen && blankScreen.reason && (
          <Alert
            message="白屏异常详情"
            description={blankScreen.reason}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Descriptions column={2} size="small">
          <Descriptions.Item label="检测结果">
            {blankScreen.isBlankScreen ? "异常页面" : "正常页面"}
          </Descriptions.Item>
          <Descriptions.Item label="检测时间">
            {formatTimestamp(blankScreen.timestamp)}
          </Descriptions.Item>
          {blankScreen.screenshot && (
            <Descriptions.Item label="异常截图" span={2}>
              <PhotoProvider>
                <PhotoView src={`/api/screenshots/${blankScreen.screenshot}`}>
                  <img
                    src={`/api/screenshots/${blankScreen.screenshot}`}
                    alt="异常截图"
                    style={{
                      width: 100,
                      height: 60,
                      objectFit: "cover",
                      cursor: "pointer",
                      border: "1px solid #e8e8e8",
                      borderRadius: 4,
                    }}
                  />
                </PhotoView>
              </PhotoProvider>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    );
  };

  const renderResourceStatsSection = () => {
    const resourceStats = data?.task.resourceStats;
    if (!resourceStats) {
      return null;
    }

    // 资源类型中文映射
    const getResourceTypeLabel = (type: ResourceType): string => {
      const typeMap: { [key in ResourceType]: string } = {
        // 脚本
        [ResourceType.SCRIPT]: "JavaScript",

        // 样式
        [ResourceType.STYLESHEET]: "CSS样式",

        // 图片
        [ResourceType.IMAGE]: "图片",
        [ResourceType.IMAGE_JPG]: "JPG图片",
        [ResourceType.IMAGE_PNG]: "PNG图片",
        [ResourceType.IMAGE_GIF]: "GIF动图",
        [ResourceType.IMAGE_WEBP]: "WebP图片",
        [ResourceType.IMAGE_SVG]: "SVG图标",

        // 字体
        [ResourceType.FONT]: "字体文件",
        [ResourceType.FONT_WOFF]: "WOFF字体",
        [ResourceType.FONT_WOFF2]: "WOFF2字体",
        [ResourceType.FONT_TTF]: "TTF字体",
        [ResourceType.FONT_OTF]: "OTF字体",
        [ResourceType.FONT_EOT]: "EOT字体",

        // 视频
        [ResourceType.VIDEO]: "视频文件",
        [ResourceType.VIDEO_MP4]: "MP4视频",
        [ResourceType.VIDEO_WEBM]: "WebM视频",

        // 音频
        [ResourceType.AUDIO]: "音频文件",
        [ResourceType.AUDIO_MP3]: "MP3音频",
        [ResourceType.AUDIO_WAV]: "WAV音频",
        [ResourceType.AUDIO_OGG]: "OGG音频",

        // 文档
        [ResourceType.DOCUMENT]: "文档文件",
        [ResourceType.DOCUMENT_PDF]: "PDF文档",
        [ResourceType.DOCUMENT_WORD]: "Word文档",
        [ResourceType.DOCUMENT_EXCEL]: "Excel文档",
        [ResourceType.DOCUMENT_POWERPOINT]: "PPT文档",

        // 数据
        [ResourceType.DATA_JSON]: "JSON数据",
        [ResourceType.DATA_XML]: "XML数据",

        // 其他
        [ResourceType.MANIFEST]: "应用清单",
        [ResourceType.SERVICEWORKER]: "Service Worker",
        [ResourceType.WASM]: "WebAssembly",
        [ResourceType.ARCHIVE]: "压缩文件",
        [ResourceType.OTHER]: "其他",
      };

      return typeMap[type] || type.toUpperCase();
    };

    // 获取资源类型颜色
    const getResourceTypeColor = (type: ResourceType): string => {
      if (type.startsWith("image")) return "green";
      if (type.startsWith("font")) return "purple";
      if (type.startsWith("video")) return "red";
      if (type.startsWith("audio")) return "orange";
      if (type.startsWith("document")) return "blue";
      if (type.startsWith("data")) return "cyan";
      if (type === ResourceType.SCRIPT) return "gold";
      if (type === ResourceType.STYLESHEET) return "lime";
      if (type === ResourceType.SERVICEWORKER) return "magenta";
      if (type === ResourceType.WASM) return "volcano";
      return "default";
    };

    // 格式化文件大小
    const formatSize = (bytes: number) => {
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    // 获取所有可用的资源类型
    const allResourceTypes = Array.from(
      new Set((resourceStats.resources || []).map((r) => r.type))
    ).sort();

    // 根据选中的类型过滤资源列表
    // 默认空选择时显示全部资源
    const filteredResources = (resourceStats.resources || []).filter(
      (resource) =>
        selectedResourceTypes.length === 0 ||
        selectedResourceTypes.includes(resource.type)
    );

    // 按资源类型分组数据
    const typeStats = Object.entries(resourceStats.byType || {}).map(
      ([type, stats]) => ({
        type,
        ...stats,
      })
    );

    // 资源列表表格列定义
    const resourceColumns = [
      {
        title: "URL",
        dataIndex: "url",
        key: "url",
        ellipsis: true,
        width: "40%",
        render: (url: string) => (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ wordBreak: "break-all" }}
          >
            {url}
          </a>
        ),
      },
      {
        title: "类型",
        dataIndex: "type",
        key: "type",
        width: "15%",
        render: (type: ResourceType) => (
          <Tag color={getResourceTypeColor(type)}>
            {getResourceTypeLabel(type)}
          </Tag>
        ),
      },
      {
        title: "大小",
        dataIndex: "size",
        key: "size",
        width: "15%",
        render: (size: number) => formatSize(size),
        sorter: (a: any, b: any) => a.size - b.size,
      },
      {
        title: "加载时间",
        dataIndex: "loadTime",
        key: "loadTime",
        width: "15%",
        render: (time: number) => `${time}ms`,
        sorter: (a: any, b: any) => a.loadTime - b.loadTime,
      },
      {
        title: "状态",
        dataIndex: "status",
        key: "status",
        width: "15%",
        render: (status: number) => (
          <Tag color={status >= 200 && status < 300 ? "green" : "red"}>
            {status}
          </Tag>
        ),
      },
    ];

    return (
      <Card title="静态资源统计" style={{ marginBottom: 24 }}>
        {/* 总体统计 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic
              title="总资源数"
              value={resourceStats.totalCount}
              prefix={<InfoCircleOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="总体积"
              value={formatSize(resourceStats.totalSize)}
              prefix={<InfoCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="总加载时间"
              value={resourceStats.totalLoadTime}
              suffix="ms"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="平均加载时间"
              value={
                resourceStats.totalCount > 0
                  ? Math.round(
                      resourceStats.totalLoadTime / resourceStats.totalCount
                    )
                  : 0
              }
              suffix="ms"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Col>
        </Row>

        <Divider />

        {/* 按类型统计 */}
        {typeStats.length > 0 && (
          <>
            <Title level={5}>资源类型统计</Title>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              {typeStats.map(({ type, count, size, loadTime }) => (
                <Col span={6} key={type}>
                  <Card size="small" style={{ textAlign: "center" }}>
                    <Statistic
                      title={
                        <Tag
                          color={getResourceTypeColor(type as ResourceType)}
                          style={{ margin: 0 }}
                        >
                          {getResourceTypeLabel(type as ResourceType)}
                        </Tag>
                      }
                      value={count}
                      suffix="个"
                      valueStyle={{ fontSize: "18px" }}
                    />
                    <div
                      style={{ fontSize: "12px", color: "#666", marginTop: 8 }}
                    >
                      <div>体积: {formatSize(size)}</div>
                      <div>耗时: {loadTime}ms</div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        )}

        <Divider />

        {/* 详细资源列表 */}
        <Title level={5}>资源详情</Title>

        {/* 资源类型筛选器 */}
        {allResourceTypes.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>
              按资源类型筛选：
            </div>
            <Row gutter={[16, 8]} align="middle">
              <Col flex="auto">
                <Select
                  mode="multiple"
                  placeholder="默认显示全部资源，选择类型进行筛选"
                  value={selectedResourceTypes}
                  onChange={setSelectedResourceTypes}
                  style={{ width: "100%" }}
                  optionLabelProp="label"
                  maxTagCount="responsive"
                  allowClear
                >
                  {allResourceTypes.map((type) => {
                    const count = (resourceStats.resources || []).filter(
                      (r) => r.type === type
                    ).length;
                    return (
                      <Select.Option
                        key={type}
                        value={type}
                        label={getResourceTypeLabel(type as ResourceType)}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>
                            <Tag
                              color={getResourceTypeColor(type as ResourceType)}
                              style={{ margin: 0, marginRight: 8 }}
                            >
                              {getResourceTypeLabel(type as ResourceType)}
                            </Tag>
                          </span>
                          <span style={{ color: "#999", fontSize: "12px" }}>
                            {count} 个
                          </span>
                        </div>
                      </Select.Option>
                    );
                  })}
                </Select>
              </Col>
              <Col>
                <Space>
                  <Button
                    size="small"
                    onClick={() => {
                      if (
                        selectedResourceTypes.length === allResourceTypes.length
                      ) {
                        setSelectedResourceTypes([]);
                      } else {
                        setSelectedResourceTypes(allResourceTypes);
                      }
                    }}
                  >
                    {selectedResourceTypes.length === allResourceTypes.length
                      ? "清空"
                      : "全选"}
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setSelectedResourceTypes([])}
                  >
                    清空
                  </Button>
                </Space>
              </Col>
            </Row>
          </div>
        )}

        <div style={{ fontSize: "12px", color: "#8c8c8c", marginBottom: 16 }}>
          💡 提示：点击资源URL可以在新标签页中打开，表格支持按大小和加载时间排序
          {selectedResourceTypes.length === 0 ? (
            <span style={{ color: "#52c41a", marginLeft: 8 }}>
              · 当前显示全部资源 ({(resourceStats.resources || []).length} 个)
            </span>
          ) : (
            <span style={{ color: "#1890ff", marginLeft: 8 }}>
              · 当前显示 {selectedResourceTypes.length}/
              {allResourceTypes.length} 种类型的资源 ({filteredResources.length}{" "}
              个)
            </span>
          )}
        </div>
        <div style={{ overflowX: "auto" }}>
          <Table
            dataSource={filteredResources}
            columns={resourceColumns}
            rowKey="url"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            }}
            size="small"
            scroll={{ x: 800 }}
          />
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px 0" }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载任务详情中...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ textAlign: "center", padding: "50px 0" }}>
        <div>任务不存在或已被删除</div>
        <Button
          type="primary"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/tasks")}
          style={{ marginTop: 16 }}
        >
          返回任务列表
        </Button>
      </div>
    );
  }

  const { task } = data;

  return (
    <div style={{ padding: "24px" }}>
      {/* 页头 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/tasks")}
            style={{ marginRight: 16 }}
          >
            返回任务列表
          </Button>
          <Title level={2} style={{ margin: 0 }}>
            任务详情
          </Title>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchTaskDetail}
          loading={loading}
        >
          刷新
        </Button>
      </div>

      {/* 基本信息 */}
      <Card title="基本信息" style={{ marginBottom: 24 }}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="任务ID">
            <code
              style={{
                fontSize: "12px",
                padding: "2px 4px",
                backgroundColor: "#f5f5f5",
                borderRadius: "3px",
                wordBreak: "break-all",
              }}
            >
              {task.id}
            </code>
          </Descriptions.Item>
          <Descriptions.Item label="任务状态">
            {renderTaskStatus(task.status)}
          </Descriptions.Item>
          <Descriptions.Item label="目标名称">
            <Button
              type="link"
              style={{ padding: 0 }}
              onClick={() => navigate(`/targets/${task.targetId}`)}
            >
              {task.targetName}
            </Button>
          </Descriptions.Item>
          <Descriptions.Item label="目标URL">
            <a
              href={task.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ wordBreak: "break-all" }}
            >
              {task.targetUrl}
            </a>
          </Descriptions.Item>
          <Descriptions.Item label="设备类型">
            {renderDeviceType(task.deviceType)}
          </Descriptions.Item>
          <Descriptions.Item label="页面状态">
            <PageStatusTag
              status={task.pageStatus || PageStatus.UNKNOWN}
              reason={task.pageStatusReason}
            />
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            <Space>
              <CalendarOutlined />
              {formatTimestamp(task.createdAt)}
            </Space>
          </Descriptions.Item>
          {task.startedAt && (
            <Descriptions.Item label="开始时间">
              <Space>
                <ClockCircleOutlined />
                {formatTimestamp(task.startedAt)}
              </Space>
            </Descriptions.Item>
          )}
          {task.completedAt && (
            <Descriptions.Item label="完成时间">
              <Space>
                <ClockCircleOutlined />
                {formatTimestamp(task.completedAt)}
              </Space>
            </Descriptions.Item>
          )}
          {task.duration && (
            <Descriptions.Item label="执行时长">
              <Space>
                <ClockCircleOutlined />
                {task.duration}ms
              </Space>
            </Descriptions.Item>
          )}
          {task.error && (
            <Descriptions.Item label="错误信息" span={2}>
              <Alert
                message="任务执行失败"
                description={task.error}
                type="error"
                showIcon
              />
            </Descriptions.Item>
          )}
          {task.pageStatusReason && !task.error && (
            <Descriptions.Item label="页面状态说明" span={2}>
              <Alert
                message="页面状态详情"
                description={task.pageStatusReason}
                type={
                  task.pageStatus === PageStatus.ABNORMAL ? "warning" : "info"
                }
                showIcon
              />
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* 截图展示 */}
      {renderScreenshotsSection()}

      {/* 性能指标 */}
      {renderPerformanceSection()}

      {/* 白屏检测结果 */}
      {renderBlankScreenSection()}

      {/* 静态资源统计 */}
      {renderResourceStatsSection()}
    </div>
  );
};

export default TaskDetail;
