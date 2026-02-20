/**
 * Joey AI Pixel Office — PixiJS 辦公室可視化頁面
 *
 * 使用 claude-office 的 PixiJS 場景，透過 SSE 連接 Joey AI 後端。
 */

"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import {
  useGameStore,
  selectIsConnected,
  selectAgents,
  selectBoss,
  selectEventLog,
  selectQueueStatus,
} from "@/stores/game-store";
import { useSSEEvents, fetchDashboardOverview, fetchQueueStatus } from "@/hooks/useSSEEvents";
import { useShallow } from "zustand/react/shallow";
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  Activity,
  Users,
  Monitor,
  Zap,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { agentMachineService } from "@/machines/agentMachineService";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://backend-production-8a39.up.railway.app";

// 動態載入 OfficeGame（PixiJS 不能 SSR）
const OfficeGame = dynamic(
  () =>
    import("@/components/game/OfficeGame").then((m) => ({
      default: m.OfficeGame,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-slate-900 animate-pulse flex items-center justify-center text-white font-mono text-center">
        載入辦公室...
      </div>
    ),
  },
);

export default function OfficePage() {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [overview, setOverview] = useState<{
    total_projects: number;
    building_count: number;
    completed_today: number;
    worker_healthy: boolean;
  } | null>(null);

  // 認證
  useEffect(() => {
    checkAuth().then((ok) => {
      if (!ok) router.push("/");
    });
  }, [checkAuth, router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("token"));
    }
  }, [isAuthenticated]);

  // 連接 SSE
  useSSEEvents({ apiBase: API_BASE, token });

  // Store 選擇器
  const isConnected = useGameStore(selectIsConnected);
  const agents = useGameStore(useShallow(selectAgents));
  const boss = useGameStore(selectBoss);
  const eventLog = useGameStore(selectEventLog);
  const queueStatus = useGameStore(selectQueueStatus);

  // 載入 debug 設定
  const loadPersistedDebugSettings = useGameStore(
    (state) => state.loadPersistedDebugSettings,
  );
  useEffect(() => {
    loadPersistedDebugSettings();
  }, [loadPersistedDebugSettings]);

  // 取得 Dashboard 概覽 + Queue 狀態（定期更新）
  const loadOverview = useCallback(async () => {
    if (!token) return;
    const [overviewData, queueData] = await Promise.all([
      fetchDashboardOverview(API_BASE, token),
      fetchQueueStatus(API_BASE, token),
    ]);
    if (overviewData) setOverview(overviewData);
    if (queueData) useGameStore.getState().setQueueStatus(queueData);
  }, [token]);

  useEffect(() => {
    loadOverview();
    const interval = setInterval(loadOverview, 15000);
    return () => clearInterval(interval);
  }, [loadOverview]);

  // 全螢幕
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 載入中
  if (!isAuthenticated || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-pulse text-slate-400 font-mono">載入中...</div>
      </div>
    );
  }

  return (
    <main className="h-screen flex flex-col bg-neutral-950 overflow-hidden">
      {/* 頂部工具列 */}
      <header className="h-11 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:text-white h-7 px-2"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span className="text-xs">返回</span>
          </Button>
          <h1 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="text-orange-500">Joey AI</span>
            <span>Pixel Office</span>
          </h1>
        </div>

        {/* 狀態指示 */}
        <div className="flex items-center gap-4">
          {/* 連線狀態 */}
          <div
            className={`flex items-center gap-1.5 font-mono text-xs ${
              isConnected ? "text-emerald-400" : "text-rose-500"
            }`}
          >
            <Activity
              size={12}
              className={isConnected ? "animate-pulse" : ""}
            />
            {isConnected ? "CONNECTED" : "OFFLINE"}
          </div>

          {/* Worker 狀態 */}
          {overview && (
            <div
              className={`flex items-center gap-1.5 text-xs ${
                overview.worker_healthy ? "text-emerald-400" : "text-rose-500"
              }`}
            >
              <Monitor size={12} />
              Worker {overview.worker_healthy ? "ON" : "OFF"}
            </div>
          )}

          {/* Agent 數量 */}
          <div className="flex items-center gap-1.5 text-xs text-blue-400">
            <Users size={12} />
            {agents.size}
          </div>

          {/* 專案統計 */}
          {overview && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              <Zap size={12} />
              {overview.completed_today} 今日
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:text-white h-7 px-2"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </header>

      {/* 主內容：Canvas + 側面板 */}
      <div className="flex-grow flex overflow-hidden min-h-0">
        {/* PixiJS Canvas */}
        <div className="flex-grow border-r border-slate-800 overflow-hidden relative">
          <OfficeGame />
        </div>

        {/* 右側面板 */}
        <aside className="w-72 flex flex-col bg-slate-950 overflow-hidden shrink-0">
          {/* 概覽統計 */}
          {overview && (
            <div className="p-3 border-b border-slate-800">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-white">
                    {overview.total_projects}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                    總專案
                  </div>
                </div>
                <div className="bg-slate-900 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-emerald-400">
                    {overview.completed_today}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                    今日完成
                  </div>
                </div>
                <div className="bg-slate-900 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-amber-400">
                    {queueStatus.active_count + queueStatus.queue_count || overview.building_count}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                    建站中
                  </div>
                </div>
                <div className="bg-slate-900 rounded-lg p-2 text-center">
                  <div
                    className={`text-lg font-bold ${overview.worker_healthy ? "text-emerald-400" : "text-rose-500"}`}
                  >
                    {overview.worker_healthy ? "ON" : "OFF"}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Worker
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Boss 狀態 */}
          <div className="p-3 border-b border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">
                Boss
              </span>
              <span className="text-slate-600 text-[10px] font-mono ml-auto">
                {boss.backendState}
              </span>
            </div>
            {boss.currentTask && (
              <p className="text-slate-400 text-[11px] truncate">
                {boss.currentTask}
              </p>
            )}
            {boss.bubble.content && (
              <p className="text-blue-400 text-[11px] mt-1 truncate italic">
                &quot;{boss.bubble.content.text}&quot;
              </p>
            )}
          </div>

          {/* Agent 列表 */}
          <div className="flex-shrink-0 border-b border-slate-800">
            <div className="px-3 py-2 bg-slate-900 flex items-center gap-2">
              <Users size={12} className="text-blue-500" />
              <span className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                Agents
              </span>
              <span className="text-slate-600 text-[10px]">
                ({agents.size})
              </span>
            </div>
            <div className="max-h-40 overflow-y-auto p-2">
              {agents.size === 0 ? (
                <div className="text-center text-slate-600 text-xs italic py-3">
                  等待任務中...
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {Array.from(agents.values()).map((agent) => (
                    <div
                      key={agent.id}
                      className="px-2 py-1.5 bg-slate-900 rounded border border-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: agent.color }}
                        />
                        <span className="text-slate-300 font-bold text-[11px] truncate">
                          {agent.name}
                        </span>
                        <span className="text-slate-600 text-[10px] font-mono ml-auto shrink-0">
                          {agent.phase}
                        </span>
                      </div>
                      {agent.bubble.content && (
                        <p className="text-emerald-400 text-[10px] mt-1 truncate italic pl-4">
                          {agent.bubble.content.text}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 排隊狀態 */}
          {(queueStatus.active_count > 0 || queueStatus.queue_count > 0) && (
            <div className="flex-shrink-0 border-b border-slate-800">
              <div className="px-3 py-2 bg-slate-900 flex items-center gap-2">
                <Layers size={12} className="text-amber-500" />
                <span className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  Queue
                </span>
                <span className="text-slate-600 text-[10px]">
                  {queueStatus.active_count}/{queueStatus.max_concurrent} 執行中
                  {queueStatus.queue_count > 0 && (
                    <span className="text-amber-500 ml-1">
                      +{queueStatus.queue_count} 排隊
                    </span>
                  )}
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto p-2">
                <div className="flex flex-col gap-1">
                  {/* 執行中的任務 */}
                  {queueStatus.active.map((task) => (
                    <div
                      key={task.id}
                      className="px-2 py-1.5 bg-slate-900 rounded border border-emerald-900/50"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <span className="text-slate-300 font-bold text-[11px] truncate">
                          {task.name}
                        </span>
                        <span className="text-emerald-600 text-[9px] font-mono ml-auto shrink-0 uppercase">
                          {task.source}
                        </span>
                      </div>
                    </div>
                  ))}
                  {/* 排隊中的任務 */}
                  {queueStatus.queue.map((task) => (
                    <div
                      key={task.id}
                      className="px-2 py-1.5 bg-slate-900/50 rounded border border-amber-900/30"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-amber-500 font-bold text-[10px] shrink-0">
                          #{task.position}
                        </span>
                        <span className="text-slate-500 text-[11px] truncate">
                          {task.name}
                        </span>
                        <span className="text-amber-700 text-[9px] font-mono ml-auto shrink-0 uppercase">
                          {task.source}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 事件日誌 */}
          <div className="flex-grow flex flex-col overflow-hidden min-h-0">
            <div className="px-3 py-2 bg-slate-900 flex items-center gap-2 shrink-0">
              <Activity size={12} className="text-purple-500" />
              <span className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                Events
              </span>
              <span className="text-slate-600 text-[10px]">
                ({eventLog.length})
              </span>
            </div>
            <div className="flex-grow overflow-y-auto p-2">
              {eventLog.length === 0 ? (
                <div className="text-center text-slate-600 text-xs italic py-3">
                  等待事件...
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {eventLog.slice(0, 50).map((entry, i) => (
                    <div
                      key={`${entry.type}-${i}`}
                      className="text-[10px] py-1 border-b border-slate-900 last:border-0"
                    >
                      <span className="text-slate-600 font-mono mr-2">
                        {entry.timestamp.toLocaleTimeString("zh-TW", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                      <span
                        className={
                          entry.type === "error"
                            ? "text-rose-400"
                            : entry.type === "notification"
                              ? "text-emerald-400"
                              : entry.type === "session_start"
                                ? "text-blue-400"
                                : "text-slate-400"
                        }
                      >
                        {entry.summary}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
