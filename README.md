# Page Probe - 落地页性能监控系统

一个实时监控落地页核心性能指标（LCP/FID/CLS）并自动检测白屏异常的系统。

## 功能特性

### 🎯 核心功能
- **Web Vitals监控**: 实时监控LCP、FID、CLS等核心性能指标
- **白屏检测**: 自动检测页面白屏异常并截图保存
- **实时告警**: 基于规则的性能指标告警系统
- **可视化分析**: 性能趋势图表和统计分析
- **目标管理**: 灵活的监控目标配置和管理

### 📊 性能指标
- **LCP (Largest Contentful Paint)**: 最大内容绘制时间
- **FID (First Input Delay)**: 首次输入延迟
- **CLS (Cumulative Layout Shift)**: 累积布局偏移
- **FCP (First Contentful Paint)**: 首次内容绘制
- **TTFB (Time to First Byte)**: 首字节时间

### 🔔 告警功能
- 性能指标阈值告警
- 白屏异常告警
- 实时通知推送
- 告警历史记录

## 技术栈

### 前端
- **React 18** - UI框架
- **TypeScript** - 类型安全
- **TailwindCSS** - 样式框架
- **Rsbuild** - 构建工具
- **Recharts** - 图表库
- **Socket.IO** - 实时通信

### 后端
- **Koa 3** - Web框架
- **TypeScript** - 类型安全
- **Puppeteer** - 页面监控
- **Socket.IO** - 实时通信
- **Node-cron** - 定时任务

### 存储
- **JSON文件** - 本地数据存储
- **文件系统** - 截图存储

## 快速开始

### 环境要求
- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装依赖
```bash
# 安装所有依赖
pnpm install:all
```

### 开发环境启动
```bash
# 同时启动前端和后端开发服务器
pnpm dev
```

### 生产环境部署
```bash
# 构建项目
pnpm build

# 启动生产服务器
pnpm start
```

## 服务端口

- **前端开发服务器**: http://localhost:3000
- **后端API服务器**: http://localhost:3001
- **API文档**: http://localhost:3001/api

## 目录结构

```
page-probe/
├── packages/
│   ├── web/                 # 前端React应用
│   │   ├── src/
│   │   │   ├── components/  # React组件
│   │   │   ├── pages/       # 页面组件
│   │   │   ├── services/    # API服务
│   │   │   ├── types/       # TypeScript类型
│   │   │   └── utils/       # 工具函数
│   │   └── public/          # 静态文件
│   ├── server/              # 后端Koa应用
│   │   ├── src/
│   │   │   ├── routes/      # API路由
│   │   │   ├── services/    # 业务服务
│   │   │   ├── models/      # 数据模型
│   │   │   └── utils/       # 工具函数
│   │   ├── data/            # JSON数据存储
│   │   └── screenshots/     # 截图存储
│   └── probe/               # 监控探针 (计划中)
└── README.md
```

## API接口

### 监控目标管理
- `GET /api/targets` - 获取所有监控目标
- `POST /api/targets` - 创建监控目标
- `PUT /api/targets/:id` - 更新监控目标
- `DELETE /api/targets/:id` - 删除监控目标
- `POST /api/targets/:id/monitor` - 手动触发监控

### 性能数据查询
- `GET /api/metrics` - 获取性能指标数据
- `GET /api/blank-screens` - 获取白屏检测结果
- `GET /api/stats` - 获取统计数据

### 告警管理
- `GET /api/alert-rules` - 获取告警规则
- `POST /api/alert-rules` - 创建告警规则
- `PUT /api/alert-rules/:id` - 更新告警规则
- `DELETE /api/alert-rules/:id` - 删除告警规则
- `GET /api/alerts` - 获取告警记录

## 使用指南

### 1. 添加监控目标
1. 访问"监控目标"页面
2. 点击"添加监控目标"
3. 填写目标名称和URL
4. 设置监控间隔
5. 启用监控

### 2. 查看性能数据
1. 访问"仪表板"页面
2. 查看性能指标卡片
3. 分析性能趋势图表
4. 筛选时间范围

### 3. 配置告警规则
1. 访问"告警管理"页面
2. 创建新的告警规则
3. 设置指标阈值
4. 启用告警规则

### 4. 监控白屏异常
- 系统自动检测页面白屏
- 异常时自动截图保存
- 在告警记录中查看详情

## 开发指南

### 添加新的监控指标
1. 在 `packages/server/src/services/monitor.ts` 中添加指标收集逻辑
2. 更新 `packages/web/src/types/index.ts` 中的类型定义
3. 在前端组件中展示新指标

### 扩展告警功能
1. 在 `packages/server/src/services/alert.ts` 中添加告警逻辑
2. 配置新的告警通道（邮件、短信等）
3. 更新前端告警管理界面

### 自定义存储后端
1. 实现 `packages/server/src/services/storage.ts` 接口
2. 支持数据库存储（MySQL、MongoDB等）
3. 添加数据迁移工具

## 性能优化建议

### 前端优化
- 使用 React.memo 优化组件渲染
- 实现虚拟滚动处理大量数据
- 添加数据缓存机制

### 后端优化
- 实现数据库连接池
- 添加API缓存层
- 优化监控任务调度

### 监控优化
- 配置合理的监控频率
- 实现分布式监控
- 添加监控任务队列

## 故障排除

### 常见问题
1. **Puppeteer安装失败**: 配置npm镜像或使用cnpm
2. **端口冲突**: 修改配置文件中的端口设置
3. **监控任务失败**: 检查目标URL的可访问性

### 日志分析
- 查看后端服务器日志: `packages/server/logs/`
- 检查浏览器控制台错误
- 监控系统资源使用情况

## 贡献指南

1. Fork 本项目
2. 创建功能分支: `git checkout -b feature/new-feature`
3. 提交更改: `git commit -am 'Add new feature'`
4. 推送分支: `git push origin feature/new-feature`
5. 提交 Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 Issue 或 Pull Request。 