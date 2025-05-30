import {
  AimOutlined,
  BugOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FireOutlined,
  LineChartOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  RocketOutlined,
  TrophyOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Empty,
  List,
  Progress,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { COLORS, DeviceType, MetricType } from "../../constants";
import {
  MonitorTarget,
  MonitorTask,
  TaskStats,
  WebVitalsMetrics,
} from "../../types/api";
import {
  getGradeColor,
  getMetricColor,
  getPerformanceGrade,
} from "../../utils/performanceGrading";

const { Title, Text } = Typography;

interface DashboardStats {
  totalTargets: number;
  activeTargets: number;
  totalMonitorings: number;
  avgPerformanceScore: number;
  criticalIssues: number;
  warningIssues: number;
}

interface PerformanceTrend {
  date: string;
  avgLcp: number;
  avgFid: number;
  avgCls: number;
  score: number;
}

interface RecentIssue {
  id: string;
  targetName: string;
  targetUrl: string;
  type: "critical" | "warning";
  message: string;
  timestamp: number;
  metric: string;
  value: number;
}

const Dashboard: React.FC = () => {
  const [targets, setTargets] = useState<MonitorTarget[]>([]);
  const [recentMetrics, setRecentMetrics] = useState<WebVitalsMetrics[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<MonitorTask[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null
  );
  const [recentIssues, setRecentIssues] = useState<RecentIssue[]>([]);
  const [performanceTrend, setPerformanceTrend] = useState<PerformanceTrend[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchTargets(),
          fetchRecentMetrics(),
          fetchTaskStats(),
          fetchRecentTasks(),
          fetchDashboardStats(),
          fetchRecentIssues(),
          fetchPerformanceTrend(),
        ]);
      } catch (error) {
        console.error("获取数据失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // 每30秒自动刷新数据
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTargets = async () => {
    const response = await fetch("/api/targets");
    const data = await response.json();
    setTargets(data.data || []);
  };

  const fetchRecentMetrics = async () => {
    const response = await fetch("/api/metrics?hours=24");
    const data = await response.json();
    setRecentMetrics(data.data || []);
  };

  const fetchTaskStats = async () => {
    const response = await fetch("/api/tasks/stats");
    const data = await response.json();
    setTaskStats(data.data);
  };

  const fetchRecentTasks = async () => {
    const response = await fetch("/api/tasks");
    const data = await response.json();
    // 只获取最近5个任务
    setRecentTasks((data.data || []).slice(0, 5));
  };

  const fetchDashboardStats = async () => {
    // 计算仪表盘统计数据
    const totalTargets = targets.length;
    const activeTargets = targets.filter((t) => t.enabled).length;
    const totalMonitorings = recentMetrics.length;

    // 计算平均性能分数
    const performanceScores = recentMetrics.map((m) => {
      const grade = getPerformanceGrade(m);
      switch (grade) {
        case "A":
          return 90;
        case "B":
          return 80;
        case "C":
          return 70;
        case "D":
          return 60;
        default:
          return 50;
      }
    });
    const avgPerformanceScore =
      performanceScores.length > 0
        ? Math.round(
            performanceScores.reduce((a, b) => a + b, 0) /
              performanceScores.length
          )
        : 0;

    // 计算问题数量
    const criticalIssues = recentMetrics.filter(
      (m) =>
        (m.lcp && m.lcp > 4000) ||
        (m.cls && m.cls > 0.25) ||
        (m.fid && m.fid > 300)
    ).length;
    const warningIssues = recentMetrics.filter(
      (m) =>
        (m.lcp && m.lcp > 2500 && m.lcp <= 4000) ||
        (m.cls && m.cls > 0.1 && m.cls <= 0.25) ||
        (m.fid && m.fid > 100 && m.fid <= 300)
    ).length;

    setDashboardStats({
      totalTargets,
      activeTargets,
      totalMonitorings,
      avgPerformanceScore,
      criticalIssues,
      warningIssues,
    });
  };

  const fetchRecentIssues = async () => {
    // 模拟获取最近的性能问题
    const issues: RecentIssue[] = [];
    recentMetrics.forEach((metric) => {
      const target = targets.find((t) => t.id === metric.targetId);
      if (!target) return;

      if (metric.lcp && metric.lcp > 4000) {
        issues.push({
          id: `${metric.id}-lcp`,
          targetName: target.name,
          targetUrl: target.url,
          type: "critical",
          message: `LCP指标严重超标`,
          timestamp: metric.timestamp,
          metric: "LCP",
          value: metric.lcp,
        });
      } else if (metric.lcp && metric.lcp > 2500) {
        issues.push({
          id: `${metric.id}-lcp-warning`,
          targetName: target.name,
          targetUrl: target.url,
          type: "warning",
          message: `LCP指标需要优化`,
          timestamp: metric.timestamp,
          metric: "LCP",
          value: metric.lcp,
        });
      }

      if (metric.cls && metric.cls > 0.25) {
        issues.push({
          id: `${metric.id}-cls`,
          targetName: target.name,
          targetUrl: target.url,
          type: "critical",
          message: `CLS布局偏移严重`,
          timestamp: metric.timestamp,
          metric: "CLS",
          value: metric.cls,
        });
      }
    });

    // 按时间倒序排列，只取最近10个
    issues.sort((a, b) => b.timestamp - a.timestamp);
    setRecentIssues(issues.slice(0, 10));
  };

  const fetchPerformanceTrend = async () => {
    // 模拟7天性能趋势数据
    const trends: PerformanceTrend[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      // 模拟数据
      trends.push({
        date: dateStr,
        avgLcp: 2000 + Math.random() * 1000,
        avgFid: 50 + Math.random() * 100,
        avgCls: 0.05 + Math.random() * 0.1,
        score: 70 + Math.random() * 20,
      });
    }
    setPerformanceTrend(trends);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("zh-CN");
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#8c8c8c";
      case "running":
        return "#1890ff";
      case "success":
        return "#52c41a";
      case "failed":
        return "#f5222d";
      default:
        return "#8c8c8c";
    }
  };

  const getTaskStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "等待中";
      case "running":
        return "执行中";
      case "success":
        return "成功";
      case "failed":
        return "失败";
      default:
        return "未知";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-6">
        <Title level={2} className="m-0 flex items-center gap-2">
          <DashboardOutlined /> 监控概览
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/tasks")}
        >
          新建监控任务
        </Button>
      </div>

      {/* 核心统计卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="监控目标"
              value={dashboardStats?.totalTargets || 0}
              prefix={<AimOutlined />}
              valueStyle={{ color: "#1890ff" }}
              suffix={
                <Text type="secondary" className="text-xs">
                  / {dashboardStats?.activeTargets || 0} 活跃
                </Text>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="性能评分"
              value={dashboardStats?.avgPerformanceScore || 0}
              prefix={<TrophyOutlined />}
              suffix="/100"
              valueStyle={{
                color:
                  (dashboardStats?.avgPerformanceScore || 0) >= 80
                    ? "#52c41a"
                    : (dashboardStats?.avgPerformanceScore || 0) >= 60
                    ? "#fa8c16"
                    : "#f5222d",
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="严重问题"
              value={dashboardStats?.criticalIssues || 0}
              prefix={<BugOutlined />}
              valueStyle={{ color: "#f5222d" }}
              suffix={
                <Text type="secondary" className="text-xs">
                  / {dashboardStats?.warningIssues || 0} 警告
                </Text>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日监控"
              value={dashboardStats?.totalMonitorings || 0}
              prefix={<EyeOutlined />}
              valueStyle={{ color: "#722ed1" }}
              suffix="次"
            />
          </Card>
        </Col>
      </Row>

      {/* 任务执行状况 */}
      {taskStats && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <RocketOutlined />
                  <span>任务执行状况</span>
                </Space>
              }
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="总任务数"
                    value={taskStats.total}
                    valueStyle={{ color: "#1890ff" }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="成功率"
                    value={taskStats.successRate}
                    suffix="%"
                    valueStyle={{ color: "#52c41a" }}
                  />
                </Col>
              </Row>
              <div className="mt-4">
                <Text type="secondary">执行进度</Text>
                <Progress
                  percent={
                    taskStats.total > 0
                      ? Math.round(
                          ((taskStats.success + taskStats.failed) /
                            taskStats.total) *
                            100
                        )
                      : 0
                  }
                  success={{
                    percent:
                      taskStats.total > 0
                        ? Math.round(
                            (taskStats.success / taskStats.total) * 100
                          )
                        : 0,
                  }}
                  className="mt-2"
                />
                <div className="flex justify-between mt-2 text-xs">
                  <Text type="secondary">排队: {taskStats.pending}</Text>
                  <Text type="secondary">执行中: {taskStats.running}</Text>
                  <Text type="secondary">
                    已完成: {taskStats.success + taskStats.failed}
                  </Text>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <ClockCircleOutlined />
                  <span>最近任务</span>
                </Space>
              }
            >
              {recentTasks.length > 0 ? (
                <List
                  size="small"
                  dataSource={recentTasks}
                  renderItem={(task) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Badge
                            color={getTaskStatusColor(task.status)}
                            text={getTaskStatusText(task.status)}
                          />
                        }
                        title={
                          <Text ellipsis className="max-w-200">
                            {task.targetName}
                          </Text>
                        }
                        description={
                          <Text type="secondary" className="text-xs">
                            {formatTimestamp(task.createdAt)}
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无任务" />
              )}
            </Card>
          </Col>
        </Row>
      )}

      {/* 性能问题告警 */}
      {recentIssues.length > 0 && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col span={24}>
            <Alert
              message={
                <Space>
                  <WarningOutlined />
                  <span>
                    发现{" "}
                    {recentIssues.filter((i) => i.type === "critical").length}{" "}
                    个严重性能问题，
                    {
                      recentIssues.filter((i) => i.type === "warning").length
                    }{" "}
                    个警告
                  </span>
                </Space>
              }
              type="warning"
              showIcon
              closable
            />
          </Col>
        </Row>
      )}

      <Row gutter={[16, 16]}>
        {/* 性能问题列表 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <FireOutlined />
                <span>性能问题</span>
              </Space>
            }
            extra={
              <Button
                type="link"
                size="small"
                onClick={() => navigate("/targets")}
              >
                查看全部
              </Button>
            }
          >
            {recentIssues.length > 0 ? (
              <List
                size="small"
                dataSource={recentIssues.slice(0, 6)}
                renderItem={(issue) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          size="small"
                          style={{
                            backgroundColor:
                              issue.type === "critical" ? "#f5222d" : "#fa8c16",
                          }}
                        >
                          {issue.metric}
                        </Avatar>
                      }
                      title={
                        <div>
                          <Text ellipsis className="max-w-180">
                            {issue.targetName}
                          </Text>
                          <Tag
                            color={issue.type === "critical" ? "red" : "orange"}
                            size="small"
                            className="ml-2"
                          >
                            {issue.value.toFixed(
                              issue.metric === "CLS" ? 3 : 0
                            )}
                            {issue.metric === "CLS" ? "" : "ms"}
                          </Tag>
                        </div>
                      }
                      description={
                        <Text type="secondary" className="text-xs">
                          {issue.message} · {formatTimestamp(issue.timestamp)}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无性能问题" />
            )}
          </Card>
        </Col>

        {/* 最近监控记录 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <LineChartOutlined />
                <span>最近监控记录</span>
              </Space>
            }
            extra={
              <Button
                type="link"
                size="small"
                onClick={() => navigate("/targets")}
              >
                查看详情
              </Button>
            }
          >
            {recentMetrics.length > 0 ? (
              <List
                size="small"
                dataSource={recentMetrics.slice(0, 6)}
                renderItem={(metric) => {
                  const target = targets.find((t) => t.id === metric.targetId);
                  const grade = getPerformanceGrade(metric);
                  return (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Tag color={getGradeColor(grade)} className="m-0">
                            {grade}
                          </Tag>
                        }
                        title={
                          <Text ellipsis className="max-w-180">
                            {target?.name || "未知目标"}
                          </Text>
                        }
                        description={
                          <Space size="small" className="text-xs">
                            <Text type="secondary">
                              LCP: {metric.lcp || "-"}ms
                            </Text>
                            <Text type="secondary">
                              CLS: {metric.cls || "-"}
                            </Text>
                            <Text type="secondary">
                              {formatTimestamp(metric.timestamp)}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            ) : (
              <Empty description="暂无监控记录" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
