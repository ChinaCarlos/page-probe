import React, { Suspense, ComponentType } from "react";
import { Spin } from "antd";

// Loading 组件
export const PageLoading: React.FC = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "50vh",
      flexDirection: "column",
    }}
  >
    <Spin size="large" />
    <div style={{ marginTop: 16, color: "#666" }}>页面加载中...</div>
  </div>
);

// 错误边界组件
class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Lazy component failed to load:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div style={{ padding: "50px", textAlign: "center" }}>
            <h3>页面加载失败</h3>
            <p>请刷新页面重试</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "8px 16px",
                background: "#1890ff",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              刷新页面
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// 懒加载高阶组件
export function lazyImport<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = React.lazy(importFunc);

  const WrappedComponent: React.FC<React.ComponentProps<T>> = (props) => (
    <LazyErrorBoundary fallback={fallback}>
      <Suspense fallback={<PageLoading />}>
        <LazyComponent {...props} />
      </Suspense>
    </LazyErrorBoundary>
  );

  return WrappedComponent;
}

// 预加载函数
export function preloadComponent(
  importFunc: () => Promise<{ default: ComponentType<any> }>
) {
  // 预加载组件，但不等待结果
  importFunc().catch(console.error);
}
