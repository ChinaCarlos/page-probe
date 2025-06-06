import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  InputNumber,
  Button,
  message,
  Typography,
  Divider,
  Row,
  Col,
  Tooltip,
  Space,
} from "antd";
import {
  SaveOutlined,
  SettingOutlined,
  ReloadOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface TaskConfig {
  maxConcurrentTasks: number;
}

const DEFAULT_TASK_CONFIG: TaskConfig = {
  maxConcurrentTasks: 2,
};

const TaskSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 加载配置
  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/task-config");

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          form.setFieldsValue(data.data);
        } else {
          // 使用默认配置
          form.setFieldsValue(DEFAULT_TASK_CONFIG);
        }
      } else {
        // 404或其他错误，使用默认配置
        form.setFieldsValue(DEFAULT_TASK_CONFIG);
      }
    } catch (error) {
      console.error("加载任务配置失败:", error);
      // 使用默认配置
      form.setFieldsValue(DEFAULT_TASK_CONFIG);
    } finally {
      setLoading(false);
    }
  };

  // 保存配置
  const handleSave = async (values: TaskConfig) => {
    try {
      setLoading(true);
      const response = await fetch("/api/task-config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      if (data.success) {
        message.success("任务配置保存成功");
      } else {
        message.error(data.error || "保存任务配置失败");
      }
    } catch (error) {
      console.error("保存任务配置失败:", error);
      message.error("保存任务配置失败");
    } finally {
      setLoading(false);
    }
  };

  // 重置为默认配置
  const handleResetToDefault = () => {
    form.setFieldsValue(DEFAULT_TASK_CONFIG);
    message.success("已重置为默认配置");
  };

  useEffect(() => {
    loadConfig();
  }, []);

  return (
    <div className="p-5 max-w-4xl">
      <div className="flex justify-between items-center mb-5">
        <Title level={2} className="m-0 flex items-center gap-2">
          <SettingOutlined /> 任务设置
        </Title>
        <div className="flex gap-2">
          <Button
            icon={<ReloadOutlined />}
            onClick={handleResetToDefault}
            disabled={loading}
          >
            重置默认
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
            loading={loading}
          >
            保存配置
          </Button>
        </div>
      </div>

      <Card className="mt-5">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={DEFAULT_TASK_CONFIG}
        >
          <Title level={4}>任务执行配置</Title>
          <Text type="secondary">
            配置任务执行的相关参数，包括并发数量、超时时间等。合理的配置有助于提高监控效率和系统稳定性。
          </Text>

          <Divider />

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                name="maxConcurrentTasks"
                label={
                  <Space>
                    <span>最大并行任务数</span>
                    <Tooltip title="同时运行的监控任务最大数量。设置过高可能影响系统性能，设置过低会降低监控效率。建议根据服务器配置调整。">
                      <QuestionCircleOutlined className="text-gray-400" />
                    </Tooltip>
                  </Space>
                }
                rules={[
                  { required: true, message: "请输入最大并行任务数" },
                  {
                    type: "number",
                    min: 1,
                    max: 10,
                    message: "并行任务数应在1-10之间",
                  },
                ]}
                extra="建议设置为2-5之间，默认为2个"
              >
                <InputNumber
                  min={1}
                  max={10}
                  className="w-full"
                  addonAfter="个任务"
                  placeholder="请输入并行任务数"
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Card size="small" className="bg-blue-50 border-blue-200">
                <Title level={5} className="text-blue-700 mb-2">
                  配置建议
                </Title>
                <ul className="text-sm text-blue-600 space-y-1 m-0 pl-4">
                  <li>服务器配置较低：建议设置为 1-2 个</li>
                  <li>服务器配置中等：建议设置为 2-3 个</li>
                  <li>服务器配置较高：建议设置为 3-5 个</li>
                  <li>不建议超过 5 个并行任务</li>
                </ul>
              </Card>
            </Col>
          </Row>

          <Divider />

          <div className="bg-gray-50 p-4 rounded-lg">
            <Title level={5} className="mb-3">
              <QuestionCircleOutlined className="mr-2 text-blue-500" />
              配置说明
            </Title>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <strong>并行任务数：</strong>
                控制系统同时执行的监控任务数量。每个监控任务都会启动一个浏览器实例进行页面加载和检测。
              </p>
              <p>
                <strong>性能影响：</strong>
                并行任务数越多，CPU和内存占用越高，但监控效率也会提升。需要根据服务器配置合理设置。
              </p>
              <p>
                <strong>任务排队：</strong>
                当待执行任务数超过并行数时，多余的任务会进入队列等待，系统会自动调度执行。
              </p>
            </div>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default TaskSettings;
