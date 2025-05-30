# Page Probe - 落地页性能监控系统

<div align="center">

![Page Probe Logo](https://img.shields.io/badge/Page%20Probe-v1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node.js](https://img.shields.io/badge/node.js-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)

**一个基于 React + Koa + Puppeteer 的实时落地页性能监控和异常检测系统**

[在线演示](http://localhost:3000) | [API 文档](http://localhost:3001/api) | [使用指南](#使用指南) | [开发文档](#开发指南)

</div>

## 📋 目录

- [功能特性](#-功能特性)
- [系统架构](#-系统架构)
- [技术栈](#-技术栈)
- [快速开始](#-快速开始)
- [目录结构](#-目录结构)
- [核心功能](#-核心功能)
- [API 接口](#-api-接口)
- [使用指南](#-使用指南)
- [开发指南](#-开发指南)
- [配置说明](#-配置说明)
- [故障排除](#-故障排除)
- [贡献指南](#-贡献指南)
- [许可证](#-许可证)

## 🚀 功能特性

### 🎯 核心监控功能
- **🔍 Web Vitals 性能监控**: 实时监控 LCP、FID、CLS、FCP、TTFB 等核心性能指标
- **📊 性能等级评定**: 基于权重算法的智能性能评分系统 (A/B/C/D/E 五级)
- **📱 多设备支持**: 同时监控桌面端和移动端页面表现
- **📈 性能趋势分析**: 历史数据图表和性能变化趋势
- **⚡ 实时监控**: 支持手动和定时自动监控

### 🛡️ 智能异常检测
- **🔴 白屏检测**: 6种检测算法，全方位识别页面异常
  - DOM 结构检测 (元素数量、页面高度)
  - 页面内容检测 (文本、图片、背景等)
  - 文案匹配检测 (404、错误文案)
  - HTTP 状态检测 (错误状态码)
  - 加载超时检测 (DOM/页面加载时间)
  - AI 智能检测 (预留功能)
  - 像素算法检测 (预留功能)
- **📸 自动截图**: 6个关键时机自动截图保存
  - 首次绘制 (FP)
  - DOM 加载完成 (DOM Content Loaded)  
  - 页面加载完成 (Load)
  - 首次内容绘制 (FCP)
  - 最大内容绘制 (LCP)
  - 可交互时间 (TTI)

### 📋 数据管理
- **🎯 监控目标管理**: 支持目标分组、标签、批量导入
- **📄 任务中心**: 监控任务的创建、执行、状态跟踪
- **📊 数据统计**: 性能指标统计和历史记录查询
- **⚙️ 配置管理**: 灵活的检测参数和阈值配置

### 🎨 用户界面
- **💫 现代化界面**: 基于 Ant Design 的响应式设计
- **📱 移动端适配**: 完全响应式布局，支持移动设备
- **🎭 实时状态**: 页面状态实时更新和条目式异常提示
- **🖼️ 图片预览**: 支持截图放大查看和时机标注

## 🏗️ 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  前端 (React)   │◄──►│  后端 (Koa)     │◄──►│ 浏览器 (Puppeteer)│
│  Port: 3000     │    │  Port: 3001     │    │  监控引擎        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI 组件       │    │   API 路由      │    │   页面分析      │
│   状态管理      │    │   业务逻辑      │    │   截图生成      │
│   数据可视化    │    │   数据存储      │    │   性能采集      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ 技术栈

### 前端技术栈
- **⚛️ React 18** - 现代化 UI 框架
- **📘 TypeScript** - 类型安全开发
- **🎨 Ant Design** - 企业级 UI 组件库
- **🎯 TailwindCSS** - 原子化 CSS 框架
- **⚡ Rsbuild** - 高性能构建工具
- **📊 Recharts** - 数据可视化图表库
- **🖼️ React Photo View** - 图片查看组件
- **🔀 React Router** - 路由管理

### 后端技术栈
- **🚀 Koa 3** - 轻量级 Web 框架
- **📘 TypeScript** - 类型安全开发
- **🤖 Puppeteer** - 无头浏览器自动化
- **🔄 Node-cron** - 定时任务调度
- **📁 FS-Extra** - 文件系统扩展
- **🆔 UUID** - 唯一标识符生成

### 开发工具
- **🎨 Biome** - 代码格式化和 Lint
- **📦 pnpm** - 快速包管理器
- **🏗️ Monorepo** - 多包项目管理
- **🔄 Concurrently** - 并发命令执行

### 数据存储
- **📄 JSON 文件** - 轻量级本地存储
- **🖼️ 文件系统** - 截图和静态资源存储

## 🚀 快速开始

### 📋 环境要求

```bash
Node.js >= 18.0.0
pnpm >= 8.0.0
Chrome/Chromium 浏览器 (Puppeteer 依赖)
```

### 📦 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd page-probe

# 安装所有依赖
pnpm install:all
```

### 🏃‍♂️ 开发环境启动

```bash
# 同时启动前端和后端开发服务器
pnpm dev

# 前端: http://localhost:3000
# 后端: http://localhost:3001
```

### 🚀 生产环境部署

```bash
# 构建项目
pnpm build

# 启动生产服务器
pnpm start
```

### 🧹 数据管理命令

```bash
# 清理所有数据 (交互式)
pnpm clear-data

# 强制清理所有数据
pnpm clear-data:force

# 迁移标签 ID (UUID 格式)
pnpm migrate-tag-ids
```

## 📁 目录结构

```
page-probe/
├── packages/                    # Monorepo 包目录
│   ├── web/                    # 前端 React 应用
│   │   ├── src/
│   │   │   ├── components/     # 可复用组件
│   │   │   │   ├── PageStatusTag/  # 页面状态标签组件
│   │   │   │   └── ...
│   │   │   ├── pages/          # 页面组件
│   │   │   │   ├── Dashboard/  # 仪表板
│   │   │   │   ├── Targets/    # 监控目标管理
│   │   │   │   ├── Tasks/      # 任务中心
│   │   │   │   ├── TargetDetail/ # 目标详情
│   │   │   │   └── Settings/   # 系统设置
│   │   │   ├── constants/      # 常量定义
│   │   │   ├── types/          # TypeScript 类型
│   │   │   └── utils/          # 工具函数
│   │   ├── public/             # 静态资源
│   │   └── package.json
│   ├── server/                 # 后端 Koa 应用
│   │   ├── src/
│   │   │   ├── routes/         # API 路由
│   │   │   │   ├── targets.ts  # 监控目标接口
│   │   │   │   ├── tasks.ts    # 任务管理接口
│   │   │   │   ├── metrics.ts  # 性能数据接口
│   │   │   │   └── settings.ts # 设置接口
│   │   │   ├── services/       # 业务服务
│   │   │   │   ├── monitor.ts  # 监控服务
│   │   │   │   ├── task.ts     # 任务服务
│   │   │   │   └── storage.ts  # 存储服务
│   │   │   ├── models/         # 数据模型
│   │   │   └── constants/      # 常量定义
│   │   ├── data/               # JSON 数据存储
│   │   │   ├── targets.json    # 监控目标
│   │   │   ├── tasks.json      # 监控任务
│   │   │   ├── metrics.json    # 性能数据
│   │   │   ├── groups.json     # 目标分组
│   │   │   ├── tags.json       # 标签数据
│   │   │   └── blank-screen-config.json # 检测配置
│   │   ├── screenshots/        # 截图存储
│   │   └── package.json
│   └── data/                   # 已迁移数据 (废弃)
├── scripts/                    # 工具脚本
│   ├── clear-data.js          # 数据清理脚本
│   ├── clear-data.sh          # Shell 清理脚本
│   └── migrate-tag-ids.js     # 标签 ID 迁移脚本
├── biome.json                 # 代码格式化配置
├── pnpm-workspace.yaml        # pnpm 工作空间配置
├── package.json               # 项目配置
├── .gitignore                # Git 忽略规则
└── README.md                  # 项目文档
```

## 🔧 核心功能

### 🎯 监控目标管理

#### 目标配置
- **基本信息**: 名称、URL、设备类型 (桌面端/移动端)
- **分组管理**: 创建分组，批量管理监控目标
- **标签系统**: 灵活的标签分类和筛选
- **批量导入**: 支持 JSON 格式批量导入目标

#### 批量导入格式
```json
{
  "targets": [
    {
      "name": "网站名称",
      "url": "https://example.com",
      "deviceType": "desktop",
      "groupId": "分组ID",
      "tagIds": ["标签ID1", "标签ID2"]
    }
  ]
}
```

### 📊 性能监控

#### Web Vitals 指标
- **LCP (Largest Contentful Paint)**: 最大内容绘制时间
- **FID (First Input Delay)**: 首次输入延迟  
- **CLS (Cumulative Layout Shift)**: 累积布局偏移
- **FCP (First Contentful Paint)**: 首次内容绘制
- **TTFB (Time to First Byte)**: 首字节时间

#### 性能等级评定
- **评分算法**: 基于权重的综合评分 (LCP:35% + FID:25% + CLS:25% + FCP:10% + TTFB:5%)
- **等级标准**: A级(≥90分) / B级(≥80分) / C级(≥70分) / D级(≥60分) / E级(<60分)
- **动态配置**: 支持自定义阈值和权重配置

### 🛡️ 异常检测

#### 检测算法
1. **DOM 结构检测**: 检查页面元素数量和高度比例
2. **页面内容检测**: 分析文本、图片、背景等内容完整性
3. **文案匹配检测**: 识别 404、错误提示等异常文案
4. **HTTP 状态检测**: 监控响应状态码异常
5. **加载超时检测**: 检测 DOM 和页面加载超时
6. **AI 智能检测**: 基于 AI 模型的异常识别 (预留)
7. **像素算法检测**: 像素级的页面异常分析 (预留)

#### 检测配置
```typescript
interface BlankScreenConfig {
  enableDOMStructureCheck: boolean;     // DOM结构检测
  enableContentCheck: boolean;          // 页面内容检测
  enableTextMatchCheck: boolean;        // 文案匹配检测
  enableHTTPStatusCheck: boolean;       // HTTP状态检测
  enableTimeoutCheck: boolean;          // 加载超时检测
  enableAICheck: boolean;               // AI智能检测
  enablePixelCheck: boolean;            // 像素算法检测
  
  domElementThreshold: number;          // DOM元素数量阈值
  heightRatioThreshold: number;         // 页面高度比例阈值
  textLengthThreshold: number;          // 有效文本长度阈值
  domLoadTimeout: number;               // DOM加载超时时间
  pageLoadTimeout: number;              // 页面加载超时时间
  errorTextKeywords: string[];          // 错误文案关键词
  errorStatusCodes: number[];           // 错误状态码
}
```

### 📸 智能截图

#### 截图时机
- **FP**: 首次绘制时刻
- **DOMCONTENTLOADED**: DOM 内容加载完成
- **LOAD**: 页面完全加载完成
- **FCP**: 首次内容绘制时刻
- **LCP**: 最大内容绘制时刻
- **TTI**: 页面可交互时刻

#### 截图管理
- **自动清理**: 新截图生成时自动清理旧截图
- **命名规范**: `{sessionId}_{stage}_{timestamp}.png`
- **预览功能**: 支持截图放大查看和时机说明

### 📋 任务中心

#### 任务状态
- **PENDING**: 等待执行
- **RUNNING**: 正在执行
- **SUCCESS**: 执行成功
- **FAILED**: 执行失败

#### 页面状态
- **NORMAL**: 页面正常
- **ABNORMAL**: 检测到异常
- **UNKNOWN**: 状态未知
- **CHECKING**: 正在检测
- **QUEUED**: 排队等待

## 🔌 API 接口

### 监控目标管理
```
GET    /api/targets           # 获取所有监控目标
POST   /api/targets           # 创建监控目标
PUT    /api/targets/:id       # 更新监控目标
DELETE /api/targets/:id       # 删除监控目标
DELETE /api/targets/batch     # 批量删除目标
POST   /api/targets/batch-import  # 批量导入目标
```

### 分组和标签管理
```
GET    /api/groups            # 获取所有分组
POST   /api/groups            # 创建分组
PUT    /api/groups/:id        # 更新分组
DELETE /api/groups/:id        # 删除分组

GET    /api/tags              # 获取所有标签
POST   /api/tags              # 创建标签
PUT    /api/tags/:id          # 更新标签
DELETE /api/tags/:id          # 删除标签
```

### 任务管理
```
GET    /api/tasks             # 获取任务列表
POST   /api/tasks             # 创建单个任务
POST   /api/tasks/batch       # 批量创建任务
DELETE /api/tasks/:id         # 删除任务
GET    /api/tasks/stats       # 获取任务统计
```

### 性能数据
```
GET    /api/metrics           # 获取性能指标数据
GET    /api/blank-screens     # 获取白屏检测结果
```

### 系统配置
```
GET    /api/settings/blank-screen-config    # 获取检测配置
PUT    /api/settings/blank-screen-config    # 更新检测配置
```

### 截图资源
```
GET    /api/screenshots/:filename           # 获取截图文件
```

## 📖 使用指南

### 1️⃣ 添加监控目标

#### 单个添加
1. 进入 "监控目标" 页面
2. 点击 "添加目标" 按钮
3. 填写目标信息:
   - 名称: 便于识别的目标名称
   - URL: 完整的目标页面地址
   - 设备类型: 选择桌面端或移动端
   - 分组: 选择或创建目标分组
   - 标签: 添加相关标签 (可选)
4. 点击 "创建" 完成添加

#### 批量导入
1. 准备 JSON 格式的导入文件
2. 点击 "批量导入" 按钮
3. 上传 JSON 文件或手动输入数据
4. 系统验证数据格式和关联 ID
5. 确认导入，查看导入结果

### 2️⃣ 执行监控任务

#### 单个监控
1. 在监控目标列表中找到目标
2. 点击 "监控" 按钮启动即时监控
3. 监控完成后查看结果

#### 批量监控
1. 选择多个监控目标
2. 点击 "批量监控" 按钮
3. 系统自动创建批量任务

#### 分组监控
1. 进入 "任务中心" 页面
2. 点击 "新建任务" 按钮
3. 选择目标分组
4. 系统为该分组下所有目标创建监控任务

### 3️⃣ 查看监控结果

#### 性能数据分析
1. 进入目标详情页面
2. 查看最新性能数据卡片
3. 分析各项 Web Vitals 指标
4. 查看性能等级评定
5. 点击 "查看详细计算过程" 了解评分逻辑

#### 截图查看
1. 在目标详情中查看最新截图
2. 点击截图可放大查看
3. 每张截图下方显示截取时机
4. 支持 6 个关键时机的完整记录

#### 历史记录
1. 查看历史监控任务记录
2. 筛选任务状态和页面状态
3. 查看任务执行时长和错误信息
4. 追踪性能变化趋势

### 4️⃣ 配置异常检测

#### 基本配置
1. 进入 "系统设置" 页面
2. 在 "白屏检测配置" 区域配置:
   - 启用/禁用各类检测算法
   - 调整检测参数阈值
   - 配置错误文案关键词
   - 设置错误状态码

#### 高级配置
- **DOM 结构检测**: 调整元素数量和高度比例阈值
- **页面内容检测**: 设置有效文本长度阈值
- **超时检测**: 配置 DOM 和页面加载超时时间
- **文案匹配**: 添加自定义错误关键词
- **状态码检测**: 自定义错误状态码列表

### 5️⃣ 异常状态查看

#### 状态标识
- 🟢 **正常**: 页面正常加载，无异常检测
- 🔴 **异常**: 检测到白屏或其他页面异常
- ⚪ **未知**: 状态未知或检测未完成
- 🔵 **队列中**: 任务等待执行
- 🟡 **检测中**: 正在执行检测

#### 异常详情
1. 鼠标悬停在 "异常" 标签上
2. 查看条目式的异常详情提示
3. 每条异常原因单独列出，便于快速定位问题

## 🛠️ 开发指南

### 🏃‍♂️ 开发环境搭建

```bash
# 1. 安装依赖
pnpm install:all

# 2. 启动开发服务器
pnpm dev

# 3. 代码格式化
pnpm format

# 4. 代码检查
pnpm lint

# 5. 自动修复
pnpm check:fix
```

### 🔧 添加新的监控指标

#### 1. 后端数据收集
```typescript
// packages/server/src/services/monitor.ts
const metrics = await page.evaluate(() => {
  return new Promise((resolve) => {
    // 添加新的性能指标收集逻辑
    const newMetric = performance.getEntriesByType('measure')[0];
    resolve({
      // ...existing metrics
      newMetric: newMetric?.duration || null
    });
  });
});
```

#### 2. 类型定义更新
```typescript
// packages/web/src/types/index.ts
export interface WebVitalsMetrics {
  // ...existing fields
  newMetric?: number | null;
}
```

#### 3. 前端展示组件
```tsx
// packages/web/src/pages/TargetDetail/TargetDetail.tsx
<Statistic
  title="新指标"
  value={latestMetric.newMetric || "N/A"}
  suffix={latestMetric.newMetric ? "ms" : ""}
/>
```

### 🛡️ 扩展异常检测

#### 1. 添加检测算法
```typescript
// packages/server/src/services/monitor.ts
private async checkCustomDetection(page: Page): Promise<DetectionResult> {
  return await page.evaluate(() => {
    // 实现自定义检测逻辑
    const hasIssue = /* 检测逻辑 */;
    return {
      hasIssue,
      reason: hasIssue ? "检测到自定义异常" : "正常"
    };
  });
}
```

#### 2. 配置接口扩展
```typescript
// packages/server/src/models/index.ts
export interface BlankScreenConfig {
  // ...existing fields
  enableCustomCheck: boolean;
  customThreshold: number;
}
```

#### 3. 前端配置界面
```tsx
// packages/web/src/pages/Settings/Settings.tsx
<Form.Item name="enableCustomCheck" valuePropName="checked">
  <Switch checkedChildren="开启" unCheckedChildren="关闭" />
</Form.Item>
```

### 🎨 自定义组件开发

#### 可复用组件示例
```tsx
// packages/web/src/components/MetricCard/index.tsx
interface MetricCardProps {
  title: string;
  value: number | null;
  unit?: string;
  threshold?: {
    excellent: number;
    good: number;
  };
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit = "ms",
  threshold
}) => {
  const color = getMetricColor(value, threshold);
  
  return (
    <Card>
      <Statistic
        title={title}
        value={value || "N/A"}
        suffix={value ? unit : ""}
        valueStyle={{ color }}
      />
    </Card>
  );
};
```

### 🗄️ 数据存储扩展

#### 数据库支持
```typescript
// packages/server/src/services/database.ts
export class DatabaseService {
  private connection: any;

  async connect() {
    // 连接数据库 (MySQL/PostgreSQL/MongoDB)
  }

  async saveMetrics(metrics: WebVitalsMetrics) {
    // 保存到数据库
  }

  async getMetrics(targetId: string): Promise<WebVitalsMetrics[]> {
    // 从数据库查询
  }
}
```

#### 缓存层添加
```typescript
// packages/server/src/services/cache.ts
export class CacheService {
  private redis: any;

  async set(key: string, value: any, ttl = 3600) {
    // Redis 缓存
  }

  async get(key: string) {
    // 获取缓存
  }
}
```

### 🔔 告警系统扩展

#### 告警规则配置
```typescript
interface AlertRule {
  id: string;
  name: string;
  metric: MetricType;
  condition: 'gt' | 'lt' | 'eq';
  threshold: number;
  enabled: boolean;
  notifications: {
    email?: string[];
    webhook?: string;
    slack?: string;
  };
}
```

#### 通知渠道实现
```typescript
// packages/server/src/services/notification.ts
export class NotificationService {
  async sendEmail(alert: Alert) {
    // 发送邮件通知
  }

  async sendSlack(alert: Alert) {
    // 发送 Slack 通知
  }

  async sendWebhook(alert: Alert) {
    // 发送 Webhook 通知
  }
}
```

## ⚙️ 配置说明

### 🌐 环境变量

```bash
# 服务端口配置
SERVER_PORT=3001
WEB_PORT=3000

# Puppeteer 配置
PUPPETEER_HEADLESS=true
PUPPETEER_TIMEOUT=30000

# 数据存储路径
DATA_DIR=./packages/server/data
SCREENSHOTS_DIR=./packages/server/screenshots

# 日志级别
LOG_LEVEL=info
```

### 📊 性能阈值配置

```typescript
// packages/web/src/constants/metrics.ts
export const METRIC_CONFIG = {
  LCP: {
    thresholds: {
      excellent: 2500,  // 优秀: ≤ 2.5s
      good: 4000,       // 良好: ≤ 4s
      needsImprovement: 6000  // 需改进: ≤ 6s
    },
    weight: 0.35  // 权重: 35%
  },
  FID: {
    thresholds: {
      excellent: 100,   // 优秀: ≤ 100ms
      good: 300,        // 良好: ≤ 300ms
      needsImprovement: 500  // 需改进: ≤ 500ms
    },
    weight: 0.25  // 权重: 25%
  }
  // ... 其他指标配置
};
```

### 🛡️ 检测参数配置

```json
{
  "enableDOMStructureCheck": true,
  "enableContentCheck": true,
  "enableTextMatchCheck": true,
  "enableHTTPStatusCheck": true,
  "enableTimeoutCheck": true,
  "domElementThreshold": 3,
  "heightRatioThreshold": 0.15,
  "textLengthThreshold": 10,
  "domLoadTimeout": 8000,
  "pageLoadTimeout": 10000,
  "errorTextKeywords": [
    "404", "not found", "页面不存在", 
    "服务器错误", "网站维护中"
  ],
  "errorStatusCodes": [400, 401, 403, 404, 500, 502, 503, 504]
}
```

## 🐛 故障排除

### 常见问题

#### 1. Puppeteer 安装失败
```bash
# 问题: Chromium 下载失败
# 解决方案 1: 使用 npm 配置
npm config set puppeteer_download_host=https://npm.taobao.org/mirrors

# 解决方案 2: 使用环境变量
export PUPPETEER_DOWNLOAD_HOST=https://npm.taobao.org/mirrors

# 解决方案 3: 使用 cnpm
cnpm install puppeteer
```

#### 2. 端口冲突
```bash
# 检查端口占用
lsof -i :3000
lsof -i :3001

# 修改端口配置
# packages/web/rsbuild.config.ts - 修改前端端口
# packages/server/src/app.ts - 修改后端端口
```

#### 3. 监控任务失败
```bash
# 检查目标 URL 可访问性
curl -I https://example.com

# 检查 Chrome/Chromium 安装
which google-chrome
which chromium-browser

# 查看后端日志
tail -f packages/server/logs/app.log
```

#### 4. 截图生成失败
```bash
# 检查截图目录权限
ls -la packages/server/screenshots/

# 手动创建截图目录
mkdir -p packages/server/screenshots/

# 检查磁盘空间
df -h
```

#### 5. 数据文件损坏
```bash
# 清理所有数据
pnpm clear-data:force

# 重新启动服务
pnpm dev
```

### 性能优化

#### 前端优化
```typescript
// 使用 React.memo 优化渲染
const MetricCard = React.memo<MetricCardProps>(({ metric }) => {
  return <Card>{/* ... */}</Card>;
});

// 使用 useMemo 缓存计算结果
const performanceScore = useMemo(() => {
  return calculatePerformanceScore(metrics);
}, [metrics]);

// 虚拟滚动处理大量数据
import { FixedSizeList as List } from 'react-window';
```

#### 后端优化
```typescript
// 连接池配置
const pool = {
  max: 10,
  min: 0,
  acquireTimeoutMillis: 30000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  idleTimeoutMillis: 30000
};

// API 缓存
app.use(async (ctx, next) => {
  const cacheKey = `api:${ctx.path}:${JSON.stringify(ctx.query)}`;
  const cached = await cache.get(cacheKey);
  
  if (cached) {
    ctx.body = cached;
    return;
  }
  
  await next();
  await cache.set(cacheKey, ctx.body, 300); // 5分钟缓存
});
```

#### 监控优化
```typescript
// 监控任务队列
class TaskQueue {
  private queue: MonitorTask[] = [];
  private processing = false;
  private concurrency = 3;

  async add(task: MonitorTask) {
    this.queue.push(task);
    this.process();
  }

  private async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.concurrency);
      await Promise.allSettled(
        batch.map(task => this.processTask(task))
      );
    }

    this.processing = false;
  }
}
```

### 日志分析

#### 日志级别
```typescript
// packages/server/src/utils/logger.ts
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export class Logger {
  static error(message: string, meta?: any) {
    console.error(`[ERROR] ${new Date().toISOString()} ${message}`, meta);
  }

  static warn(message: string, meta?: any) {
    console.warn(`[WARN] ${new Date().toISOString()} ${message}`, meta);
  }

  static info(message: string, meta?: any) {
    console.info(`[INFO] ${new Date().toISOString()} ${message}`, meta);
  }
}
```

#### 监控指标
```bash
# 系统资源监控
top -p $(pgrep -f "node.*server")

# 内存使用情况
ps aux | grep node

# 磁盘使用情况
du -sh packages/server/data/
du -sh packages/server/screenshots/
```

## 🤝 贡献指南

### 💻 开发流程

1. **Fork 项目** 到你的 GitHub 账户
2. **创建特性分支**: `git checkout -b feature/amazing-feature`
3. **提交更改**: `git commit -m 'Add amazing feature'`
4. **推送分支**: `git push origin feature/amazing-feature`
5. **创建 Pull Request**

### 📝 代码规范

#### 提交信息格式
```
type(scope): description

例如:
feat(monitor): add new performance metric
fix(ui): resolve status display issue
docs(readme): update installation guide
```

#### 代码风格
- 使用 **Biome** 进行代码格式化和检查
- 遵循 **TypeScript** 严格模式
- 组件命名使用 **PascalCase**
- 文件命名使用 **kebab-case**

```bash
# 格式化代码
pnpm format

# 检查代码质量
pnpm lint

# 自动修复
pnpm check:fix
```

### 🧪 测试

```bash
# 运行测试 (计划中)
pnpm test

# 测试覆盖率 (计划中)
pnpm test:coverage

# E2E 测试 (计划中)
pnpm test:e2e
```

### 📋 Issue 报告

#### Bug 报告模板
```markdown
## Bug 描述
详细描述遇到的问题

## 复现步骤
1. 执行 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

## 期望行为
描述你期望发生的情况

## 实际行为
描述实际发生的情况

## 环境信息
- OS: [e.g. macOS 12.0]
- Node.js: [e.g. 18.17.0]
- Browser: [e.g. Chrome 115.0]
- Version: [e.g. 1.0.0]
```

#### 功能请求模板
```markdown
## 功能描述
清晰简洁地描述你希望添加的功能

## 使用场景
解释为什么需要这个功能，它解决了什么问题

## 期望的解决方案
描述你希望的实现方式

## 替代方案
描述你考虑过的其他解决方案

## 其他信息
添加任何其他相关信息或截图
```

### 🚀 发布流程

```bash
# 1. 更新版本号
npm version patch|minor|major

# 2. 生成变更日志
git log --oneline

# 3. 创建发布标签
git tag -a v1.0.0 -m "Release version 1.0.0"

# 4. 推送标签
git push origin v1.0.0
```

## 📚 扩展资源

### 🔗 相关链接
- [Web Vitals 官方文档](https://web.dev/vitals/)
- [Puppeteer 官方文档](https://pptr.dev/)
- [React 官方文档](https://react.dev/)
- [Ant Design 组件库](https://ant.design/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)

### 📖 推荐阅读
- [Core Web Vitals 优化指南](https://web.dev/optimize-vitals/)
- [性能监控最佳实践](https://web.dev/monitoring/)
- [页面性能分析方法](https://web.dev/performance-audits/)

### 🛠️ 开发工具推荐
- **VS Code**: 推荐的代码编辑器
- **Chrome DevTools**: 性能分析工具
- **Lighthouse**: 页面质量审计工具
- **WebPageTest**: 在线性能测试工具

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源协议。

## 👥 贡献者

感谢所有为这个项目做出贡献的开发者们！

<div align="center">

---

**如果这个项目对你有帮助，请给它一个 ⭐ Star！**

[回到顶部](#page-probe---落地页性能监控系统)

</div> 