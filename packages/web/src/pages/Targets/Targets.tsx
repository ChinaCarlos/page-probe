import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Card,
  Typography,
  Tag as AntTag,
  Radio,
  Tooltip,
  Upload,
  Alert,
  Divider,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  MonitorOutlined,
  EyeOutlined,
  UploadOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { MonitorTarget, Tag as TagType } from "../../types";
import { TargetGroup } from "../../types/api";
import { ImportData, ImportResult } from "../../types/import";
import { PageStatus } from "../../constants";
import { PageStatusTag } from "../../components/PageStatusTag";

const { Title } = Typography;
const { Option } = Select;

const Targets: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [targets, setTargets] = useState<MonitorTarget[]>([]);
  const [filteredTargets, setFilteredTargets] = useState<MonitorTarget[]>([]);
  const [groups, setGroups] = useState<TargetGroup[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [batchImportVisible, setBatchImportVisible] = useState(false);
  const [editingTarget, setEditingTarget] = useState<MonitorTarget | null>(
    null
  );
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();

  // 从URL参数初始化筛选状态
  const initFiltersFromURL = () => {
    return {
      search: searchParams.get("search") || "",
      groupId: searchParams.get("groupId") || undefined,
      tagId: searchParams.get("tagId") || undefined,
      pageStatus: searchParams.get("pageStatus") || undefined,
    };
  };

  // 筛选状态
  const [filters, setFilters] = useState<{
    search: string;
    groupId?: string;
    tagId?: string;
    pageStatus?: string;
  }>(initFiltersFromURL());

  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const [targetsRes, groupsRes, tagsRes] = await Promise.all([
        fetch("/api/targets"),
        fetch("/api/groups"),
        fetch("/api/tags"),
      ]);

      const [targetsResult, groupsResult, tagsResult] = await Promise.all([
        targetsRes.json(),
        groupsRes.json(),
        tagsRes.json(),
      ]);

      if (targetsResult.success) {
        setTargets(targetsResult.data);
      }
      if (groupsResult.data) {
        setGroups(groupsResult.data);
      }
      if (tagsResult.success) {
        setTags(tagsResult.data);
      }
    } catch (error) {
      console.error("加载数据失败:", error);
      message.error("加载数据失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 应用筛选
  useEffect(() => {
    let filtered = [...targets];

    // 搜索筛选
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (target) =>
          target.name.toLowerCase().includes(searchTerm) ||
          target.url.toLowerCase().includes(searchTerm)
      );
    }

    // 分组筛选
    if (filters.groupId) {
      filtered = filtered.filter(
        (target) => target.groupId === filters.groupId
      );
    }

    // 标签筛选
    if (filters.tagId) {
      filtered = filtered.filter((target) =>
        target.tagIds?.includes(filters.tagId!)
      );
    }

    // 页面状态筛选（排除"未知"状态）
    if (filters.pageStatus) {
      filtered = filtered.filter((target) => {
        // 只显示正常和异常状态，排除未知状态
        if (filters.pageStatus === PageStatus.NORMAL) {
          return target.pageStatus === PageStatus.NORMAL;
        }
        if (filters.pageStatus === PageStatus.ABNORMAL) {
          return target.pageStatus === PageStatus.ABNORMAL;
        }
        return false;
      });
    }

    setFilteredTargets(filtered);
  }, [targets, filters]);

  // 更新分页总数
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      total: filteredTargets.length,
    }));
  }, [filteredTargets]);

  // 更新URL参数
  const updateURLParams = (newFilters: any) => {
    const params = new URLSearchParams();

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && value !== null) {
        params.set(key, String(value));
      }
    });

    setSearchParams(params);
  };

  // 处理筛选变化
  const handleFilterChange = (key: string, value: any) => {
    const newFilters = {
      ...filters,
      [key]: value,
    };
    setFilters(newFilters);
    updateURLParams(newFilters);
  };

  // 清空筛选
  const clearFilters = () => {
    const emptyFilters = {
      search: "",
      groupId: undefined,
      tagId: undefined,
      pageStatus: undefined,
    };
    setFilters(emptyFilters);
    updateURLParams(emptyFilters);
    // 重置分页到第一页
    setPagination((prev) => ({
      ...prev,
      current: 1,
    }));
  };

  // 处理分页变化
  const handleTableChange = (paginationConfig: any) => {
    setPagination({
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
      total: filteredTargets.length,
    });
  };

  // 处理添加目标
  const handleAdd = () => {
    setEditingTarget(null);
    form.resetFields();
    form.setFieldsValue({
      deviceType: "desktop",
      groupId: groups.length > 0 ? groups[0].id : undefined,
    });
    setModalVisible(true);
  };

  // 处理编辑目标
  const handleEdit = (target: MonitorTarget) => {
    setEditingTarget(target);
    form.setFieldsValue({
      name: target.name,
      url: target.url,
      deviceType: target.deviceType,
      groupId: target.groupId,
      tagIds: target.tagIds || [],
    });
    setModalVisible(true);
  };

  // 处理删除目标
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/targets/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        message.success("目标删除成功");
        loadData();
      } else {
        message.error(result.error || "删除失败");
      }
    } catch (error) {
      console.error("删除目标失败:", error);
      message.error("删除目标失败");
    }
  };

  // 处理监控
  const handleMonitor = async (targetId: string) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetId }),
      });
      const result = await response.json();
      if (result.success) {
        message.success("监控任务已启动");
      } else {
        message.error(result.error || "启动监控失败");
      }
    } catch (error) {
      console.error("启动监控失败:", error);
      message.error("启动监控失败");
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("请选择要删除的目标");
      return;
    }

    try {
      const response = await fetch("/api/targets/batch", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetIds: selectedRowKeys }),
      });
      const result = await response.json();
      if (result.message) {
        message.success(result.message);
        setSelectedRowKeys([]);
        loadData();
      } else {
        message.error("批量删除失败");
      }
    } catch (error) {
      console.error("批量删除失败:", error);
      message.error("批量删除失败");
    }
  };

  // 批量监控
  const handleBatchMonitor = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("请选择要监控的目标");
      return;
    }

    try {
      const response = await fetch("/api/tasks/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetIds: selectedRowKeys }),
      });
      const result = await response.json();
      if (result.data) {
        message.success(`批量监控任务已启动: ${result.data.length} 个任务`);
        setSelectedRowKeys([]);
      } else {
        message.error(result.error || "批量监控失败");
      }
    } catch (error) {
      console.error("批量监控失败:", error);
      message.error("批量监控失败");
    }
  };

  // 处理批量导入
  const handleBatchImport = () => {
    setBatchImportVisible(true);
    batchForm.resetFields();
  };

  // 导出JSON文件
  const downloadJSON = (data: any, filename: string) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 批量导出选中目标
  const handleBatchExport = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("请选择要导出的目标");
      return;
    }

    const selectedTargets = targets.filter((target) =>
      selectedRowKeys.includes(target.id)
    );

    const exportData = {
      targets: selectedTargets.map((target) => ({
        name: target.name,
        url: target.url,
        deviceType: target.deviceType,
      })),
    };

    const timestamp = new Date().toISOString().split("T")[0];
    downloadJSON(exportData, `monitoring-targets-selected-${timestamp}.json`);
    message.success(`已导出 ${selectedTargets.length} 个监控目标`);
  };

  // 导出全部目标（根据当前筛选条件）
  const handleExportAll = () => {
    const dataToExport = filteredTargets.length > 0 ? filteredTargets : targets;

    if (dataToExport.length === 0) {
      message.warning("没有可导出的目标");
      return;
    }

    const exportData = {
      targets: dataToExport.map((target) => ({
        name: target.name,
        url: target.url,
        deviceType: target.deviceType,
      })),
    };

    const timestamp = new Date().toISOString().split("T")[0];

    // 判断是否有筛选条件
    const hasFilters = Object.values(filters).some(
      (value) => value !== undefined && value !== "" && value !== null
    );

    const fileName = hasFilters
      ? `monitoring-targets-filtered-${timestamp}.json`
      : `monitoring-targets-all-${timestamp}.json`;

    downloadJSON(exportData, fileName);

    if (hasFilters) {
      message.success(`已导出 ${dataToExport.length} 个符合筛选条件的监控目标`);
    } else {
      message.success(`已导出 ${dataToExport.length} 个监控目标`);
    }
  };

  // 处理文件上传
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importData: ImportData = JSON.parse(content);

        // 验证数据结构
        if (!importData.targets || !Array.isArray(importData.targets)) {
          message.error("JSON文件格式错误：缺少targets数组");
          return;
        }

        // 验证每个目标的必填字段
        const invalidTargets = importData.targets.filter(
          (target) => !target.name || !target.url
        );

        if (invalidTargets.length > 0) {
          message.error(
            `发现 ${invalidTargets.length} 个目标缺少必填字段（name或url）`
          );
          return;
        }

        // 清理数据中的分组ID和标签ID（现在由用户在界面上选择）
        importData.targets.forEach((target) => {
          // 移除分组ID和标签ID，这些将由用户在界面上选择
          delete target.groupId;
          delete target.tagIds;
        });

        // 设置到表单中（用于预览）
        batchForm.setFieldsValue({
          importData: JSON.stringify(importData, null, 2),
        });

        message.success(
          `成功解析JSON文件，共 ${importData.targets.length} 个监控目标`
        );
      } catch (error) {
        message.error("JSON文件格式错误，请检查文件内容");
      }
    };
    reader.readAsText(file);
    return false; // 阻止自动上传
  };

  // 批量导入提交
  const handleBatchImportSubmit = async (values: any) => {
    try {
      const importData: ImportData = JSON.parse(values.importData);

      // 组合用户选择的分组和标签
      const batchImportData = {
        targets: importData.targets,
        batchGroupId: values.groupId, // 用户选择的分组ID
        batchTagIds: values.tagIds || [], // 用户选择的标签ID数组
      };

      setLoading(true);
      const response = await fetch("/api/targets/batch-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batchImportData),
      });

      const result = await response.json();

      if (result.success) {
        const importResult: ImportResult = result.data;

        if (importResult.failed > 0) {
          Modal.info({
            title: "导入完成",
            width: 600,
            content: (
              <div>
                <p>成功导入: {importResult.success} 个</p>
                <p>失败: {importResult.failed} 个</p>
                {importResult.errors.length > 0 && (
                  <div>
                    <p>错误详情:</p>
                    <ul style={{ maxHeight: 200, overflow: "auto" }}>
                      {importResult.errors.map((error, index) => (
                        <li key={index} style={{ color: "red" }}>
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ),
          });
        } else {
          message.success(`批量导入成功: ${importResult.success} 个目标`);
        }

        setBatchImportVisible(false);
        loadData();
      } else {
        message.error(result.error || "批量导入失败");
      }
    } catch (error) {
      console.error("批量导入失败:", error);
      message.error("批量导入失败");
    } finally {
      setLoading(false);
    }
  };

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      const url = editingTarget
        ? `/api/targets/${editingTarget.id}`
        : "/api/targets";
      const method = editingTarget ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          url: values.url,
          deviceType: values.deviceType,
          groupId: values.groupId,
          tagIds: values.tagIds || [],
        }),
      });

      const result = await response.json();
      if (result.success) {
        message.success(editingTarget ? "目标更新成功" : "目标创建成功");
        setModalVisible(false);
        loadData();
      } else {
        message.error(result.error || "操作失败");
      }
    } catch (error) {
      console.error("操作失败:", error);
      message.error("操作失败");
    }
  };

  const columns = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      width: 150,
      render: (name: string, record: MonitorTarget) => (
        <Button
          type="link"
          className="p-0 h-auto text-left"
          onClick={() => navigate(`/targets/${record.id}`)}
        >
          {name}
        </Button>
      ),
    },
    {
      title: "URL",
      dataIndex: "url",
      key: "url",
      width: 300,
      render: (url: string) => (
        <Tooltip title={url}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 block truncate"
            style={{ maxWidth: "280px" }}
          >
            {url}
          </a>
        </Tooltip>
      ),
    },
    {
      title: "设备类型",
      dataIndex: "deviceType",
      key: "deviceType",
      width: 100,
      render: (deviceType: string) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            deviceType === "mobile"
              ? "bg-green-100 text-green-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {deviceType === "mobile" ? "移动端" : "桌面端"}
        </span>
      ),
    },
    {
      title: "分组",
      dataIndex: "groupName",
      key: "groupName",
      width: 120,
      render: (groupName: string) => (
        <span className="text-gray-600">{groupName || "-"}</span>
      ),
    },
    {
      title: "标签",
      dataIndex: "tags",
      key: "tags",
      width: 200,
      render: (tags: TagType[]) => (
        <div className="flex flex-wrap gap-1">
          {tags?.map((tag) => (
            <AntTag key={tag.id} color={tag.color} className="text-xs">
              {tag.name}
            </AntTag>
          )) || "-"}
        </div>
      ),
    },
    {
      title: "状态",
      dataIndex: "pageStatus",
      key: "pageStatus",
      width: 100,
      render: (pageStatus: string, record: MonitorTarget) => {
        // 如果状态是未知，显示为"待检测"
        const displayStatus =
          pageStatus === PageStatus.UNKNOWN ? PageStatus.CHECKING : pageStatus;
        return (
          <PageStatusTag
            status={displayStatus}
            reason={record.pageStatusReason}
          />
        );
      },
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (timestamp: number) => new Date(timestamp).toLocaleString(),
    },
    {
      title: "操作",
      key: "actions",
      width: 320,
      fixed: "right" as const,
      render: (_: any, record: MonitorTarget) => (
        <div className="flex gap-1">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/targets/${record.id}`)}
          >
            查看
          </Button>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="text"
            size="small"
            icon={<PlayCircleOutlined />}
            className="text-green-600"
            onClick={() => handleMonitor(record.id)}
          >
            监控
          </Button>
          <Popconfirm
            title="确定要删除这个监控目标吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" size="small" icon={<DeleteOutlined />} danger>
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <div className="mb-5">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <MonitorOutlined className="text-blue-500" />
              <Title level={4} className="m-0">
                监控目标
              </Title>
            </div>
            <div className="flex gap-2">
              <Button icon={<UploadOutlined />} onClick={handleBatchImport}>
                批量导入
              </Button>
              <Button icon={<DownloadOutlined />} onClick={handleExportAll}>
                导出全部
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                添加目标
              </Button>
            </div>
          </div>
          {selectedRowKeys.length > 0 && (
            <div className="flex gap-2 justify-end">
              <Button
                icon={<PlayCircleOutlined />}
                onClick={handleBatchMonitor}
                className="text-green-600"
              >
                批量监控 ({selectedRowKeys.length})
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleBatchExport}
                className="text-blue-600"
              >
                导出选中 ({selectedRowKeys.length})
              </Button>
              <Popconfirm
                title="确定要删除选中的监控目标吗？"
                onConfirm={handleBatchDelete}
                okText="确定"
                cancelText="取消"
              >
                <Button icon={<DeleteOutlined />} danger>
                  批量删除 ({selectedRowKeys.length})
                </Button>
              </Popconfirm>
            </div>
          )}
        </div>

        {/* 筛选器 */}
        <Card className="mb-5" size="small">
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
                placeholder="请选择分组"
                value={filters.groupId}
                onChange={(value) => handleFilterChange("groupId", value)}
                allowClear
                style={{ width: "100%" }}
              >
                {groups.map((group) => (
                  <Option key={group.id} value={group.id}>
                    <AntTag color={group.color} style={{ margin: 0 }}>
                      {group.name}
                    </AntTag>
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="请选择标签"
                value={filters.tagId}
                onChange={(value) => handleFilterChange("tagId", value)}
                allowClear
                style={{ width: "100%" }}
              >
                {tags.map((tag) => (
                  <Option key={tag.id} value={tag.id}>
                    <AntTag color={tag.color} style={{ margin: 0 }}>
                      {tag.name}
                    </AntTag>
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="请选择页面状态"
                value={filters.pageStatus}
                onChange={(value) => handleFilterChange("pageStatus", value)}
                allowClear
                style={{ width: "100%" }}
              >
                <Option value={PageStatus.NORMAL}>正常</Option>
                <Option value={PageStatus.ABNORMAL}>异常</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Button icon={<FilterOutlined />} onClick={clearFilters}>
                清空筛选
              </Button>
            </Col>
          </Row>
        </Card>

        <Table
          columns={columns}
          dataSource={filteredTargets}
          rowKey="id"
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: (selectedRowKeys: React.Key[]) => {
              setSelectedRowKeys(selectedRowKeys as string[]);
            },
            preserveSelectedRowKeys: true,
          }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range?.[0]}-${range?.[1]} 条/共 ${total} 条`,
            pageSizeOptions: ["10", "20", "50", "100"],
            onShowSizeChange: (current, size) => {
              setPagination({
                current: 1, // 改变页面大小时重置到第一页
                pageSize: size,
                total: filteredTargets.length,
              });
            },
            onChange: (page, pageSize) => {
              setPagination({
                current: page,
                pageSize: pageSize || pagination.pageSize,
                total: filteredTargets.length,
              });
            },
          }}
          scroll={{ x: 1300 }}
        />
      </Card>

      {/* 添加/编辑目标模态框 */}
      <Modal
        title={editingTarget ? "编辑监控目标" : "添加监控目标"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4"
        >
          <Form.Item
            label="名称"
            name="name"
            rules={[{ required: true, message: "请输入目标名称" }]}
          >
            <Input placeholder="请输入监控目标名称" />
          </Form.Item>

          <Form.Item
            label="URL"
            name="url"
            rules={[
              { required: true, message: "请输入目标URL" },
              { type: "url", message: "请输入有效的URL" },
            ]}
          >
            <Input placeholder="https://example.com" />
          </Form.Item>

          <Form.Item
            label="设备类型"
            name="deviceType"
            rules={[{ required: true, message: "请选择设备类型" }]}
          >
            <Radio.Group>
              <Radio value="desktop">桌面端</Radio>
              <Radio value="mobile">移动端</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="分组"
            name="groupId"
            rules={[{ required: true, message: "请选择分组" }]}
          >
            <Select placeholder="请选择分组">
              {groups.map((group) => (
                <Option key={group.id} value={group.id}>
                  {group.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="标签" name="tagIds">
            <Select mode="multiple" placeholder="请选择标签（可选）" allowClear>
              {tags.map((tag) => (
                <Option key={tag.id} value={tag.id}>
                  <AntTag color={tag.color} className="text-xs">
                    {tag.name}
                  </AntTag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setModalVisible(false)}>取消</Button>
            <Button type="primary" htmlType="submit">
              {editingTarget ? "更新" : "创建"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 批量导入模态框 */}
      <Modal
        title="批量导入监控目标"
        open={batchImportVisible}
        onCancel={() => setBatchImportVisible(false)}
        footer={null}
        width={800}
      >
        <Alert
          message="JSON文件格式说明"
          description={
            <div>
              <p>请上传符合以下格式的JSON文件：</p>
              <pre
                style={{
                  background: "#f5f5f5",
                  padding: "12px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  overflow: "auto",
                }}
              >
                {`{
  "targets": [
    {
      "name": "网站名称",
      "url": "https://example.com",
      "deviceType": "desktop"
    }
  ]
}`}
              </pre>
              <div
                style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}
              >
                <p>
                  <strong>字段说明：</strong>
                </p>
                <ul style={{ margin: 0, paddingLeft: "20px" }}>
                  <li>
                    <code>name</code> (必填): 监控目标名称
                  </li>
                  <li>
                    <code>url</code> (必填): 监控目标URL
                  </li>
                  <li>
                    <code>deviceType</code> (可选): 设备类型，"desktop" 或
                    "mobile"，默认为 "desktop"
                  </li>
                </ul>
                <p style={{ marginTop: "8px", color: "#1890ff" }}>
                  <strong>注意：</strong>{" "}
                  分组和标签请在下方选择，无需在JSON文件中设置。
                </p>
              </div>
            </div>
          }
          type="info"
          icon={<InfoCircleOutlined />}
          className="mb-4"
        />

        <Form
          form={batchForm}
          layout="vertical"
          onFinish={handleBatchImportSubmit}
          initialValues={{
            groupId: undefined,
            tagIds: [],
          }}
        >
          {/* 分组和标签选择 */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="选择分组" name="groupId">
                <Select placeholder="请选择分组（可选）" allowClear>
                  {groups.map((group) => (
                    <Option key={group.id} value={group.id}>
                      <AntTag color={group.color} className="text-xs">
                        {group.name}
                      </AntTag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="选择标签" name="tagIds">
                <Select
                  mode="multiple"
                  placeholder="请选择标签（可选）"
                  allowClear
                >
                  {tags.map((tag) => (
                    <Option key={tag.id} value={tag.id}>
                      <AntTag color={tag.color} className="text-xs">
                        {tag.name}
                      </AntTag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Form.Item
            label="上传JSON文件"
            extra="支持拖拽上传，文件大小限制10MB"
          >
            <Upload.Dragger
              accept=".json"
              beforeUpload={handleFileUpload}
              showUploadList={false}
              style={{ marginBottom: "16px" }}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽JSON文件到此区域上传</p>
              <p className="ant-upload-hint">仅支持.json格式文件</p>
            </Upload.Dragger>
          </Form.Item>

          <Divider>或者</Divider>

          <Form.Item
            label="JSON数据预览/编辑"
            name="importData"
            rules={[
              { required: true, message: "请上传JSON文件或手动输入数据" },
            ]}
          >
            <Input.TextArea
              rows={10}
              placeholder="请上传JSON文件，或在此处手动输入JSON数据..."
              style={{ fontFamily: "monospace", fontSize: "12px" }}
            />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setBatchImportVisible(false)}>取消</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              开始导入
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Targets;
