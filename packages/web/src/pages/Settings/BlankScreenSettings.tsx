import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  Switch,
  InputNumber,
  Button,
  message,
  Typography,
  Divider,
  Row,
  Col,
  Tooltip,
  Tag,
  Select,
} from "antd";
import {
  SaveOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { DEFAULT_BLANK_SCREEN_CONFIG } from "../../constants/blankScreen";

const { Title, Text } = Typography;

const BlankScreenSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState<any>(null);

  // 监听表单值变化
  const handleFormChange = () => {
    setFormValues(form.getFieldsValue());
  };

  // 加载配置
  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/blank-screen-config");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        const config = data.data;
        form.setFieldsValue(config);
        setFormValues(config);
      } else {
        message.error("加载配置失败");
        // 使用默认配置
        const defaultConfig = { ...DEFAULT_BLANK_SCREEN_CONFIG };
        form.setFieldsValue(defaultConfig);
        setFormValues(defaultConfig);
      }
    } catch (error) {
      console.error("加载配置失败:", error);
      message.error("加载配置失败，使用默认配置");
      // 使用默认配置
      const defaultConfig = { ...DEFAULT_BLANK_SCREEN_CONFIG };
      form.setFieldsValue(defaultConfig);
      setFormValues(defaultConfig);
    } finally {
      setLoading(false);
    }
  };

  // 保存配置
  const handleSave = async (values: any) => {
    try {
      setLoading(true);
      const response = await fetch("/api/blank-screen-config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      if (data.success) {
        message.success("配置保存成功");
      } else {
        message.error(data.error || "保存配置失败");
      }
    } catch (error) {
      console.error("保存配置失败:", error);
      message.error("保存配置失败");
    } finally {
      setLoading(false);
    }
  };

  // 重置为默认配置
  const handleResetToDefault = () => {
    form.setFieldsValue(DEFAULT_BLANK_SCREEN_CONFIG);
    setFormValues(DEFAULT_BLANK_SCREEN_CONFIG);
    message.success("已重置为默认配置");
  };

  useEffect(() => {
    loadConfig();
  }, []);

  return (
    <div className="p-5 max-w-4xl">
      <div className="flex justify-between items-center mb-5">
        <Title level={2} className="m-0 flex items-center gap-2">
          <QuestionCircleOutlined /> 白屏检测设置
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
          onValuesChange={handleFormChange}
          initialValues={DEFAULT_BLANK_SCREEN_CONFIG}
        >
          <Title level={4}>白屏检测配置</Title>
          <Text type="secondary">
            配置白屏异常检测规则和参数阈值。系统提供7种检测类型，您可以根据具体业务需求调整检测策略。
          </Text>

          <Divider />

          <Title level={4}>检测算法开关</Title>
          <Text type="secondary" className="block mb-4">
            启用或禁用各种检测方法。建议根据监控页面的特点选择合适的检测方式。
          </Text>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                name="enableDOMStructureCheck"
                valuePropName="checked"
                label={
                  <span>
                    DOM结构检测
                    <Tooltip title="检测页面DOM元素数量和高度比例">
                      <QuestionCircleOutlined className="ml-2 text-gray-400" />
                    </Tooltip>
                  </span>
                }
              >
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>
              <Text type="secondary" className="text-xs block mb-4">
                检测页面可见元素数量和高度比例，判断页面是否为空白
              </Text>
            </Col>

            <Col span={12}>
              <Form.Item
                name="enableContentCheck"
                valuePropName="checked"
                label={
                  <span>
                    页面内容检测
                    <Tooltip title="检测页面文本、图片、背景等内容">
                      <QuestionCircleOutlined className="ml-2 text-gray-400" />
                    </Tooltip>
                  </span>
                }
              >
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>
              <Text type="secondary" className="text-xs block mb-4">
                分析页面的文本、图片、背景等内容，检测是否存在有效内容
              </Text>
            </Col>

            <Col span={12}>
              <Form.Item
                name="enableTextMatchCheck"
                valuePropName="checked"
                label={
                  <span>
                    文案匹配检测
                    <Tooltip title="检测页面是否包含错误文案关键词">
                      <QuestionCircleOutlined className="ml-2 text-gray-400" />
                    </Tooltip>
                  </span>
                }
              >
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>
              <Text type="secondary" className="text-xs block mb-4">
                检测页面是否包含404、错误提示等异常文案
              </Text>
            </Col>

            <Col span={12}>
              <Form.Item
                name="enableHTTPStatusCheck"
                valuePropName="checked"
                label={
                  <span>
                    HTTP状态检测
                    <Tooltip title="检测HTTP响应状态码">
                      <QuestionCircleOutlined className="ml-2 text-gray-400" />
                    </Tooltip>
                  </span>
                }
              >
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>
              <Text type="secondary" className="text-xs block mb-4">
                检测HTTP响应状态码，识别4xx、5xx等错误状态
              </Text>
            </Col>

            <Col span={12}>
              <Form.Item
                name="enableTimeoutCheck"
                valuePropName="checked"
                label={
                  <span>
                    加载超时检测
                    <Tooltip title="检测页面加载是否超时">
                      <QuestionCircleOutlined className="ml-2 text-gray-400" />
                    </Tooltip>
                  </span>
                }
              >
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>
              <Text type="secondary" className="text-xs block mb-4">
                检测页面加载是否超时或DOM事件未触发
              </Text>
            </Col>

            <Col span={12}>
              <Form.Item
                name="enableAICheck"
                valuePropName="checked"
                label={
                  <span>
                    AI智能检测
                    <Tooltip title="基于人工智能模型的页面异常检测（预留功能，待开发）">
                      <QuestionCircleOutlined className="ml-2 text-gray-400" />
                    </Tooltip>
                    <Tag color="orange" className="ml-2">
                      预留功能
                    </Tag>
                  </span>
                }
              >
                <Switch
                  checkedChildren="开启"
                  unCheckedChildren="关闭"
                  disabled={true}
                />
              </Form.Item>
              <Text type="secondary" className="text-xs block mb-4">
                使用AI模型智能分析页面截图，检测异常情况（功能开发中）
              </Text>
            </Col>

            <Col span={12}>
              <Form.Item
                name="enablePixelCheck"
                valuePropName="checked"
                label={
                  <span>
                    像素算法检测
                    <Tooltip title="基于像素分析算法的页面异常检测（预留功能，待开发）">
                      <QuestionCircleOutlined className="ml-2 text-gray-400" />
                    </Tooltip>
                    <Tag color="purple" className="ml-2">
                      预留功能
                    </Tag>
                  </span>
                }
              >
                <Switch
                  checkedChildren="开启"
                  unCheckedChildren="关闭"
                  disabled={true}
                />
              </Form.Item>
              <Text type="secondary" className="text-xs block mb-4">
                使用像素分析算法检测页面白屏、颜色异常等情况（功能开发中）
              </Text>
            </Col>
          </Row>

          <Divider />

          <Title level={4}>检测参数配置</Title>
          <Row gutter={[16, 16]}>
            {/* DOM结构检测参数 - 只有当DOM结构检测开启时才显示 */}
            {formValues?.enableDOMStructureCheck && (
              <>
                <Col span={12}>
                  <Form.Item
                    name="domElementThreshold"
                    label="DOM元素数量阈值"
                    rules={[
                      { required: true, message: "请输入DOM元素数量阈值" },
                    ]}
                  >
                    <InputNumber
                      min={1}
                      max={100}
                      className="w-full"
                      addonAfter="个"
                    />
                  </Form.Item>
                  <Text type="secondary" className="text-xs block mb-4">
                    当可见DOM元素少于此数值时判断为异常
                  </Text>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="heightRatioThreshold"
                    label="页面高度比例阈值"
                    rules={[
                      { required: true, message: "请输入页面高度比例阈值" },
                    ]}
                  >
                    <InputNumber
                      min={0.01}
                      max={1}
                      step={0.01}
                      className="w-full"
                      addonAfter="%"
                      formatter={(value) =>
                        `${((value || 0) * 100).toFixed(0)}`
                      }
                      parser={(value) => {
                        const num = Number.parseFloat(value || "0") / 100;
                        return num as any;
                      }}
                    />
                  </Form.Item>
                  <Text type="secondary" className="text-xs block mb-4">
                    当页面高度小于屏幕高度的此比例时判断为异常
                  </Text>
                </Col>
              </>
            )}

            {/* 页面内容检测参数 - 只有当页面内容检测开启时才显示 */}
            {formValues?.enableContentCheck && (
              <Col span={12}>
                <Form.Item
                  name="textLengthThreshold"
                  label="有效文本长度阈值"
                  rules={[
                    { required: true, message: "请输入有效文本长度阈值" },
                  ]}
                >
                  <InputNumber
                    min={1}
                    max={1000}
                    className="w-full"
                    addonAfter="字符"
                  />
                </Form.Item>
                <Text type="secondary" className="text-xs block mb-4">
                  当页面有效文本少于此字符数时判断为异常
                </Text>
              </Col>
            )}

            {/* 超时检测参数 - 只有当超时检测开启时才显示 */}
            {formValues?.enableTimeoutCheck && (
              <>
                <Col span={12}>
                  <Form.Item
                    name="domLoadTimeout"
                    label="DOM加载超时时间"
                    rules={[
                      { required: true, message: "请输入DOM加载超时时间" },
                    ]}
                  >
                    <InputNumber
                      min={1000}
                      max={60000}
                      step={1000}
                      className="w-80"
                      addonAfter="毫秒"
                    />
                  </Form.Item>
                  <Text type="secondary" className="text-xs block mb-4">
                    DOM加载超过此时间判断为超时异常
                  </Text>
                </Col>

                <Col span={24}>
                  <Form.Item
                    name="pageLoadTimeout"
                    label="页面加载超时时间"
                    rules={[
                      { required: true, message: "请输入页面加载超时时间" },
                    ]}
                  >
                    <InputNumber
                      min={1000}
                      max={120000}
                      step={1000}
                      className="w-80"
                      addonAfter="毫秒"
                    />
                  </Form.Item>
                  <Text type="secondary" className="text-xs block mb-4">
                    页面完全加载超过此时间判断为超时异常
                  </Text>
                </Col>
              </>
            )}
          </Row>

          <Divider />

          {/* 错误文案关键词配置 - 只有当文案匹配检测开启时才显示 */}
          {formValues?.enableTextMatchCheck && (
            <>
              <Title level={4}>错误文案关键词配置</Title>
              <Text type="secondary" className="block mb-4">
                配置用于检测异常页面的关键词。系统已预置常见的错误关键词，您可以根据需要添加自定义关键词。
              </Text>

              <Form.Item
                name="errorTextKeywords"
                label="错误文案关键词"
                extra="输入关键词后按回车添加，支持中英文。系统已预置常见的404、服务器错误等关键词。"
              >
                <Select
                  mode="tags"
                  style={{ width: "100%" }}
                  placeholder="输入关键词后按回车添加"
                  tokenSeparators={[","]}
                />
              </Form.Item>
            </>
          )}

          {/* 错误状态码配置 - 只有当HTTP状态检测开启时才显示 */}
          {formValues?.enableHTTPStatusCheck && (
            <>
              <Title level={4}>HTTP错误状态码配置</Title>
              <Text type="secondary" className="block mb-4">
                配置需要检测的HTTP错误状态码。系统已预置标准的4xx、5xx错误状态码。
              </Text>

              <Form.Item
                name="errorStatusCodes"
                label="错误状态码"
                extra="输入状态码后按回车添加，如：404、500等。系统已预置常见的错误状态码。"
              >
                <Select
                  mode="tags"
                  style={{ width: "100%" }}
                  placeholder="输入状态码后按回车添加"
                  tokenSeparators={[","]}
                />
              </Form.Item>
            </>
          )}
        </Form>
      </Card>
    </div>
  );
};

export default BlankScreenSettings;
 