import axios from "axios";
import {
  AlertRecord,
  AlertRule,
  ApiResponse,
  BlankScreenDetection,
  MonitorStats,
  MonitorTarget,
  WebVitalsMetrics,
} from "../types";

const API_BASE_URL =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export const monitorAPI = {
  // 监控目标管理
  getTargets: (): Promise<ApiResponse<MonitorTarget[]>> => api.get("/targets"),

  createTarget: (
    target: Omit<MonitorTarget, "id" | "createdAt" | "updatedAt">
  ): Promise<ApiResponse<MonitorTarget>> => api.post("/targets", target),

  updateTarget: (
    id: string,
    target: Partial<MonitorTarget>
  ): Promise<ApiResponse<MonitorTarget>> => api.put(`/targets/${id}`, target),

  deleteTarget: (id: string): Promise<ApiResponse> =>
    api.delete(`/targets/${id}`),

  // 性能指标查询
  getMetrics: (
    targetId?: string,
    hours?: number
  ): Promise<ApiResponse<WebVitalsMetrics[]>> =>
    api.get("/metrics", { params: { targetId, hours } }),

  // 白屏检测查询
  getBlankScreenDetections: (
    targetId?: string,
    hours?: number
  ): Promise<ApiResponse<BlankScreenDetection[]>> =>
    api.get("/blank-screens", { params: { targetId, hours } }),

  // 告警规则管理
  getAlertRules: (targetId?: string): Promise<ApiResponse<AlertRule[]>> =>
    api.get("/alert-rules", { params: { targetId } }),

  createAlertRule: (
    rule: Omit<AlertRule, "id">
  ): Promise<ApiResponse<AlertRule>> => api.post("/alert-rules", rule),

  updateAlertRule: (
    id: string,
    rule: Partial<AlertRule>
  ): Promise<ApiResponse<AlertRule>> => api.put(`/alert-rules/${id}`, rule),

  deleteAlertRule: (id: string): Promise<ApiResponse> =>
    api.delete(`/alert-rules/${id}`),

  // 告警记录查询
  getAlertRecords: (hours?: number): Promise<ApiResponse<AlertRecord[]>> =>
    api.get("/alerts", { params: { hours } }),

  // 统计数据
  getStats: (): Promise<ApiResponse<MonitorStats>> => api.get("/stats"),

  // 手动触发监控
  triggerMonitor: (targetId: string): Promise<ApiResponse> =>
    api.post(`/targets/${targetId}/monitor`),
};
