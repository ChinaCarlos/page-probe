import React from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import Layout from "./components/Layout/Layout";
import { lazyImport } from "./utils/lazyImport";
import "./styles/global.scss";

// 使用懒加载的页面组件
const Dashboard = lazyImport(() => import("./pages/Dashboard/Dashboard"));
const Targets = lazyImport(() => import("./pages/Targets/Targets"));
const TargetDetail = lazyImport(
  () => import("./pages/TargetDetail/TargetDetail")
);
const Groups = lazyImport(() => import("./pages/Groups/Groups"));
const Tags = lazyImport(() => import("./pages/Tags/Tags"));
const Tasks = lazyImport(() => import("./pages/Tasks/Tasks"));
const TaskDetail = lazyImport(() => import("./pages/TaskDetail/TaskDetail"));
const Settings = lazyImport(() => import("./pages/Settings/Settings"));
const BlankScreenSettings = lazyImport(
  () => import("./pages/Settings/BlankScreenSettings")
);
const TaskSettings = lazyImport(() => import("./pages/Settings/TaskSettings"));

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/targets" element={<Targets />} />
          <Route path="/targets/:targetId" element={<TargetDetail />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/tags" element={<Tags />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route
            path="/settings/blank-screen"
            element={<BlankScreenSettings />}
          />
          <Route path="/settings/task" element={<TaskSettings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
