import {
  InfoCircleOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import React, { useState, useEffect } from "react";
import { BlankScreenConfig } from "../../types";

const { Title, Text } = Typography;

const Settings: React.FC = () => {
  const [form] = Form.useForm<BlankScreenConfig>();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<BlankScreenConfig | null>(null);
  const [newTextKeyword, setNewTextKeyword] = useState("");
  const [newStatusCode, setNewStatusCode] = useState<number | null>(null);

  // 监听表单值变化，用于条件渲染
  const formValues = Form.useWatch([], form);

  // 获取配置
  const fetchConfig = async () => {
    try {
      const response = await fetch("/api/blank-screen-config");
      const result = await response.json();
      if (result.success) {
        setConfig(result.data);
        form.setFieldsValue(result.data);
      } else {
        message.error("获取配置失败");
      }
    } catch (error) {
      console.error("获取配置失败:", error);
      message.error("获取配置失败");
    }
  };

  // 保存配置
  const handleSave = async (values: BlankScreenConfig) => {
    setLoading(true);
    try {
      const response = await fetch("/api/blank-screen-config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...config,
          ...values,
        }),
      });

      const result = await response.json();
      if (result.success) {
        message.success("配置保存成功");
        await fetchConfig(); // 重新获取配置
      } else {
        message.error(result.error || "保存配置失败");
      }
    } catch (error) {
      console.error("保存配置失败:", error);
      message.error("保存配置失败");
    } finally {
      setLoading(false);
    }
  };

  // 添加错误文案关键词
  const handleAddTextKeyword = () => {
    if (!newTextKeyword.trim()) return;

    const currentKeywords = form.getFieldValue("errorTextKeywords") || [];
    if (currentKeywords.includes(newTextKeyword.trim())) {
      message.warning("该关键词已存在");
      return;
    }

    const updatedKeywords = [...currentKeywords, newTextKeyword.trim()];
    form.setFieldValue("errorTextKeywords", updatedKeywords);
    setNewTextKeyword("");
    message.success("关键词添加成功");
  };

  // 删除错误文案关键词
  const handleRemoveTextKeyword = (keyword: string) => {
    const currentKeywords = form.getFieldValue("errorTextKeywords") || [];
    const updatedKeywords = currentKeywords.filter(
      (k: string) => k !== keyword
    );
    form.setFieldValue("errorTextKeywords", updatedKeywords);
    message.success("关键词删除成功");
  };

  // 添加错误状态码
  const handleAddStatusCode = () => {
    if (!newStatusCode || newStatusCode < 100 || newStatusCode > 999) {
      message.warning("请输入有效的HTTP状态码(100-999)");
      return;
    }

    const currentCodes = form.getFieldValue("errorStatusCodes") || [];
    if (currentCodes.includes(newStatusCode)) {
      message.warning("该状态码已存在");
      return;
    }

    const updatedCodes = [...currentCodes, newStatusCode];
    form.setFieldValue("errorStatusCodes", updatedCodes);
    setNewStatusCode(null);
    message.success("状态码添加成功");
  };

  // 删除错误状态码
  const handleRemoveStatusCode = (code: number) => {
    const currentCodes = form.getFieldValue("errorStatusCodes") || [];
    const updatedCodes = currentCodes.filter((c: number) => c !== code);
    form.setFieldValue("errorStatusCodes", updatedCodes);
    message.success("状态码删除成功");
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <div className="p-5 max-w-4xl">
      <div className="flex justify-between items-center mb-5">
        <Title level={2} className="m-0 flex items-center gap-2">
          <QuestionCircleOutlined /> 系统设置
        </Title>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={() => form.submit()}
          loading={loading}
        >
          保存配置
        </Button>
      </div>

      <Card className="mt-5">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            enableDOMStructureCheck: true,
            enableContentCheck: true,
            enableTextMatchCheck: true,
            enableHTTPStatusCheck: true,
            enableTimeoutCheck: true,
            enableAICheck: false,
            enablePixelCheck: false,
            domElementThreshold: 3,
            heightRatioThreshold: 0.15,
            textLengthThreshold: 10,
            domLoadTimeout: 8000,
            pageLoadTimeout: 10000,
            aiConfidenceThreshold: 0.8,
            aiModelVersion: "v1.0",
            pixelSimilarityThreshold: 0.85,
            pixelColorThreshold: 30,
            pixelWhiteRatio: 0.9,
            errorTextKeywords: [],
            errorStatusCodes: [],
          }}
        >
          <Title level={4}>白屏检测配置</Title>
          <Text type="secondary">
            配置白屏异常检测规则和参数阈值。系统提供6种检测类型，您可以根据具体业务需求调整检测策略。
          </Text>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                name="enableDOMStructureCheck"
                valuePropName="checked"
                label={
                  <span>
                    DOM结构检测
                    <Tooltip title="检测页面DOM元素数量和页面高度，判断页面是否正常渲染">
                      <QuestionCircleOutlined className="ml-2 text-gray-400" />
                    </Tooltip>
                  </span>
                }
              >
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>
              <Text type="secondary" className="text-xs block mb-4">
                检测页面中可见DOM元素数量和页面高度比例
              </Text>
            </Col>

            <Col span={12}>
              <Form.Item
                name="enableContentCheck"
                valuePropName="checked"
                label={
                  <span>
                    页面内容检测
                    <Tooltip title="检测页面文本、图片、背景等有效内容">
                      <QuestionCircleOutlined className="ml-2 text-gray-400" />
                    </Tooltip>
                  </span>
                }
              >
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>
              <Text type="secondary" className="text-xs block mb-4">
                检测页面是否有有效的文本、图片、背景等内容
              </Text>
            </Col>

            <Col span={12}>
              <Form.Item
                name="enableTextMatchCheck"
                valuePropName="checked"
                label={
                  <span>
                    文案匹配检测
                    <Tooltip title="检测页面是否包含错误文案（如404、服务器错误等）">
                      <QuestionCircleOutlined className="ml-2 text-gray-400" />
                    </Tooltip>
                  </span>
                }
              >
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>
              <Text type="secondary" className="text-xs block mb-4">
                检测页面是否包含错误文案（404、Not Found等）
              </Text>
            </Col>

            <Col span={12}>
              <Form.Item
                name="enableHTTPStatusCheck"
                valuePropName="checked"
                label={
                  <span>
                    HTTP状态检测
                    <Tooltip title="检测HTTP响应状态码，判断页面是否正常加载">
                      <QuestionCircleOutlined className="ml-2 text-gray-400" />
                    </Tooltip>
                  </span>
                }
              >
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>
              <Text type="secondary" className="text-xs block mb-4">
                检测HTTP响应状态码是否为错误状态
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
                      parser={(value) => Number.parseFloat(value || "0") / 100}
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
                  当页面文本内容少于此字符数时判断为无有效内容
                </Text>
              </Col>
            )}

            {/* 加载超时检测参数 - 只有当超时检测开启时才显示 */}
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

            {/* AI检测参数 - 预留功能，暂时禁用 */}
            {formValues?.enableAICheck && (
              <>
                <Col span={12}>
                  <Form.Item
                    name="aiConfidenceThreshold"
                    label={
                      <span>
                        AI置信度阈值
                        <Tag color="orange" className="ml-2">
                          预留
                        </Tag>
                      </span>
                    }
                    rules={[{ required: true, message: "请输入AI置信度阈值" }]}
                  >
                    <InputNumber
                      min={0.1}
                      max={1}
                      step={0.1}
                      className="w-full"
                      disabled={true}
                      formatter={(value) =>
                        `${((value || 0) * 100).toFixed(0)}%`
                      }
                      parser={(value) =>
                        Number.parseFloat(value?.replace("%", "") || "0") / 100
                      }
                    />
                  </Form.Item>
                  <Text type="secondary" className="text-xs block mb-4">
                    AI模型检测异常的置信度阈值，超过此值判断为异常
                  </Text>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="aiModelVersion"
                    label={
                      <span>
                        AI模型版本
                        <Tag color="orange" className="ml-2">
                          预留
                        </Tag>
                      </span>
                    }
                    rules={[{ required: true, message: "请选择AI模型版本" }]}
                  >
                    <Input
                      className="w-full"
                      disabled={true}
                      placeholder="v1.0"
                    />
                  </Form.Item>
                  <Text type="secondary" className="text-xs block mb-4">
                    使用的AI模型版本，不同版本检测精度和性能可能不同
                  </Text>
                </Col>
              </>
            )}

            {/* 像素算法检测参数 - 预留功能，暂时禁用 */}
            {formValues?.enablePixelCheck && (
              <>
                <Col span={12}>
                  <Form.Item
                    name="pixelSimilarityThreshold"
                    label={
                      <span>
                        像素相似度阈值
                        <Tag color="purple" className="ml-2">
                          预留
                        </Tag>
                      </span>
                    }
                    rules={[
                      { required: true, message: "请输入像素相似度阈值" },
                    ]}
                  >
                    <InputNumber
                      min={0.1}
                      max={1}
                      step={0.05}
                      className="w-full"
                      disabled={true}
                      formatter={(value) =>
                        `${((value || 0) * 100).toFixed(0)}%`
                      }
                      parser={(value) =>
                        Number.parseFloat(value?.replace("%", "") || "0") / 100
                      }
                    />
                  </Form.Item>
                  <Text type="secondary" className="text-xs block mb-4">
                    页面像素相似度低于此阈值时判断为异常
                  </Text>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="pixelColorThreshold"
                    label={
                      <span>
                        颜色差异阈值
                        <Tag color="purple" className="ml-2">
                          预留
                        </Tag>
                      </span>
                    }
                    rules={[{ required: true, message: "请输入颜色差异阈值" }]}
                  >
                    <InputNumber
                      min={1}
                      max={255}
                      className="w-full"
                      disabled={true}
                      addonAfter="RGB值"
                    />
                  </Form.Item>
                  <Text type="secondary" className="text-xs block mb-4">
                    RGB颜色差异超过此值时判断为颜色异常
                  </Text>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="pixelWhiteRatio"
                    label={
                      <span>
                        白色像素比例阈值
                        <Tag color="purple" className="ml-2">
                          预留
                        </Tag>
                      </span>
                    }
                    rules={[
                      { required: true, message: "请输入白色像素比例阈值" },
                    ]}
                  >
                    <InputNumber
                      min={0.5}
                      max={1}
                      step={0.05}
                      className="w-full"
                      disabled={true}
                      formatter={(value) =>
                        `${((value || 0) * 100).toFixed(0)}%`
                      }
                      parser={(value) =>
                        Number.parseFloat(value?.replace("%", "") || "0") / 100
                      }
                    />
                  </Form.Item>
                  <Text type="secondary" className="text-xs block mb-4">
                    白色像素占比超过此值时判断为白屏
                  </Text>
                </Col>
              </>
            )}
          </Row>

          <Divider />

          {/* 错误文案关键词配置 - 只有当文案匹配检测开启时才显示 */}
          {formValues?.enableTextMatchCheck && (
            <>
              <Title level={4}>错误文案关键词</Title>
              <Text type="secondary" className="mb-4 block">
                系统已内置常用错误文案关键词（404、not
                found、页面不存在、服务器错误等）。
                您可以添加额外的关键词来扩展检测范围。
              </Text>
              <Form.Item label="添加错误文案关键词">
                <Space.Compact className="w-full">
                  <Input
                    placeholder="输入错误文案关键词"
                    value={newTextKeyword}
                    onChange={(e) => setNewTextKeyword(e.target.value)}
                    onPressEnter={handleAddTextKeyword}
                  />
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddTextKeyword}
                  >
                    添加
                  </Button>
                </Space.Compact>
              </Form.Item>

              <Form.Item name="errorTextKeywords" label="当前错误文案关键词">
                <div className="min-h-[50px] border border-gray-300 rounded-lg p-2">
                  {form
                    .getFieldValue("errorTextKeywords")
                    ?.map((keyword: string) => (
                      <Tag
                        key={keyword}
                        closable
                        onClose={() => handleRemoveTextKeyword(keyword)}
                        className="m-1"
                        color="orange"
                      >
                        {keyword}
                      </Tag>
                    ))}
                  {(!form.getFieldValue("errorTextKeywords") ||
                    form.getFieldValue("errorTextKeywords").length === 0) && (
                    <Text type="secondary">使用系统内置的错误文案关键词</Text>
                  )}
                </div>
              </Form.Item>

              <Divider />
            </>
          )}

          {/* 错误状态码配置 - 只有当HTTP状态检测开启时才显示 */}
          {formValues?.enableHTTPStatusCheck && (
            <>
              <Title level={4}>错误状态码</Title>
              <Text type="secondary" className="mb-4 block">
                系统已内置常用HTTP错误状态码（400, 401, 403, 404, 500, 502, 503,
                504）。 您可以添加额外的状态码来扩展检测范围。
              </Text>
              <Form.Item label="添加错误状态码">
                <Space.Compact className="w-full">
                  <InputNumber
                    placeholder="输入HTTP状态码(如: 403, 500)"
                    value={newStatusCode}
                    onChange={(value) => setNewStatusCode(value)}
                    onPressEnter={handleAddStatusCode}
                    min={100}
                    max={999}
                    className="flex-1"
                  />
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddStatusCode}
                  >
                    添加
                  </Button>
                </Space.Compact>
              </Form.Item>

              <Form.Item name="errorStatusCodes" label="当前错误状态码">
                <div className="min-h-[50px] border border-gray-300 rounded-lg p-2">
                  {form
                    .getFieldValue("errorStatusCodes")
                    ?.map((code: number) => (
                      <Tag
                        key={code}
                        closable
                        onClose={() => handleRemoveStatusCode(code)}
                        className="m-1"
                        color="red"
                      >
                        {code}
                      </Tag>
                    ))}
                  {(!form.getFieldValue("errorStatusCodes") ||
                    form.getFieldValue("errorStatusCodes").length === 0) && (
                    <Text type="secondary">使用系统内置的错误状态码</Text>
                  )}
                </div>
              </Form.Item>

              <Divider />
            </>
          )}

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
              >
                保存配置
              </Button>
              <Button
                onClick={() => {
                  form.resetFields();
                  fetchConfig();
                }}
                size="large"
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Settings;
