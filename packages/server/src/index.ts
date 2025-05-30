import { createServer } from "http";
import * as path from "path";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import cors from "koa-cors";
import serve from "koa-static";
import { Server } from "socket.io";

import router from "./routes";
import { monitorService } from "./services/monitor";
import { taskService } from "./services/task";

const app = new Koa();
const server = createServer(app.callback());
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production" ? false : "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// 中间件
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production" ? false : "http://localhost:3000",
  })
);
app.use(bodyParser());

// 静态文件服务
app.use(serve(path.join(__dirname, "../screenshots")));

// 专门的截图访问路由
app.use(async (ctx, next) => {
  if (ctx.path.startsWith("/api/screenshots/")) {
    const filename = ctx.path.replace("/api/screenshots/", "");
    const screenshotPath = path.join(__dirname, "../screenshots", filename);

    try {
      if (require("fs").existsSync(screenshotPath)) {
        ctx.type = "image/png";
        ctx.body = require("fs").createReadStream(screenshotPath);
      } else {
        ctx.status = 404;
        ctx.body = { error: "截图不存在" };
      }
    } catch (error) {
      ctx.status = 500;
      ctx.body = { error: "获取截图失败" };
    }
  } else {
    await next();
  }
});

// API 路由
app.use(router.routes());
app.use(router.allowedMethods());

// Socket.IO 连接处理
io.on("connection", (socket) => {
  console.log("客户端连接:", socket.id);

  socket.on("disconnect", () => {
    console.log("客户端断开:", socket.id);
  });
});

// 启动服务
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    // 初始化监控服务
    await monitorService.initialize();

    // 初始化任务服务（任务处理器会自动启动）
    console.log("任务服务已初始化，系统现在使用任务驱动模式");

    // 启动服务器
    server.listen(PORT, () => {
      console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
      console.log(`📊 API 端点: http://localhost:${PORT}/api`);
      console.log(`📋 任务管理: 手动创建监控任务，不再自动执行定时监控`);
    });
  } catch (error) {
    console.error("服务器启动失败:", error);
    process.exit(1);
  }
};

// 优雅关闭
const gracefulShutdown = async () => {
  console.log("正在关闭服务器...");

  try {
    await monitorService.shutdown();
    server.close(() => {
      console.log("服务器已关闭");
      process.exit(0);
    });
  } catch (error) {
    console.error("关闭服务器时出错:", error);
    process.exit(1);
  }
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

startServer();
