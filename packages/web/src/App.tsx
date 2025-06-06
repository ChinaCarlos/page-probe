import React from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Dashboard from "./pages/Dashboard/Dashboard";
import Groups from "./pages/Groups/Groups";
import Tags from "./pages/Tags/Tags";
import Settings from "./pages/Settings/Settings";
import BlankScreenSettings from "./pages/Settings/BlankScreenSettings";
import TaskSettings from "./pages/Settings/TaskSettings";
import TargetDetail from "./pages/TargetDetail/TargetDetail";
import Targets from "./pages/Targets/Targets";
import Tasks from "./pages/Tasks/Tasks";
import TaskDetail from "./pages/TaskDetail/TaskDetail";
import "./styles/global.scss";

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
