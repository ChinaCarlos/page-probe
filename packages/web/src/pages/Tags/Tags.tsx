import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Space,
  Card,
  Typography,
  ColorPicker,
  Tag as AntTag,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { Tag } from "../../types";

const { Title } = Typography;
const { TextArea } = Input;

const Tags: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [form] = Form.useForm();

  // 加载标签数据
  const loadTags = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/tags");
      const result = await response.json();
      if (result.success) {
        setTags(result.data);
      } else {
        message.error("加载标签失败");
      }
    } catch (error) {
      console.error("加载标签失败:", error);
      message.error("加载标签失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  // 处理添加标签
  const handleAdd = () => {
    setEditingTag(null);
    form.resetFields();
    form.setFieldsValue({
      color: "#1890ff",
    });
    setModalVisible(true);
  };

  // 处理编辑标签
  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    form.setFieldsValue({
      name: tag.name,
      color: tag.color,
      description: tag.description,
    });
    setModalVisible(true);
  };

  // 处理删除标签
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        message.success("标签删除成功");
        loadTags();
      } else {
        message.error(result.error || "删除失败");
      }
    } catch (error) {
      console.error("删除标签失败:", error);
      message.error("删除标签失败");
    }
  };

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      const url = editingTag ? `/api/tags/${editingTag.id}` : "/api/tags";
      const method = editingTag ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          color:
            typeof values.color === "string"
              ? values.color
              : values.color.toHexString(),
          description: values.description,
        }),
      });

      const result = await response.json();
      if (result.success) {
        message.success(editingTag ? "标签更新成功" : "标签创建成功");
        setModalVisible(false);
        loadTags();
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
      title: "标签名称",
      dataIndex: "name",
      key: "name",
      width: 150,
      render: (name: string, record: Tag) => (
        <div className="flex items-center gap-2">
          <AntTag color={record.color}>{name}</AntTag>
        </div>
      ),
    },
    {
      title: "标签ID",
      dataIndex: "id",
      key: "id",
      width: 320,
      render: (id: string) => (
        <code
          className="cursor-pointer text-xs py-1 px-1.5 bg-gray-100 rounded border border-gray-300"
          onClick={() => {
            navigator.clipboard.writeText(id);
            message.success("标签ID已复制到剪贴板");
          }}
          title="点击复制标签ID"
        >
          {id}
        </code>
      ),
    },
    {
      title: "颜色",
      dataIndex: "color",
      key: "color",
      width: 80,
      render: (color: string) => (
        <div
          className="w-6 h-6 rounded border border-gray-300"
          style={{ backgroundColor: color }}
          title={color}
        />
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
      render: (timestamp: number) => new Date(timestamp).toLocaleString(),
    },
    {
      title: "操作",
      key: "actions",
      width: 160,
      fixed: "right" as const,
      render: (_: any, record: Tag) => (
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
            title="确定要删除这个标签吗？"
            description="删除后将从所有监控目标中移除该标签"
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
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <TagOutlined className="text-blue-500" />
            <Title level={4} className="m-0">
              标签管理
            </Title>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加标签
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={tags}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个标签`,
          }}
          scroll={{ x: 1040 }}
        />
      </Card>

      <Modal
        title={editingTag ? "编辑标签" : "添加标签"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4"
        >
          <Form.Item
            label="标签名称"
            name="name"
            rules={[
              { required: true, message: "请输入标签名称" },
              { max: 20, message: "标签名称不能超过20个字符" },
            ]}
          >
            <Input placeholder="请输入标签名称" />
          </Form.Item>

          <Form.Item
            label="标签颜色"
            name="color"
            rules={[{ required: true, message: "请选择标签颜色" }]}
          >
            <ColorPicker showText />
          </Form.Item>

          <Form.Item label="描述" name="description">
            <TextArea
              placeholder="请输入标签描述（可选）"
              rows={3}
              maxLength={100}
            />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setModalVisible(false)}>取消</Button>
            <Button type="primary" htmlType="submit">
              {editingTag ? "更新" : "创建"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Tags;
