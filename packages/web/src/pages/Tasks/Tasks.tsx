import {
  AppstoreOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { DEVICE_TYPE_CONFIG, DeviceType, PageStatus } from "../../constants";
import {
  MonitorTarget,
  MonitorTask,
  TargetGroup,
  TaskStats,
  TaskStatus,
} from "../../types/api";
import { PageStatusTag } from "../../components/PageStatusTag";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<MonitorTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<MonitorTask[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [groups, setGroups] = useState<TargetGroup[]>([]);
  const [groupsWithCounts, setGroupsWithCounts] = useState<
    Array<TargetGroup & { targetCount: number }>
  >([]);
  const [targets, setTargets] = useState<MonitorTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [creatingTasks, setCreatingTasks] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [form] = Form.useForm();

  // 筛选器状态
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    groupId: "",
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
    pageStatus: "",
  });

  useEffect(() => {
    fetchTasks();
    fetchStats();
    fetchGroups();
    fetchTargets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tasks, filters, targets]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tasks");
      const data = await response.json();
      setTasks(data.data || []);
    } catch (error) {
      console.error("获取任务列表失败:", error);
      message.error("获取任务列表失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/tasks/stats");
      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error("获取任务统计失败:", error);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/groups");
      const data = await response.json();
      setGroups(data.data || []);
    } catch (error) {
      console.error("获取分组失败:", error);
      message.error("获取分组失败");
    }
  };

  const fetchTargets = async () => {
    try {
      const response = await fetch("/api/targets");
      const data = await response.json();
      setTargets(data.data || []);
    } catch (error) {
      console.error("获取目标列表失败:", error);
    }
  };

  const fetchGroupsWithCounts = async () => {
    try {
      setLoadingGroups(true);
      const groupsWithCounts = await Promise.all(
        groups.map(async (group) => {
          try {
            const response = await fetch(
              `/api/groups/${group.id}/targets/count`
            );
            const data = await response.json();
            return {
              ...group,
              targetCount: data.data?.count || 0,
            };
          } catch (error) {
            console.error(`获取分组 ${group.name} 目标数量失败:`, error);
            return {
              ...group,
              targetCount: 0,
            };
          }
        })
      );

      // 只显示有目标的分组
      const validGroups = groupsWithCounts.filter(
        (group) => group.targetCount > 0
      );
      setGroupsWithCounts(validGroups);
    } catch (error) {
      console.error("获取分组目标数量失败:", error);
      message.error("获取分组目标数量失败");
    } finally {
      setLoadingGroups(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    // 搜索过滤（目标名称和URL）
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.targetName.toLowerCase().includes(searchTerm) ||
          task.targetUrl.toLowerCase().includes(searchTerm)
      );
    }

    // 状态过滤
    if (filters.status) {
      filtered = filtered.filter((task) => task.status === filters.status);
    }

    // 分组过滤
    if (filters.groupId && targets.length > 0) {
      const groupTargetIds = targets
        .filter((target) => target.groupId === filters.groupId)
        .map((target) => target.id);

      filtered = filtered.filter((task) =>
        groupTargetIds.includes(task.targetId)
      );
    }

    // 时间范围过滤
    if (filters.dateRange) {
      const [startDate, endDate] = filters.dateRange;
      const startTime = startDate.startOf("day").valueOf();
      const endTime = endDate.endOf("day").valueOf();

      filtered = filtered.filter(
        (task) => task.createdAt >= startTime && task.createdAt <= endTime
      );
    }

    // 页面状态过滤
    if (filters.pageStatus) {
      filtered = filtered.filter(
        (task) => task.pageStatus === filters.pageStatus
      );
    }

    setFilteredTasks(filtered);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "",
      groupId: "",
      dateRange: null,
      pageStatus: "",
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchTasks(), fetchStats(), fetchTargets()]);
    setRefreshing(false);
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        message.success("任务已删除");
        fetchTasks();
        fetchStats();
      } else {
        const data = await response.json();
        message.error(data.error || "删除失败");
      }
    } catch (error) {
      console.error("删除任务失败:", error);
      message.error("删除任务失败");
    }
  };

  const handleCreateTasks = () => {
    form.resetFields();
    setCreateModalVisible(true);
    fetchGroupsWithCounts();
  };

  const handleCreateModalOk = async () => {
    try {
      const values = await form.validateFields();
      setCreatingTasks(true);

      // 获取选中分组下的所有目标
      const response = await fetch("/api/targets");
      const targetsData = await response.json();
      const allTargets = targetsData.data || [];

      // 过滤出选中分组下的目标
      const groupTargets = allTargets.filter(
        (target: any) => target.groupId === values.groupId
      );

      if (groupTargets.length === 0) {
        message.warning("选中的分组下没有监控目标");
        return;
      }

      // 批量创建任务
      const targetIds = groupTargets.map((target: any) => target.id);
      const createResponse = await fetch("/api/tasks/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetIds }),
      });

      const createData = await createResponse.json();
      if (createResponse.ok) {
        message.success(`成功创建 ${groupTargets.length} 个监控任务`);
        setCreateModalVisible(false);
        form.resetFields();
        fetchTasks();
        fetchStats();
      } else {
        message.error(createData.error || "创建任务失败");
      }
    } catch (error) {
      console.error("创建任务失败:", error);
      message.error("创建任务失败");
    } finally {
      setCreatingTasks(false);
    }
  };

  const handleCreateModalCancel = () => {
    setCreateModalVisible(false);
    form.resetFields();
    setGroupsWithCounts([]);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const renderStatus = (status: TaskStatus) => {
    const statusConfig = {
      [TaskStatus.PENDING]: {
        color: "default",
        icon: <ClockCircleOutlined />,
        text: "未开始",
      },
      [TaskStatus.RUNNING]: {
        color: "processing",
        icon: <PlayCircleOutlined />,
        text: "执行中",
      },
      [TaskStatus.SUCCESS]: {
        color: "success",
        icon: <CheckCircleOutlined />,
        text: "执行成功",
      },
      [TaskStatus.FAILED]: {
        color: "error",
        icon: <CloseCircleOutlined />,
        text: "执行失败",
      },
    };

    const config = statusConfig[status];
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const renderDeviceType = (deviceType: DeviceType) => {
    const config = DEVICE_TYPE_CONFIG[deviceType];
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  const getDuration = (task: MonitorTask) => {
    if (!task.startedAt) return "-";

    const endTime = task.completedAt || Date.now();
    const duration = Math.round((endTime - task.startedAt) / 1000);

    if (duration < 60) {
      return `${duration}秒`;
    } else {
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      return `${minutes}分${seconds}秒`;
    }
  };

  const getTargetGroupName = (targetId: string) => {
    // 这里需要根据targetId查找对应的分组名称
    // 由于任务中没有直接包含分组信息，我们需要从目标列表中查找
    return "未知分组"; // 临时显示，实际需要异步获取
  };

  const getTaskStatusConfig = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.PENDING:
        return { color: "blue", text: "等待中" };
      case TaskStatus.RUNNING:
        return { color: "orange", text: "执行中" };
      case TaskStatus.SUCCESS:
        return { color: "green", text: "成功" };
      case TaskStatus.FAILED:
        return { color: "red", text: "失败" };
      default:
        return { color: "default", text: "未知" };
    }
  };

  const getPageStatusConfig = (status: PageStatus) => {
    switch (status) {
      case PageStatus.NORMAL:
        return { color: "green", text: "正常" };
      case PageStatus.ABNORMAL:
        return { color: "red", text: "异常" };
      case PageStatus.UNKNOWN:
        return { color: "gray", text: "未知" };
      case PageStatus.QUEUED:
        return { color: "blue", text: "队列中" };
      case PageStatus.CHECKING:
        return { color: "orange", text: "检测中" };
      default:
        return { color: "default", text: "未知" };
    }
  };

  const formatDuration = (startTime: number, endTime?: number) => {
    if (!endTime) return "-";
    const duration = endTime - startTime;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  const showErrorDetail = (error: string) => {
    Modal.info({
      title: "错误详情",
      content: (
        <div className="max-w-96">
          <div className="font-bold mb-1">错误信息</div>
          <div className="whitespace-pre-line">{error}</div>
        </div>
      ),
      width: 600,
    });
  };

  const columns = [
    {
      title: "任务ID",
      dataIndex: "id",
      key: "id",
      width: 320,
      render: (id: string) => (
        <Tooltip title="点击复制完整ID">
          <code
            className="cursor-pointer text-xs py-1 px-1.5 bg-gray-100 rounded border border-gray-300 break-all"
            onClick={() => {
              navigator.clipboard.writeText(id);
            }}
          >
            {id}
          </code>
        </Tooltip>
      ),
    },
    {
      title: "目标名称",
      dataIndex: "targetName",
      key: "targetName",
      width: 200,
    },
    {
      title: "目标URL",
      dataIndex: "targetUrl",
      key: "targetUrl",
      width: 300,
      ellipsis: true,
    },
    {
      title: "设备类型",
      dataIndex: "deviceType",
      key: "deviceType",
      width: 100,
      render: renderDeviceType,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: TaskStatus) => {
        const config = getTaskStatusConfig(status);
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "页面状态",
      key: "pageStatus",
      width: 100,
      render: (record: MonitorTask) => {
        return (
          <PageStatusTag
            status={record.pageStatus}
            reason={record.pageStatusReason}
          />
        );
      },
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: formatTimestamp,
    },
    {
      title: "开始时间",
      dataIndex: "startedAt",
      key: "startedAt",
      width: 160,
      render: (startedAt: number) =>
        startedAt ? formatTimestamp(startedAt) : "-",
    },
    {
      title: "耗时",
      key: "duration",
      width: 80,
      render: (record: MonitorTask) => getDuration(record),
    },
    {
      title: "错误信息",
      dataIndex: "error",
      key: "error",
      width: 200,
      render: (error: string) => {
        if (!error) return <span className="text-gray-400">-</span>;
        return (
          <Tooltip title="点击查看详细错误信息">
            <span
              className="text-red-500 cursor-help"
              onClick={() => showErrorDetail(error)}
            >
              {error.length > 50 ? `${error.substring(0, 50)}...` : error}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "操作",
      key: "actions",
      width: 120,
      fixed: "right" as const,
      render: (_: any, record: MonitorTask) => (
        <Space>
          {record.status === TaskStatus.SUCCESS && record.resultId && (
            <Button
              type="link"
              size="small"
              onClick={() =>
                window.open(`/targets/${record.targetId}`, "_blank")
              }
            >
              查看结果
            </Button>
          )}
          {(record.status === TaskStatus.SUCCESS ||
            record.status === TaskStatus.FAILED) && (
            <Popconfirm
              title="确认删除"
              description="确定要删除这个任务吗？"
              onConfirm={() => handleDeleteTask(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // 计算统计数据
  const localStats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === TaskStatus.PENDING).length,
    running: tasks.filter((t) => t.status === TaskStatus.RUNNING).length,
    completed: tasks.filter((t) => t.status === TaskStatus.SUCCESS).length,
    failed: tasks.filter((t) => t.status === TaskStatus.FAILED).length,
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-6">
        <Title level={2} className="m-0 flex items-center gap-2">
          <UnorderedListOutlined /> 任务中心
        </Title>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateTasks}
          >
            新建任务
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={refreshing}
          >
            刷新
          </Button>
        </Space>
      </div>

      {/* 筛选器 */}
      <Card className="mb-6">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="搜索目标名称或URL"
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="任务状态"
              value={filters.status}
              onChange={(value) => handleFilterChange("status", value)}
              allowClear
              style={{ width: "100%" }}
            >
              <Option value={TaskStatus.PENDING}>等待中</Option>
              <Option value={TaskStatus.RUNNING}>执行中</Option>
              <Option value={TaskStatus.SUCCESS}>成功</Option>
              <Option value={TaskStatus.FAILED}>失败</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="页面状态"
              value={filters.pageStatus}
              onChange={(value) => handleFilterChange("pageStatus", value)}
              allowClear
              style={{ width: "100%" }}
            >
              <Option value={PageStatus.NORMAL}>正常</Option>
              <Option value={PageStatus.ABNORMAL}>异常</Option>
              <Option value={PageStatus.UNKNOWN}>未知</Option>
              <Option value={PageStatus.QUEUED}>队列中</Option>
              <Option value={PageStatus.CHECKING}>检测中</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="目标分组"
              value={filters.groupId}
              onChange={(value) => handleFilterChange("groupId", value)}
              allowClear
              style={{ width: "100%" }}
            >
              {groups.map((group) => (
                <Option key={group.id} value={group.id}>
                  <Tag color={group.color} style={{ margin: 0 }}>
                    {group.name}
                  </Tag>
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              placeholder={["开始时间", "结束时间"]}
              value={filters.dateRange}
              onChange={(dates) => handleFilterChange("dateRange", dates)}
              style={{ width: "100%" }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space>
              <Button icon={<FilterOutlined />} onClick={clearFilters}>
                清空筛选
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 统计卡片 */}
      <Card className="mb-6">
        <Row gutter={16} className="mb-6">
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="总任务数"
              value={localStats.total}
              prefix={<UnorderedListOutlined />}
              valueStyle={{ color: "#8c8c8c" }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="等待中"
              value={localStats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="执行中"
              value={localStats.running}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="已完成"
              value={localStats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Col>
        </Row>
      </Card>

      {/* 任务列表 */}
      <Card>
        <Table
          dataSource={filteredTasks}
          columns={columns}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
          scroll={{ x: 1500 }}
        />
      </Card>

      {/* 新建任务弹窗 */}
      <Modal
        title="新建监控任务"
        open={createModalVisible}
        onOk={handleCreateModalOk}
        onCancel={handleCreateModalCancel}
        confirmLoading={creatingTasks}
        okText="创建任务"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="groupId"
            label="选择分组"
            rules={[{ required: true, message: "请选择一个分组" }]}
            extra="将为该分组下的所有监控目标创建监控任务，任务将按队列顺序执行"
          >
            <Select
              placeholder="请选择要创建任务的分组"
              allowClear
              loading={loadingGroups}
              notFoundContent={
                loadingGroups ? (
                  <Spin size="small" />
                ) : groupsWithCounts.length === 0 ? (
                  "暂无可用分组"
                ) : null
              }
            >
              {groupsWithCounts.map((group) => (
                <Option key={group.id} value={group.id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Space>
                      <Tag color={group.color}>
                        <AppstoreOutlined /> {group.name}
                      </Tag>
                      {group.description && (
                        <span style={{ color: "#666", fontSize: 12 }}>
                          {group.description}
                        </span>
                      )}
                    </Space>
                    <Tag color="blue" style={{ margin: 0 }}>
                      {group.targetCount} 个目标
                    </Tag>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          {groupsWithCounts.length === 0 && !loadingGroups && (
            <div
              style={{
                textAlign: "center",
                padding: "20px",
                background: "#fafafa",
                borderRadius: "6px",
                color: "#666",
              }}
            >
              <AppstoreOutlined
                style={{ fontSize: "24px", marginBottom: "8px" }}
              />
              <div>暂无包含监控目标的分组</div>
              <div style={{ fontSize: "12px", marginTop: "4px" }}>
                请先在"监控目标"页面添加一些监控目标
              </div>
            </div>
          )}
        </Form>
      </Modal>

      {/* 帮助信息 */}
      <Card className="mt-6">
        <div className="flex items-center gap-4">
          <InfoCircleOutlined className="text-blue-500" />
          <div>
            <Text strong>任务状态说明：</Text>
            <div className="mt-2">
              <Space wrap>
                <Tag color="blue">等待中</Tag>
                <span className="text-gray-600 text-xs">
                  任务已创建，等待执行
                </span>
                <Tag color="orange">执行中</Tag>
                <span className="text-gray-600 text-xs">任务正在执行监控</span>
                <Tag color="green">成功</Tag>
                <span className="text-gray-600 text-xs">任务执行完成</span>
                <Tag color="red">失败</Tag>
                <span className="text-gray-600 text-xs">任务执行失败</span>
              </Space>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <div className="text-2xl mb-2">📊</div>
          <div className="text-xs mt-1">
            点击任务ID可复制完整ID，点击错误信息可查看详细错误内容
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Tasks;
