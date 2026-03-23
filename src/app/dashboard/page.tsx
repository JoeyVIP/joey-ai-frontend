"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { Project, ProjectStatus } from "@/types";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getProjects();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入專案失敗");
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus =
        statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  const getStatusBadge = (status: ProjectStatus) => {
    const badges = {
      [ProjectStatus.PENDING]: "bg-gray-100 text-gray-800",
      [ProjectStatus.RUNNING]: "bg-blue-100 text-blue-800 animate-pulse",
      [ProjectStatus.COMPLETED]: "bg-green-100 text-green-800",
      [ProjectStatus.FAILED]: "bg-red-100 text-red-800",
      [ProjectStatus.CANCELLED]: "bg-gray-100 text-gray-600",
    };

    const labels = {
      [ProjectStatus.PENDING]: "等待中",
      [ProjectStatus.RUNNING]: "執行中",
      [ProjectStatus.COMPLETED]: "已完成",
      [ProjectStatus.FAILED]: "失敗",
      [ProjectStatus.CANCELLED]: "已取消",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-TW");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 導航列 */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🤖</span>
              <span className="text-xl font-bold text-gray-900">
                Joey AI Agent
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/projects/new"
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                + 新建專案
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要內容 */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">專案管理</h1>
          <p className="text-gray-600">管理和監控您的所有網站專案</p>
        </div>

        {/* 統計卡片 */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-gray-600 text-sm mb-1">總專案數</div>
            <div className="text-3xl font-bold text-gray-900">
              {projects.length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-gray-600 text-sm mb-1">執行中</div>
            <div className="text-3xl font-bold text-blue-600">
              {
                projects.filter((p) => p.status === ProjectStatus.RUNNING)
                  .length
              }
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-gray-600 text-sm mb-1">已完成</div>
            <div className="text-3xl font-bold text-green-600">
              {
                projects.filter((p) => p.status === ProjectStatus.COMPLETED)
                  .length
              }
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-gray-600 text-sm mb-1">失敗</div>
            <div className="text-3xl font-bold text-red-600">
              {
                projects.filter((p) => p.status === ProjectStatus.FAILED)
                  .length
              }
            </div>
          </div>
        </div>

        {/* 專案列表 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">所有專案</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredProjects.length === projects.length
                    ? `共 ${projects.length} 個專案`
                    : `顯示 ${filteredProjects.length} / ${projects.length} 個專案`}
                </p>
              </div>
            </div>

            {/* 搜尋和篩選 */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <div className="relative flex-1">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="搜尋專案名稱…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:w-40"
              >
                <option value="all">所有狀態</option>
                <option value="pending">等待中</option>
                <option value="running">執行中</option>
                <option value="completed">已完成</option>
                <option value="failed">失敗</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
          </div>

          {loading && (
            <div className="p-12 text-center text-gray-500">載入中...</div>
          )}

          {error && (
            <div className="p-12 text-center text-red-600">{error}</div>
          )}

          {!loading && !error && projects.length === 0 && (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📁</div>
              <p className="text-gray-600 mb-4">尚無專案</p>
              <Link
                href="/projects/new"
                className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                建立第一個專案
              </Link>
            </div>
          )}

          {!loading && !error && projects.length > 0 && filteredProjects.length === 0 && (
            <div className="p-12 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-gray-600 mb-4">沒有符合條件的專案</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-sm font-medium"
              >
                清除篩選
              </button>
            </div>
          )}

          {!loading && !error && filteredProjects.length > 0 && (
            <div className="divide-y divide-gray-200">
              {filteredProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {project.name}
                    </h3>
                    {getStatusBadge(project.status)}
                  </div>
                  {project.description && (
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>建立於 {formatDate(project.created_at)}</span>
                    {project.completed_at && (
                      <span>完成於 {formatDate(project.completed_at)}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
