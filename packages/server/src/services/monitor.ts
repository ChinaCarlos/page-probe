import * as path from "path";
import * as fs from "fs-extra";
import puppeteer, { Browser, Page } from "puppeteer";
import { v4 as uuidv4 } from "uuid";
import {
  CHROME_PATHS,
  DEFAULT_MOBILE_DEVICE,
  DESKTOP_DEVICE_CONFIG,
  DeviceType,
  MOBILE_DEVICE_CONFIG,
  MONITOR_CONFIG,
  ScreenshotStage,
} from "../constants";
import {
  BlankScreenDetection,
  MonitorTarget,
  WebVitalsMetrics,
  ResourceType,
} from "../models";
import { storage } from "./storage";

const SCREENSHOTS_DIR = path.join(__dirname, "../../screenshots");
fs.ensureDirSync(SCREENSHOTS_DIR);

// 检测本地Chrome路径
function getLocalChromePath(): string | undefined {
  for (const chromePath of CHROME_PATHS) {
    if (fs.existsSync(chromePath)) {
      return chromePath;
    }
  }
  return undefined;
}

interface MonitorResult {
  metrics: WebVitalsMetrics;
  blankScreen: BlankScreenDetection | null;
  screenshots: string[];
  resourceStats?: any; // 静态资源统计数据
}

class MonitorService {
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    try {
      const localChromePath = getLocalChromePath();

      if (localChromePath) {
        console.log(`使用本地Chrome浏览器: ${localChromePath}`);
        this.browser = await puppeteer.launch({
          headless: true,
          executablePath: localChromePath,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor",
          ],
        });
      } else {
        console.log("未找到本地Chrome，使用Puppeteer默认浏览器");
        this.browser = await puppeteer.launch({
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
          ],
        });
      }

      console.log("监控服务初始化成功");
    } catch (error) {
      console.error("监控服务初始化失败:", error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // 删除目标时清理所有相关截图
  async cleanupTargetScreenshots(targetId: string): Promise<void> {
    try {
      if (!fs.existsSync(SCREENSHOTS_DIR)) {
        return;
      }

      const files = fs.readdirSync(SCREENSHOTS_DIR);

      // 获取该目标的所有会话ID
      const targetMetrics = await storage.getMetricsByTargetId(targetId);
      const sessionIds = new Set(
        targetMetrics.map((m) => m.sessionId).filter(Boolean)
      );

      // 删除所有属于该目标的截图
      for (const file of files) {
        if (file.endsWith(".png")) {
          const sessionId = file.split("_")[0];
          if (sessionIds.has(sessionId)) {
            try {
              fs.unlinkSync(path.join(SCREENSHOTS_DIR, file));
              console.log(`删除目标截图: ${file}`);
            } catch (error) {
              console.warn(`删除截图失败: ${file}`, error);
            }
          }
        }
      }
    } catch (error) {
      console.warn("清理目标截图失败:", error);
    }
  }

  // 清理指定截图文件
  private async cleanupScreenshots(screenshots: string[]): Promise<void> {
    try {
      if (!fs.existsSync(SCREENSHOTS_DIR) || screenshots.length === 0) {
        return;
      }

      let cleanedCount = 0;
      for (const screenshot of screenshots) {
        try {
          const filePath = path.join(SCREENSHOTS_DIR, screenshot);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`删除截图: ${screenshot}`);
            cleanedCount++;
          }
        } catch (error) {
          console.warn(`删除截图失败: ${screenshot}`, error);
        }
      }

      if (cleanedCount > 0) {
        console.log(`共删除 ${cleanedCount} 个截图文件`);
      }
    } catch (error) {
      console.warn("删除截图失败:", error);
    }
  }

  // 清理任务截图（公开方法）
  async cleanupTaskScreenshots(screenshots: string[]): Promise<void> {
    return this.cleanupScreenshots(screenshots);
  }

  // 立即监控单个目标
  async monitorTargetImmediately(
    target: MonitorTarget
  ): Promise<MonitorResult> {
    console.log(`立即开始监控: ${target.name} (${target.url})`);

    if (!this.browser) {
      await this.initialize();
    }

    if (!this.browser) {
      throw new Error("浏览器未初始化");
    }

    // 根据目标的设备类型进行监控
    const deviceType = target.deviceType || DeviceType.MOBILE;
    const result = await this.performMonitoring(target, deviceType);

    return result;
  }

  private async performMonitoring(
    target: MonitorTarget,
    deviceType: DeviceType
  ): Promise<MonitorResult> {
    const page = await this.browser!.newPage();
    const screenshots: string[] = [];
    const sessionId = uuidv4();
    const screenshotStages: { [key: string]: boolean } = {};

    // 监控开始时间
    const monitoringStartTime = Date.now();

    // 获取白屏检测配置，用于设置超时时间
    const blankScreenConfig = await storage.getBlankScreenConfig();
    const pageLoadTimeout = blankScreenConfig.pageLoadTimeout || 10000; // 默认10秒
    const domLoadTimeout = blankScreenConfig.domLoadTimeout || 8000; // 默认8秒

    console.log(
      `监控配置: 页面加载超时=${pageLoadTimeout}ms, DOM加载超时=${domLoadTimeout}ms`
    );

    // 页面加载状态跟踪
    const pageLoadStatus = {
      domContentLoaded: false,
      loadEvent: false,
      loadStartTime: 0,
      domLoadTime: 0,
      pageLoadTime: 0,
      hasTimeout: false,
      timeoutReason: "",
      // 添加HTTP响应状态
      httpResponse: null as any,
    };

    try {
      // 设置设备类型
      if (deviceType === DeviceType.MOBILE) {
        const device = MOBILE_DEVICE_CONFIG[DEFAULT_MOBILE_DEVICE];
        await page.setUserAgent(device.userAgent);
        await page.setViewport(device.viewport);
        await new Promise((resolve) =>
          setTimeout(resolve, MONITOR_CONFIG.INTERACTION_WAIT)
        );

        const actualViewport = await page.viewport();
        if (actualViewport) {
          console.log(
            `移动端视窗设置: ${actualViewport.width}x${actualViewport.height}`
          );
        }
      } else {
        await page.setViewport(DESKTOP_DEVICE_CONFIG.viewport);
        await new Promise((resolve) =>
          setTimeout(resolve, MONITOR_CONFIG.INTERACTION_WAIT)
        );
        console.log(
          `桌面端视窗设置: ${DESKTOP_DEVICE_CONFIG.viewport.width}x${DESKTOP_DEVICE_CONFIG.viewport.height}`
        );
      }

      console.log(`开始${deviceType}监控: ${target.name} (${target.url})`);

      // 监听页面加载事件
      const domLoadedPromise = new Promise<void>((resolve) => {
        page.once("domcontentloaded", () => {
          pageLoadStatus.domContentLoaded = true;
          pageLoadStatus.domLoadTime =
            Date.now() - pageLoadStatus.loadStartTime;
          console.log(
            `DOM加载完成: ${target.name} (${pageLoadStatus.domLoadTime}ms)`
          );
          resolve();
        });
      });

      const pageLoadPromise = new Promise<void>((resolve) => {
        page.once("load", () => {
          pageLoadStatus.loadEvent = true;
          pageLoadStatus.pageLoadTime =
            Date.now() - pageLoadStatus.loadStartTime;
          console.log(
            `页面加载完成: ${target.name} (${pageLoadStatus.pageLoadTime}ms)`
          );
          resolve();
        });
      });

      const metrics: Partial<WebVitalsMetrics> = {
        id: uuidv4(),
        timestamp: Date.now(),
        lcp: null,
        fid: null,
        cls: null,
        fcp: null,
        ttfb: null,
        loadTime: null,
        domContentLoaded: null,
      };

      // 静态资源监听数据
      const resourceData: any[] = [];

      // 监听网络请求
      await page.setRequestInterception(true);
      const requestStartTimes = new Map<string, number>();

      page.on("request", (request) => {
        requestStartTimes.set(request.url(), Date.now());
        request.continue();
      });

      page.on("response", async (response) => {
        const url = response.url();
        const startTime = requestStartTimes.get(url);
        if (!startTime) return;

        const loadTime = Date.now() - startTime;
        const headers = response.headers();
        const contentLength = headers["content-length"];
        const size = contentLength ? parseInt(contentLength, 10) : 0;

        // 获取资源类型
        const resourceType = response.request().resourceType();
        const contentType = headers["content-type"] || "";
        let type = this.getDetailedResourceType(url, contentType, resourceType);

        const resourceInfo = {
          url,
          size,
          loadTime,
          type,
          status: response.status(),
          fromCache: response.fromCache(),
          contentType,
        };

        resourceData.push(resourceInfo);
        requestStartTimes.delete(url);
      });

      // 在页面加载时注入Web Vitals监控脚本
      page.evaluateOnNewDocument(() => {
        (window as any).webVitalsData = {};
        (window as any).timings = {
          domContentLoaded: null,
          load: null,
        };

        // Web Vitals 监控代码
        try {
          // LCP监控
          if ("PerformanceObserver" in window) {
            new PerformanceObserver((entryList) => {
              const entries = entryList.getEntries();
              const lastEntry = entries[entries.length - 1];
              (window as any).webVitalsData.lcp = lastEntry.startTime;
              console.log("LCP:", lastEntry.startTime);
            }).observe({ entryTypes: ["largest-contentful-paint"] });

            // FCP监控
            new PerformanceObserver((entryList) => {
              const entries = entryList.getEntries();
              entries.forEach((entry) => {
                if (entry.name === "first-contentful-paint") {
                  (window as any).webVitalsData.fcp = entry.startTime;
                  console.log("FCP:", entry.startTime);
                }
              });
            }).observe({ entryTypes: ["paint"] });

            // FID监控
            new PerformanceObserver((entryList) => {
              const entries = entryList.getEntries();
              entries.forEach((entry: any) => {
                if (entry.processingStart && entry.startTime) {
                  const fid = entry.processingStart - entry.startTime;
                  (window as any).webVitalsData.fid = fid;
                  console.log("FID:", fid);
                }
              });
            }).observe({ entryTypes: ["first-input"] });
          }
        } catch (e) {
          console.error("Web Vitals监控初始化失败:", e);
        }

        // CLS监控
        try {
          if ("PerformanceObserver" in window) {
            let clsValue = 0;
            let sessionValue = 0;
            const sessionEntries: any[] = [];

            new PerformanceObserver((entryList) => {
              for (const entry of entryList.getEntries()) {
                const layoutShift = entry as any;
                if (!layoutShift.hadRecentInput) {
                  sessionEntries.push(layoutShift);
                  sessionValue += layoutShift.value;
                }
              }

              clsValue = Math.max(clsValue, sessionValue);
              (window as any).webVitalsData.cls = clsValue;
            }).observe({ entryTypes: ["layout-shift"] });

            // 定期检查CLS值
            const clsCheckInterval = setInterval(() => {
              if ((window as any).webVitalsData.cls !== undefined) {
                console.log("CLS当前值:", (window as any).webVitalsData.cls);
              }
            }, 1000);

            // 在页面load后停止检查
            window.addEventListener("load", () => {
              setTimeout(() => {
                clearInterval(clsCheckInterval);
                console.log("CLS最终值:", (window as any).webVitalsData.cls);
              }, 3000); // 在load后再等待3秒
            });
          }
        } catch (e) {
          console.error("CLS监控初始化失败:", e);
        }

        // DOM事件监听
        document.addEventListener("DOMContentLoaded", () => {
          (window as any).timings.domContentLoaded = performance.now();
        });

        window.addEventListener("load", () => {
          (window as any).timings.load = performance.now();
        });
      });

      // 截图函数
      const takeScreenshot = async (
        stage: ScreenshotStage,
        isScrollable = false
      ) => {
        if (screenshotStages[stage]) return; // 避免重复截图
        screenshotStages[stage] = true;

        try {
          const timestamp = Date.now();
          const filename = `${sessionId}_${stage}_${timestamp}.png`;
          const filepath = path.join(SCREENSHOTS_DIR, filename);

          if (isScrollable) {
            // 检查页面是否可以滚动
            const canScroll = await page.evaluate(() => {
              return document.body.scrollHeight > window.innerHeight;
            });

            if (canScroll) {
              // 截取完整页面（长图）
              await page.screenshot({
                path: filepath,
                fullPage: true,
              });
            } else {
              // 普通截图
              await page.screenshot({
                path: filepath,
                fullPage: false,
              });
            }
          } else {
            await page.screenshot({
              path: filepath,
              fullPage: false,
            });
          }

          screenshots.push(filename);
          console.log(`截图保存: ${stage} -> ${filename}`);
        } catch (error) {
          console.warn(`截图失败 (${stage}):`, error);
        }
      };

      try {
        // 记录页面开始加载时间
        pageLoadStatus.loadStartTime = Date.now();

        // 导航到目标页面，设置超时
        const navigationPromise = page.goto(target.url, {
          waitUntil: "networkidle0",
          timeout: pageLoadTimeout,
        });

        // 设置超时检测
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            pageLoadStatus.hasTimeout = true;
            pageLoadStatus.timeoutReason = `页面访问超时(${
              pageLoadTimeout / 1000
            }秒)，未能在规定时间内完成加载`;
            reject(new Error("页面访问超时"));
          }, pageLoadTimeout);
        });

        // 等待页面导航或超时
        try {
          const response = await Promise.race([
            navigationPromise,
            timeoutPromise,
          ]);
          // 保存HTTP响应状态
          if (response) {
            pageLoadStatus.httpResponse = {
              status: response.status(),
              statusText: response.statusText(),
              url: response.url(),
              ok: response.ok(),
            };
          }
        } catch (timeoutError) {
          // 超时情况下仍然尝试检测当前页面状态
          console.warn(`页面访问超时: ${target.url}`);

          // 检查是否在超时前至少触发了DOMContentLoaded
          if (!pageLoadStatus.domContentLoaded) {
            pageLoadStatus.timeoutReason = "页面访问超时，DOM未加载完成";
          } else if (!pageLoadStatus.loadEvent) {
            pageLoadStatus.timeoutReason = "页面访问超时，load事件未触发";
          }
        }

        // 等待DOM加载（使用配置中的超时时间）
        try {
          await Promise.race([
            domLoadedPromise,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("DOM加载超时")), domLoadTimeout)
            ),
          ]);
        } catch (domError) {
          if (!pageLoadStatus.domContentLoaded) {
            pageLoadStatus.hasTimeout = true;
            pageLoadStatus.timeoutReason = `DOM加载超时，DOMContentLoaded事件未在${
              domLoadTimeout / 1000
            }秒内触发`;
          }
        }

        // 等待页面完全加载（最多再等5秒）
        try {
          await Promise.race([
            pageLoadPromise,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("页面加载超时")), 5000)
            ),
          ]);
        } catch (loadError) {
          if (!pageLoadStatus.loadEvent) {
            pageLoadStatus.hasTimeout = true;
            if (!pageLoadStatus.timeoutReason) {
              pageLoadStatus.timeoutReason =
                "页面加载超时，load事件未在规定时间内触发";
            }
          }
        }

        console.log(`页面加载状态:`, pageLoadStatus);

        // 定时检查指标并截图
        const checkTimingsAndScreenshot = async () => {
          const vitalsData = await page.evaluate(() => {
            return (window as any).webVitalsData || {};
          });

          // FCP截图
          if (vitalsData.fcp && !screenshots.some((s) => s.includes("FCP"))) {
            await takeScreenshot(ScreenshotStage.FCP);
          }

          // LCP截图
          if (vitalsData.lcp && !screenshots.some((s) => s.includes("LCP"))) {
            await takeScreenshot(ScreenshotStage.LCP, true);
          }
        };

        // 定期检查指标
        const timingInterval = setInterval(checkTimingsAndScreenshot, 1000);

        // FP截图（如果还没有截过图）
        if (screenshots.length === 0) {
          await takeScreenshot(ScreenshotStage.FP);
        }

        // DOM内容加载完成截图
        if (pageLoadStatus.domContentLoaded) {
          await takeScreenshot(ScreenshotStage.DOM_CONTENT_LOADED);
        }

        // 页面完全加载截图
        if (pageLoadStatus.loadEvent) {
          await takeScreenshot(ScreenshotStage.LOAD, true);
        }

        // 等待页面稳定和更多指标收集
        await new Promise((resolve) =>
          setTimeout(resolve, MONITOR_CONFIG.WAIT_TIME)
        );

        clearInterval(timingInterval);

        // 最后再检查一次并截图
        await checkTimingsAndScreenshot();

        // 额外等待让CLS有更多时间被检测
        await new Promise((resolve) =>
          setTimeout(resolve, MONITOR_CONFIG.CLS_WAIT_TIME)
        );

        // TTI检测和截图
        try {
          // 简单的TTI检测：等待主线程空闲
          await page.evaluate(() => {
            return new Promise((resolve) => {
              const checkIdle = () => {
                if (document.readyState === "complete") {
                  // 等待一小段时间确保交互性
                  setTimeout(resolve, 1000);
                } else {
                  setTimeout(checkIdle, 100);
                }
              };
              checkIdle();
            });
          });

          await takeScreenshot(ScreenshotStage.TTI, true);
        } catch (error) {
          console.warn(`TTI检测失败: ${(error as Error).message}`);
        }

        // 白屏检测截图
        await takeScreenshot(ScreenshotStage.BLANK_SCREEN_CHECK);
      } catch (error) {
        console.error(`页面加载失败: ${target.url}`, error);
        metrics.lcp = null;
        metrics.fid = null;
        metrics.cls = null;
        metrics.fcp = null;
        metrics.ttfb = null;

        // 错误截图
        await takeScreenshot(ScreenshotStage.ERROR);
      }

      // 获取最终的Web Vitals数据
      const vitalsData = await page.evaluate(() => {
        const data = (window as any).webVitalsData || {};
        console.log("最终Web Vitals数据:", data);
        return {
          lcp: data.lcp || null,
          fid: data.fid || null,
          cls: data.cls !== undefined ? data.cls : null,
          fcp: data.fcp || null,
        };
      });

      console.log("服务端获取到的vitalsData:", vitalsData);

      // 获取Navigation Timing指标
      const navTiming = await page.evaluate(() => {
        try {
          const timing = performance.getEntriesByType("navigation")[0] as any;
          return timing
            ? {
                ttfb: timing.responseStart - timing.fetchStart,
                loadTime: timing.loadEventEnd - timing.fetchStart,
                domContentLoaded:
                  timing.domContentLoadedEventEnd - timing.fetchStart,
              }
            : { ttfb: null, loadTime: null, domContentLoaded: null };
        } catch (e) {
          return { ttfb: null, loadTime: null, domContentLoaded: null };
        }
      });

      // 合并指标
      Object.assign(metrics, vitalsData, navTiming, {
        targetId: target.id,
        deviceType,
        sessionId,
        screenshots: screenshots,
      });

      // 格式化所有数值指标为四位小数
      const formatToFourDecimals = (
        value: number | null | undefined
      ): number | null => {
        return value !== null && value !== undefined
          ? Number(value.toFixed(4))
          : null;
      };

      metrics.lcp = formatToFourDecimals(metrics.lcp);
      metrics.fid = formatToFourDecimals(metrics.fid);
      metrics.cls = formatToFourDecimals(metrics.cls);
      metrics.fcp = formatToFourDecimals(metrics.fcp);
      metrics.ttfb = formatToFourDecimals(metrics.ttfb);
      metrics.loadTime = formatToFourDecimals(metrics.loadTime);
      metrics.domContentLoaded = formatToFourDecimals(metrics.domContentLoaded);

      // 计算资源统计数据
      const resourceStats = this.calculateResourceStats(resourceData);
      console.log(`资源统计:`, resourceStats);

      // 检测白屏（传入页面加载状态）
      const blankScreenResult = await this.detectBlankScreen(
        page,
        target.url,
        target.id,
        sessionId,
        deviceType,
        pageLoadStatus // 传入加载状态用于超时检测
      );

      // 保存性能指标
      await storage.saveMetrics(metrics as WebVitalsMetrics);

      // 保存白屏检测结果
      if (blankScreenResult) {
        await storage.saveBlankScreenDetection(blankScreenResult);
      }

      console.log(`${deviceType}监控完成: ${target.name}`, metrics);

      return {
        metrics: metrics as WebVitalsMetrics,
        blankScreen: blankScreenResult,
        screenshots,
        resourceStats, // 添加资源统计数据
      };
    } catch (error) {
      console.error(`监控失败: ${target.name} (${deviceType})`, error);
      throw error;
    } finally {
      await page.close();
    }
  }

  async monitorTarget(target: MonitorTarget): Promise<void> {
    try {
      await this.monitorTargetImmediately(target);
    } catch (error) {
      console.error(`监控目标失败: ${target.name}`, error);
    }
  }

  // 白屏检测主函数
  private async detectBlankScreen(
    page: Page,
    url: string,
    targetId: string,
    sessionId: string,
    deviceType: DeviceType,
    pageLoadStatus: any
  ): Promise<BlankScreenDetection | null> {
    try {
      // 获取白屏检测配置
      const config = await storage.getBlankScreenConfig();
      console.log(`白屏检测配置详情:`, {
        enabledChecks: {
          domStructure: config.enableDOMStructureCheck,
          content: config.enableContentCheck,
          textMatch: config.enableTextMatchCheck,
          httpStatus: config.enableHTTPStatusCheck,
          timeout: config.enableTimeoutCheck,
        },
        thresholds: {
          domElementThreshold: config.domElementThreshold,
          heightRatioThreshold: config.heightRatioThreshold,
          textLengthThreshold: config.textLengthThreshold,
          domLoadTimeout: config.domLoadTimeout,
          pageLoadTimeout: config.pageLoadTimeout,
        },
        keywords: {
          errorTextKeywords: config.errorTextKeywords,
          errorStatusCodes: config.errorStatusCodes,
        },
      });

      const results: any = {};
      const reasons: string[] = [];
      const enabledChecks: any = {};

      // 1. DOM结构检测
      if (config.enableDOMStructureCheck) {
        enabledChecks.domStructure = true;
        results.domStructure = await this.checkDOMStructure(page, config);
        if (results.domStructure?.isBlank) {
          reasons.push(results.domStructure.reason);
        }
      } else {
        enabledChecks.domStructure = false;
        console.log(`跳过DOM结构检测 (已关闭)`);
      }

      // 2. 页面内容检测
      if (config.enableContentCheck) {
        enabledChecks.content = true;
        results.content = await this.checkPageContent(page, config);
        if (results.content?.isEmpty) {
          reasons.push(results.content.reason);
        }
      } else {
        enabledChecks.content = false;
        console.log(`跳过页面内容检测 (已关闭)`);
      }

      // 3. 文案匹配检测
      if (config.enableTextMatchCheck) {
        enabledChecks.textMatch = true;
        results.textMatch = await this.checkTextMatch(page, config);
        if (results.textMatch?.hasError) {
          reasons.push(results.textMatch.reason);
        }
      } else {
        enabledChecks.textMatch = false;
        console.log(`跳过文案匹配检测 (已关闭)`);
      }

      // 4. HTTP状态检测
      if (config.enableHTTPStatusCheck) {
        enabledChecks.httpStatus = true;
        results.httpStatus = await this.checkHTTPStatus(
          pageLoadStatus.httpResponse,
          config
        );
        if (results.httpStatus?.isError) {
          reasons.push(results.httpStatus.reason);
        }
      } else {
        enabledChecks.httpStatus = false;
        console.log(`跳过HTTP状态检测 (已关闭)`);
      }

      // 5. 加载超时检测
      if (config.enableTimeoutCheck) {
        enabledChecks.timeout = true;
        results.timeout = this.checkTimeoutStatus(pageLoadStatus, config);
        if (results.timeout?.hasTimeout) {
          reasons.push(results.timeout.reason);
        }
      } else {
        enabledChecks.timeout = false;
        console.log(`跳过加载超时检测 (已关闭)`);
      }

      // 判断是否为白屏
      const isBlankScreen = this.determineBlankScreen(results);

      const detection: BlankScreenDetection = {
        id: uuidv4(),
        timestamp: Date.now(),
        targetId,
        deviceType,
        sessionId,
        url,
        isBlankScreen,
        reason: isBlankScreen
          ? `检测到白屏或页面异常: ${reasons.join("; ")}`
          : "页面正常",
        details: results,
        reasons,
        enabledChecks, // 记录哪些检测项被启用了
      };

      // 保存白屏检测结果
      await storage.saveBlankScreenDetection(detection);

      console.log(`白屏检测完成 (${deviceType}):`, {
        url,
        isBlankScreen,
        reasons,
        enabledChecks,
      });

      return detection;
    } catch (error) {
      console.error(`白屏检测失败: ${url}`, error);
      return null;
    }
  }

  // 检测1: DOM结构检测
  private async checkDOMStructure(
    page: Page,
    config: any
  ): Promise<{
    isBlank: boolean;
    reason?: string;
    elementCount: number;
    bodyHeight: number;
    htmlHeight: number;
    screenHeight: number;
    heightRatio: number;
  }> {
    return await page.evaluate((configData) => {
      const body = document.body;
      const html = document.documentElement;
      const screenHeight = window.innerHeight;

      if (!body) {
        return {
          isBlank: true,
          reason: "DOM body元素不存在",
          elementCount: 0,
          bodyHeight: 0,
          htmlHeight: 0,
          screenHeight,
          heightRatio: 0,
        };
      }

      // 统计body内的子元素数量（只统计有意义的元素）
      const meaningfulElements = Array.from(body.querySelectorAll("*")).filter(
        (el) => {
          const style = window.getComputedStyle(el);
          const tagName = el.tagName.toLowerCase();

          // 排除脚本、样式、meta等无显示意义的元素
          if (
            ["script", "style", "meta", "link", "title", "head"].includes(
              tagName
            )
          ) {
            return false;
          }

          // 排除隐藏元素
          if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            style.opacity === "0"
          ) {
            return false;
          }

          // 排除尺寸为0的元素
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) {
            return false;
          }

          return true;
        }
      );

      const elementCount = meaningfulElements.length;
      const bodyHeight = body.offsetHeight || body.scrollHeight || 0;
      const htmlHeight = html.offsetHeight || html.scrollHeight || 0;
      const maxHeight = Math.max(bodyHeight, htmlHeight);
      const heightRatio = screenHeight > 0 ? maxHeight / screenHeight : 0;

      // 使用配置中的阈值判断是否为空白页面
      const elementThreshold = configData.domElementThreshold || 3;
      const heightThreshold = configData.heightRatioThreshold || 0.15;
      const isBlank =
        elementCount < elementThreshold && heightRatio < heightThreshold;

      let reason = "";
      if (isBlank) {
        if (elementCount < elementThreshold) {
          reason += `DOM可见元素过少(${elementCount}个，阈值${elementThreshold})`;
        }
        if (heightRatio < heightThreshold) {
          if (reason) reason += ", ";
          reason += `页面高度过小(${(heightRatio * 100).toFixed(
            1
          )}%屏幕高度，阈值${(heightThreshold * 100).toFixed(1)}%)`;
        }
      }

      return {
        isBlank,
        reason,
        elementCount,
        bodyHeight,
        htmlHeight,
        screenHeight,
        heightRatio,
      };
    }, config);
  }

  // 检测2: 文案匹配检测（合并404文案和自定义异常文案）
  private async checkTextMatch(
    page: Page,
    config: any
  ): Promise<{
    hasError: boolean;
    reason?: string;
    foundTexts: string[];
  }> {
    return await page.evaluate((configData) => {
      const body = document.body;
      if (!body) {
        return {
          hasError: false,
          reason: "",
          foundTexts: [],
        };
      }

      // 使用配置中的错误文案关键词
      const errorKeywords = configData.errorTextKeywords || [];

      const bodyText = body.innerText || body.textContent || "";
      const pageTitle = document.title || "";
      // 转换为小写进行匹配，实现忽略大小写
      const allText = (bodyText + " " + pageTitle).toLowerCase();

      const foundTexts: string[] = [];
      const matchedKeywords = errorKeywords.filter((keyword: string) => {
        // 同样将关键词转为小写进行匹配
        const matched = allText.includes(keyword.toLowerCase());
        if (matched) {
          foundTexts.push(keyword);
        }
        return matched;
      });

      const hasError = matchedKeywords.length > 0;
      const reason = hasError
        ? `检测到错误页面文案: ${foundTexts.join(", ")}`
        : "";

      // 调试信息（仅在开发环境输出）
      if (hasError) {
        console.log(`文案匹配检测: 在页面中发现错误关键词`, {
          foundKeywords: foundTexts,
          pageTitle: document.title,
          textLength: bodyText.length,
        });
      }

      return {
        hasError,
        reason,
        foundTexts,
      };
    }, config);
  }

  // 检测4: 页面内容检测
  private async checkPageContent(
    page: Page,
    config: any
  ): Promise<{
    isEmpty: boolean;
    reason?: string;
    hasText: boolean;
    hasImages: boolean;
    hasBackgrounds: boolean;
    hasCanvas: boolean;
    textLength: number;
  }> {
    return await page.evaluate((configData) => {
      const body = document.body;
      if (!body) {
        return {
          isEmpty: true,
          reason: "document.body不存在",
          hasText: false,
          hasImages: false,
          hasBackgrounds: false,
          hasCanvas: false,
          textLength: 0,
        };
      }

      // 检查文本内容 - 使用配置中的阈值
      const textContent = body.innerText?.trim() || "";
      const textThreshold = configData.textLengthThreshold || 10;
      const hasText = textContent.length > textThreshold;
      const textLength = textContent.length;

      // 检查图片
      const images = document.querySelectorAll("img");
      const loadedImages = Array.from(images).filter(
        (img: any) => img.complete && img.naturalHeight > 0
      );
      const hasImages = loadedImages.length > 0;

      // 检查背景图片
      const elementsWithBg = Array.from(document.querySelectorAll("*")).filter(
        (el: any) => {
          const style = window.getComputedStyle(el);
          return style.backgroundImage && style.backgroundImage !== "none";
        }
      );
      const hasBackgrounds = elementsWithBg.length > 0;

      // 检查canvas
      const canvases = document.querySelectorAll("canvas");
      const hasCanvas = canvases.length > 0;

      const hasContent = hasText || hasImages || hasBackgrounds || hasCanvas;
      const isEmpty = !hasContent;

      let reason = "";
      if (isEmpty) {
        const issues = [];
        if (!hasText)
          issues.push(
            `无有效文本内容(${textLength}字符，阈值${textThreshold})`
          );
        if (!hasImages) issues.push("无有效图片");
        if (!hasBackgrounds) issues.push("无背景图");
        if (!hasCanvas) issues.push("无Canvas内容");
        reason = `页面内容为空: ${issues.join(", ")}`;
      }

      return {
        isEmpty,
        reason,
        hasText,
        hasImages,
        hasBackgrounds,
        hasCanvas,
        textLength,
      };
    }, config);
  }

  // 检测3: HTTP状态检测（合并标准错误码和自定义状态码）
  private async checkHTTPStatus(
    httpResponse: any = null,
    config: any
  ): Promise<{
    isError: boolean;
    reason?: string;
    statusCode?: number;
    statusText?: string;
  }> {
    try {
      let statusCode: number | undefined;
      let statusText: string | undefined;
      let isError = false;

      // 优先使用传入的HTTP响应状态
      if (httpResponse && typeof httpResponse.status === "number") {
        statusCode = httpResponse.status;
        statusText = httpResponse.statusText || "";

        // 使用配置中的错误状态码列表
        const errorStatusCodes = config.errorStatusCodes || [
          400, 401, 403, 404, 500, 502, 503, 504,
        ];
        isError = errorStatusCodes.includes(statusCode);

        if (isError) {
          return {
            isError,
            reason: `HTTP状态错误: ${statusCode} ${statusText}`,
            statusCode,
            statusText,
          };
        }
      }

      const reason = isError ? `HTTP状态异常: ${statusCode} ${statusText}` : "";

      return {
        isError,
        reason,
        statusCode,
        statusText,
      };
    } catch (error) {
      // 网络错误也认为是异常
      return {
        isError: true,
        reason: `页面状态检测失败: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      };
    }
  }

  // 检测5: 加载超时检测
  private checkTimeoutStatus(
    pageLoadStatus: any,
    config: any
  ): {
    hasTimeout: boolean;
    reason?: string;
    domLoadTime: number;
    pageLoadTime: number;
    domContentLoaded: boolean;
    loadEvent: boolean;
  } {
    const {
      domContentLoaded,
      loadEvent,
      domLoadTime,
      pageLoadTime,
      hasTimeout,
      timeoutReason,
    } = pageLoadStatus;

    // 从配置获取超时阈值
    const domTimeout = config.domLoadTimeout || 8000;
    const pageTimeout = config.pageLoadTimeout || 10000;

    // 检查是否有超时情况
    let isTimeoutError = hasTimeout;
    let reason = "";

    if (hasTimeout) {
      reason = timeoutReason;
    } else {
      // 检查DOM和页面加载时间是否过长
      if (domLoadTime > domTimeout) {
        isTimeoutError = true;
        reason = `DOM加载时间过长(${domLoadTime}ms，阈值${domTimeout}ms)`;
      } else if (pageLoadTime > pageTimeout) {
        isTimeoutError = true;
        reason = `页面加载时间过长(${pageLoadTime}ms，阈值${pageTimeout}ms)`;
      } else if (!domContentLoaded) {
        // 没有触发DOMContentLoaded
        isTimeoutError = true;
        reason = "DOMContentLoaded事件未触发";
      }
    }

    return {
      hasTimeout: isTimeoutError,
      reason,
      domLoadTime,
      pageLoadTime,
      domContentLoaded,
      loadEvent,
    };
  }

  // 综合判断是否为白屏
  private determineBlankScreen(results: {
    domStructure: any;
    content: any;
    textMatch: any;
    httpStatus: any;
    timeout: any;
  }): boolean {
    // 只有启用的检测项检测到异常才认为是白屏/异常页面
    return (
      results.domStructure?.isBlank === true ||
      results.content?.isEmpty === true ||
      results.textMatch?.hasError === true ||
      results.httpStatus?.isError === true ||
      results.timeout?.hasTimeout === true
    );
  }

  async monitorAllTargets(): Promise<void> {
    const targets = await storage.getTargets();

    console.log(`开始监控 ${targets.length} 个目标`);

    for (const target of targets) {
      try {
        await this.monitorTarget(target);
      } catch (error) {
        console.error(`监控目标失败: ${target.name}`, error);
      }
    }
  }

  // 获取目标的监控历史数据
  async getTargetHistory(
    targetId: string,
    hours = 24
  ): Promise<{
    metrics: WebVitalsMetrics[];
    blankScreens: BlankScreenDetection[];
  }> {
    const allMetrics = await storage.getMetrics(targetId, hours);
    const allBlankScreens = await storage.getBlankScreenDetections(
      targetId,
      hours
    );

    return {
      metrics: allMetrics,
      blankScreens: allBlankScreens,
    };
  }

  // 获取详细的资源类型
  private getDetailedResourceType(
    url: string,
    contentType: string,
    resourceType: string
  ): ResourceType {
    const urlLower = url.toLowerCase();
    const contentTypeLower = contentType.toLowerCase();

    // CSS样式文件
    if (contentTypeLower.includes("text/css") || urlLower.includes(".css")) {
      return ResourceType.STYLESHEET;
    }

    // JavaScript文件
    if (
      contentTypeLower.includes("javascript") ||
      contentTypeLower.includes("application/js") ||
      urlLower.includes(".js") ||
      urlLower.includes(".mjs") ||
      urlLower.includes(".ts")
    ) {
      return ResourceType.SCRIPT;
    }

    // 图片文件 - 细分类型
    if (
      contentTypeLower.includes("image/") ||
      /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|tiff|tif)(\?|$)/.test(urlLower)
    ) {
      if (contentTypeLower.includes("svg") || urlLower.includes(".svg")) {
        return ResourceType.IMAGE_SVG;
      }
      if (contentTypeLower.includes("gif") || urlLower.includes(".gif")) {
        return ResourceType.IMAGE_GIF;
      }
      if (contentTypeLower.includes("webp") || urlLower.includes(".webp")) {
        return ResourceType.IMAGE_WEBP;
      }
      if (contentTypeLower.includes("png") || urlLower.includes(".png")) {
        return ResourceType.IMAGE_PNG;
      }
      if (
        contentTypeLower.includes("jpeg") ||
        contentTypeLower.includes("jpg") ||
        urlLower.includes(".jpg") ||
        urlLower.includes(".jpeg")
      ) {
        return ResourceType.IMAGE_JPG;
      }
      return ResourceType.IMAGE;
    }

    // 字体文件
    if (
      contentTypeLower.includes("font/") ||
      /\.(woff2?|ttf|otf|eot)(\?|$)/.test(urlLower)
    ) {
      if (urlLower.includes(".woff2")) {
        return ResourceType.FONT_WOFF2;
      }
      if (urlLower.includes(".woff")) {
        return ResourceType.FONT_WOFF;
      }
      if (urlLower.includes(".ttf")) {
        return ResourceType.FONT_TTF;
      }
      if (urlLower.includes(".otf")) {
        return ResourceType.FONT_OTF;
      }
      if (urlLower.includes(".eot")) {
        return ResourceType.FONT_EOT;
      }
      return ResourceType.FONT;
    }

    // 视频文件
    if (
      contentTypeLower.includes("video/") ||
      /\.(mp4|webm|ogg|avi|mov|wmv|flv|m4v|3gp|mkv)(\?|$)/.test(urlLower)
    ) {
      if (contentTypeLower.includes("mp4") || urlLower.includes(".mp4")) {
        return ResourceType.VIDEO_MP4;
      }
      if (contentTypeLower.includes("webm") || urlLower.includes(".webm")) {
        return ResourceType.VIDEO_WEBM;
      }
      return ResourceType.VIDEO;
    }

    // 音频文件
    if (
      contentTypeLower.includes("audio/") ||
      /\.(mp3|wav|ogg|aac|flac|m4a|wma|opus)(\?|$)/.test(urlLower)
    ) {
      if (contentTypeLower.includes("mp3") || urlLower.includes(".mp3")) {
        return ResourceType.AUDIO_MP3;
      }
      if (contentTypeLower.includes("wav") || urlLower.includes(".wav")) {
        return ResourceType.AUDIO_WAV;
      }
      if (contentTypeLower.includes("ogg") || urlLower.includes(".ogg")) {
        return ResourceType.AUDIO_OGG;
      }
      return ResourceType.AUDIO;
    }

    // 文档文件
    if (
      contentTypeLower.includes("application/pdf") ||
      /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf)(\?|$)/.test(urlLower)
    ) {
      if (urlLower.includes(".pdf")) {
        return ResourceType.DOCUMENT_PDF;
      }
      if (/\.(doc|docx)(\?|$)/.test(urlLower)) {
        return ResourceType.DOCUMENT_WORD;
      }
      if (/\.(xls|xlsx)(\?|$)/.test(urlLower)) {
        return ResourceType.DOCUMENT_EXCEL;
      }
      if (/\.(ppt|pptx)(\?|$)/.test(urlLower)) {
        return ResourceType.DOCUMENT_POWERPOINT;
      }
      return ResourceType.DOCUMENT;
    }

    // JSON数据
    if (
      contentTypeLower.includes("application/json") ||
      urlLower.includes(".json")
    ) {
      return ResourceType.DATA_JSON;
    }

    // XML数据
    if (
      contentTypeLower.includes("application/xml") ||
      contentTypeLower.includes("text/xml") ||
      urlLower.includes(".xml")
    ) {
      return ResourceType.DATA_XML;
    }

    // 压缩文件
    if (/\.(zip|rar|7z|tar|gz|bz2)(\?|$)/.test(urlLower)) {
      return ResourceType.ARCHIVE;
    }

    // Web应用清单
    if (
      urlLower.includes("manifest.json") ||
      urlLower.includes(".webmanifest")
    ) {
      return ResourceType.MANIFEST;
    }

    // Service Worker
    if (
      urlLower.includes("sw.js") ||
      urlLower.includes("service-worker") ||
      urlLower.includes("serviceworker")
    ) {
      return ResourceType.SERVICEWORKER;
    }

    // WebAssembly
    if (
      contentTypeLower.includes("application/wasm") ||
      urlLower.includes(".wasm")
    ) {
      return ResourceType.WASM;
    }

    // 回退到原始类型
    return (resourceType as ResourceType) || ResourceType.OTHER;
  }

  // 计算资源统计数据
  private calculateResourceStats(resourceData: any[]): any {
    if (!resourceData || resourceData.length === 0) {
      return {
        totalSize: 0,
        totalCount: 0,
        totalLoadTime: 0,
        byType: {},
        resources: [],
      };
    }

    // 过滤掉来自缓存的资源（根据需求）
    const nonCachedResources = resourceData.filter((r) => !r.fromCache);

    // 计算总统计
    const totalSize = nonCachedResources.reduce(
      (sum, r) => sum + (r.size || 0),
      0
    );
    const totalCount = nonCachedResources.length;
    const totalLoadTime = nonCachedResources.reduce(
      (sum, r) => sum + (r.loadTime || 0),
      0
    );

    // 按类型分组统计
    const byType: {
      [key: string]: { count: number; size: number; loadTime: number };
    } = {};

    nonCachedResources.forEach((resource) => {
      const type = resource.type || ResourceType.OTHER;
      if (!byType[type]) {
        byType[type] = { count: 0, size: 0, loadTime: 0 };
      }
      byType[type].count++;
      byType[type].size += resource.size || 0;
      byType[type].loadTime += resource.loadTime || 0;
    });

    // 格式化资源信息，移除敏感信息
    const resources = nonCachedResources.map((r) => ({
      url: r.url,
      size: r.size || 0,
      loadTime: r.loadTime || 0,
      type: r.type || ResourceType.OTHER,
      status: r.status,
      fromCache: r.fromCache,
    }));

    return {
      totalSize,
      totalCount,
      totalLoadTime,
      byType,
      resources,
    };
  }
}

export const monitorService = new MonitorService();
