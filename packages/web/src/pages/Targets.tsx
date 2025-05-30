import {
  EyeIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface MonitorTarget {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  createdAt: number;
  updatedAt?: number;
}

const Targets: React.FC = () => {
  const navigate = useNavigate();
  const [targets, setTargets] = useState<MonitorTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTarget, setNewTarget] = useState({
    name: "",
    url: "",
    enabled: true,
  });

  useEffect(() => {
    fetchTargets();
  }, []);

  const fetchTargets = async () => {
    try {
      const response = await fetch("/api/targets");
      const result = await response.json();
      if (response.ok && result.data) {
        setTargets(result.data);
      } else {
        console.error("获取监控目标失败:", result);
      }
    } catch (error) {
      console.error("获取监控目标失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const addTarget = async () => {
    if (!newTarget.name || !newTarget.url) {
      alert("请填写完整信息");
      return;
    }

    try {
      const response = await fetch("/api/targets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTarget),
      });

      const result = await response.json();
      if (response.ok) {
        setShowAddModal(false);
        setNewTarget({ name: "", url: "", enabled: true });
        fetchTargets();
        alert("监控目标已添加，系统正在进行初始监控...");
      } else {
        alert("添加失败: " + (result.error || "未知错误"));
      }
    } catch (error) {
      console.error("添加监控目标失败:", error);
      alert("添加失败: 网络错误");
    }
  };

  const deleteTarget = async (id: string) => {
    if (!confirm("确定要删除这个监控目标吗？")) {
      return;
    }

    try {
      const response = await fetch(`/api/targets/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTargets();
      } else {
        const result = await response.json();
        alert("删除失败: " + (result.error || "未知错误"));
      }
    } catch (error) {
      console.error("删除监控目标失败:", error);
      alert("删除失败: 网络错误");
    }
  };

  const toggleTarget = async (target: MonitorTarget) => {
    try {
      const response = await fetch(`/api/targets/${target.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...target,
          enabled: !target.enabled,
        }),
      });

      if (response.ok) {
        fetchTargets();
      } else {
        const result = await response.json();
        alert("更新失败: " + (result.error || "未知错误"));
      }
    } catch (error) {
      console.error("更新监控目标失败:", error);
      alert("更新失败: 网络错误");
    }
  };

  const monitorNow = async (target: MonitorTarget) => {
    try {
      const response = await fetch(`/api/targets/${target.id}/monitor`, {
        method: "POST",
      });

      const result = await response.json();
      if (response.ok) {
        alert("监控任务已启动，请稍后查看结果");
      } else {
        alert("启动监控失败: " + (result.error || "未知错误"));
      }
    } catch (error) {
      console.error("启动监控失败:", error);
      alert("启动监控失败: 网络错误");
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载监控目标中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">监控目标</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          添加目标
        </button>
      </div>

      {targets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">暂无监控目标</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            添加第一个目标
          </button>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {targets.map((target) => (
                <tr
                  key={target.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/targets/${target.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {target.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{target.url}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        target.enabled
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {target.enabled ? "启用" : "禁用"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTime(target.createdAt)}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => navigate(`/targets/${target.id}`)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="查看详情"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => monitorNow(target)}
                      className="text-green-600 hover:text-green-800 p-1"
                      title="立即监控"
                      disabled={!target.enabled}
                    >
                      <PlayIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleTarget(target)}
                      className={`p-1 ${
                        target.enabled
                          ? "text-yellow-600 hover:text-yellow-800"
                          : "text-green-600 hover:text-green-800"
                      }`}
                      title={target.enabled ? "禁用" : "启用"}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteTarget(target.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="删除"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 添加目标弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              添加监控目标
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  名称
                </label>
                <input
                  type="text"
                  value={newTarget.name}
                  onChange={(e) =>
                    setNewTarget({ ...newTarget, name: e.target.value })
                  }
                  className="mt-1 block w-full border rounded-lg px-3 py-2"
                  placeholder="例如：官网首页"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  URL
                </label>
                <input
                  type="url"
                  value={newTarget.url}
                  onChange={(e) =>
                    setNewTarget({ ...newTarget, url: e.target.value })
                  }
                  className="mt-1 block w-full border rounded-lg px-3 py-2"
                  placeholder="https://example.com"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newTarget.enabled}
                  onChange={(e) =>
                    setNewTarget({ ...newTarget, enabled: e.target.checked })
                  }
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">启用监控</label>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={addTarget}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                添加并开始监控
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Targets;
