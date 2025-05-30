import {
  AppstoreOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import React, { useEffect, useState } from "react";
import { GROUP_CONFIG } from "../../constants";
import { TargetGroup } from "../../types/api";

const { Title } = Typography;

// 颜色名称映射
const COLOR_NAMES: { [key: string]: string } = {
  "#f50": "红色",
  "#2db7f5": "蓝色",
  "#87d068": "绿色",
  "#108ee9": "深蓝",
  "#f56a00": "橙色",
  "#722ed1": "紫色",
  "#13c2c2": "青色",
  "#eb2f96": "粉色",
};

const Groups: React.FC = () => {
  const [groups, setGroups] = useState<TargetGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TargetGroup | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/groups");
      const data = await response.json();
      setGroups(data.data || []);
    } catch (error) {
      console.error("获取分组失败:", error);
      message.error("获取分组失败");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingGroup(null);
    form.resetFields();
    form.setFieldsValue({ color: GROUP_CONFIG.COLORS[0] });
    setModalVisible(true);
  };

  const handleEdit = (group: TargetGroup) => {
    setEditingGroup(group);
    form.setFieldsValue({
      name: group.name,
      color: group.color,
      description: group.description || "",
    });
    setModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const url = editingGroup
        ? `/api/groups/${editingGroup.id}`
        : "/api/groups";
      const method = editingGroup ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          color: values.color,
          description: values.description,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        message.success(editingGroup ? "分组更新成功" : "分组创建成功");
        setModalVisible(false);
        form.resetFields();
        setEditingGroup(null);
        fetchGroups();
      } else {
        message.error(data.error || "操作失败");
      }
    } catch (error) {
      console.error("操作失败:", error);
      message.error("操作失败");
    }
  };

  const handleDelete = async (groupId: string, groupName: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (response.ok) {
        message.success(`分组 "${groupName}" 已删除`);
        fetchGroups();
      } else {
        message.error(data.error || "删除失败");
      }
    } catch (error) {
      console.error("删除失败:", error);
      message.error("删除失败");
    }
  };

  const columns = [
    {
      title: "分组名称",
      dataIndex: "name",
      key: "name",
      width: 150,
      render: (name: string, record: TargetGroup) => (
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: record.color }}
          />
          <span>{name}</span>
        </div>
      ),
    },
    {
      title: "分组ID",
      dataIndex: "id",
      key: "id",
      width: 320,
      render: (id: string) => (
        <code
          className="cursor-pointer text-xs py-1 px-1.5 bg-gray-100 rounded border border-gray-300"
          onClick={() => {
            navigator.clipboard.writeText(id);
            message.success("分组ID已复制到剪贴板");
          }}
          title="点击复制分组ID"
        >
          {id}
        </code>
      ),
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
      width: 200,
      render: (description: string) => (
        <span className="text-gray-600">{description || "-"}</span>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (createdAt: number) => new Date(createdAt).toLocaleString(),
    },
    {
      title: "操作",
      key: "actions",
      width: 160,
      fixed: "right" as const,
      render: (_: any, record: TargetGroup) => (
        <div className="flex gap-1">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除分组 "${record.name}" 吗？`}
            onConfirm={() => handleDelete(record.id, record.name)}
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

  if (loading) {
    return (
      <div className="text-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <TeamOutlined className="text-blue-500" />
            <Title level={4} className="m-0">
              分组管理
            </Title>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建分组
          </Button>
        </div>

        <Table
          dataSource={groups}
          columns={columns}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个分组`,
          }}
          scroll={{ x: 1040 }}
        />
      </Card>

      <Modal
        title={editingGroup ? "编辑分组" : "新建分组"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingGroup(null);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleModalOk}
          className="mt-4"
        >
          <Form.Item
            label="分组名称"
            name="name"
            rules={[
              { required: true, message: "请输入分组名称" },
              { max: 10, message: "分组名称不能超过10个字符" },
            ]}
          >
            <Input placeholder="请输入分组名称" />
          </Form.Item>

          <Form.Item
            label="分组颜色"
            name="color"
            rules={[{ required: true, message: "请选择分组颜色" }]}
          >
            <Select
              placeholder="请选择分组颜色"
              options={GROUP_CONFIG.COLORS.map((color) => ({
                label: (
                  <div className="flex items-center">
                    <span
                      className="inline-block w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: color }}
                    />
                    {COLOR_NAMES[color] || color}
                  </div>
                ),
                value: color,
              }))}
            />
          </Form.Item>

          <Form.Item label="分组描述" name="description">
            <Input.TextArea
              rows={3}
              placeholder="请输入分组描述（可选）"
              maxLength={100}
            />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setModalVisible(false);
                setEditingGroup(null);
                form.resetFields();
              }}
            >
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              {editingGroup ? "更新" : "创建"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Groups;
