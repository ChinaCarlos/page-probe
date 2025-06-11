import React, { useState, useEffect } from "react";
import { Layout as AntLayout, Menu, Button, Typography } from "antd";
import {
  DashboardOutlined,
  MonitorOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { preloadComponent } from "../../utils/lazyImport";

const { Header, Sider, Content } = AntLayout;
const { Title } = Typography;

interface LayoutProps {
  children: React.ReactNode;
}

// 预加载映射
const PRELOAD_MAP: Record<string, () => Promise<{ default: any }>> = {
  "/": () => import("../../pages/Dashboard/Dashboard"),
  "/targets": () => import("../../pages/Targets/Targets"),
  "/groups": () => import("../../pages/Groups/Groups"),
  "/tags": () => import("../../pages/Tags/Tags"),
  "/tasks": () => import("../../pages/Tasks/Tasks"),
  "/settings/blank-screen": () =>
    import("../../pages/Settings/BlankScreenSettings"),
  "/settings/task": () => import("../../pages/Settings/TaskSettings"),
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // 预加载常用页面（在首次加载后延迟执行）
  useEffect(() => {
    const timer = setTimeout(() => {
      // 预加载仪表盘和监控目标页面（最常用的页面）
      preloadComponent(() => import("../../pages/Dashboard/Dashboard"));
      preloadComponent(() => import("../../pages/Targets/Targets"));
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const menuItems = [
    {
      key: "/",
      icon: <DashboardOutlined />,
      label: "仪表盘",
    },
    {
      key: "/targets",
      icon: <MonitorOutlined />,
      label: "监控目标",
    },
    {
      key: "/groups",
      icon: <TeamOutlined />,
      label: "分组管理",
    },
    {
      key: "/tags",
      icon: <TagOutlined />,
      label: "标签管理",
    },
    {
      key: "/tasks",
      icon: <UnorderedListOutlined />,
      label: "任务管理",
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "系统设置",
      children: [
        {
          key: "/settings/blank-screen",
          label: "白屏检测设置",
        },
        {
          key: "/settings/task",
          label: "任务设置",
        },
      ],
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  // 鼠标悬停时预加载组件
  const handleMenuItemHover = (key: string) => {
    const preloadFunc = PRELOAD_MAP[key];
    if (preloadFunc) {
      preloadComponent(preloadFunc);
    }
  };

  return (
    <AntLayout className="min-h-screen">
      {/* 固定侧边栏 */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="fixed left-0 top-0 h-screen z-10 shadow-lg border-r border-gray-200"
        style={{ backgroundColor: "#fff" }}
      >
        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          <Title level={4} className="m-0 text-blue-600">
            {collapsed ? "PP" : "Page Probe"}
          </Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          className="border-r-0"
          onSelect={({ key }) => handleMenuItemHover(key)}
          onMouseEnter={(e) => {
            const target = e.target as HTMLElement;
            const menuItem = target.closest("[data-menu-id]") as HTMLElement;
            if (menuItem) {
              const key = menuItem.getAttribute("data-menu-id");
              if (key) {
                handleMenuItemHover(key);
              }
            }
          }}
        />
      </Sider>

      {/* 主内容区域 */}
      <AntLayout
        style={{
          marginLeft: collapsed ? 80 : 200,
          transition: "margin-left 0.2s",
        }}
      >
        {/* 固定头部 */}
        <Header
          className="fixed top-0 right-0 z-10 bg-white shadow-lg border-b border-gray-200 flex items-center justify-between px-6"
          style={{
            left: collapsed ? 80 : 200,
            transition: "left 0.2s",
            height: 64,
          }}
        >
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="text-gray-600 hover:text-blue-600"
            />
            <Title
              level={4}
              className="m-0 text-gray-800"
              style={{ margin: 0 }}
            >
              落地页监控系统
            </Title>
          </div>
        </Header>

        {/* 可滚动内容区域 */}
        <Content
          className="overflow-auto bg-gray-50"
          style={{
            marginTop: 64, // 头部高度
            height: "calc(100vh - 64px)", // 减去头部高度
            padding: "24px",
          }}
        >
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
