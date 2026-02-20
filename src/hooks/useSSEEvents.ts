/**
 * SSE 事件轉接層
 *
 * 連接 Joey AI Agent 後端 SSE 端點（/api/dashboard/events），
 * 將 task_start / task_progress / task_complete / task_failed 事件
 * 轉換為 claude-office 的 gameStore 動作。
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { useGameStore } from "@/stores/game-store";
import { agentMachineService } from "@/machines/agentMachineService";
import {
  getNextSpawnPosition,
  getDeskPosition,
  resetSpawnIndex,
} from "@/systems/queuePositions";
import type { AgentState, BossState } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

/** Joey AI Agent SSE 事件格式 */
interface SSEEvent {
  type:
    | "task_start"
    | "task_progress"
    | "task_complete"
    | "task_failed"
    | "worker_status"
    | "queue_update"
    | "heartbeat";
  project_id?: string;
  name?: string;
  step?: string;
  message?: string;
  progress?: number;
  success?: boolean;
  error?: string;
  healthy?: boolean;
  latency_ms?: number;
  timestamp?: string;
  // queue_update 欄位
  max_concurrent?: number;
  active_count?: number;
  queue_count?: number;
  active?: Array<{ id: string; name: string; source: string; started_at: string }>;
  queue?: Array<{ id: string; name: string; source: string; position: number }>;
}

interface UseSSEEventsOptions {
  apiBase: string;
  token: string | null;
}

// Agent 顏色列表（為每個任務分配不同顏色）
const AGENT_COLORS = [
  "#3b82f6", // 藍
  "#22c55e", // 綠
  "#a855f7", // 紫
  "#f59e0b", // 橘
  "#ec4899", // 粉
  "#06b6d4", // 青
  "#ef4444", // 紅
  "#84cc16", // 黃綠
];

// ============================================================================
// 步驟翻譯對照（中文 → 氣泡文字）
// ============================================================================
function stepToBubbleText(step: string, message?: string): string {
  const stepMap: Record<string, string> = {
    task_received: "收到任務...",
    analyzing: "分析需求中...",
    building_pages: "建立頁面...",
    generating: "生成程式碼...",
    deploying: "部署中...",
    building: "建站中...",
    revising: "修改中...",
    completed: "完成！",
    failed: "遇到問題...",
  };
  return stepMap[step] || message || step || "工作中...";
}

// ============================================================================
// HOOK
// ============================================================================

export function useSSEEvents({ apiBase, token }: UseSSEEventsOptions): void {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 追蹤活動任務 → Agent 的映射
  const taskAgentMapRef = useRef<Map<string, string>>(new Map());
  const agentCounterRef = useRef(0);

  // Store actions
  const setConnected = useGameStore.getState().setConnected;
  const addEventLog = useGameStore.getState().addEventLog;
  const enqueueBubble = useGameStore.getState().enqueueBubble;

  // 建立或取得任務對應的 Agent
  const getOrCreateAgent = useCallback(
    (projectId: string, projectName?: string): string => {
      const existing = taskAgentMapRef.current.get(projectId);
      if (existing) return existing;

      // 建立新 Agent
      const agentId = `agent-${projectId}`;
      const agentNumber = agentCounterRef.current++;
      const color = AGENT_COLORS[agentNumber % AGENT_COLORS.length];
      const deskNumber = (agentNumber % 3) + 1;
      const spawnPosition = getNextSpawnPosition();

      const store = useGameStore.getState();

      // 加入 store
      store.addAgent(
        {
          id: agentId,
          name: projectName || `Task ${agentNumber + 1}`,
          color,
          number: agentNumber,
          state: "arriving" as AgentState,
          desk: deskNumber,
          position: spawnPosition,
        },
        spawnPosition,
      );

      // 啟動狀態機
      agentMachineService.spawnAgent(
        agentId,
        projectName || `Task ${agentNumber + 1}`,
        deskNumber,
        spawnPosition,
        {
          backendState: "arriving" as AgentState,
          skipArrival: false,
        },
      );

      taskAgentMapRef.current.set(projectId, agentId);
      return agentId;
    },
    [],
  );

  // 處理 SSE 事件
  const handleEvent = useCallback(
    (data: SSEEvent) => {
      const store = useGameStore.getState();
      const timestamp = data.timestamp || new Date().toISOString();

      switch (data.type) {
        case "task_start": {
          if (!data.project_id) break;

          // 建立 Agent（從電梯走進辦公室）
          const agentId = getOrCreateAgent(data.project_id, data.name);

          // 更新 Boss 狀態為接收中
          store.updateBossBackendState("receiving" as BossState);
          store.updateBossTask(data.name || data.project_id);

          // Boss 氣泡
          enqueueBubble("boss", {
            type: "speech",
            text: `新任務：${data.name || data.project_id}`,
          });

          // 事件日誌
          addEventLog({
            id: `evt-${Date.now()}`,
            type: "session_start",
            agentId,
            summary: `開始建站：${data.name || data.project_id}`,
            timestamp,
          });
          break;
        }

        case "task_progress": {
          if (!data.project_id) break;

          const agentId = taskAgentMapRef.current.get(data.project_id);
          if (!agentId) break;

          // 更新 Agent 狀態為工作中
          store.updateAgentBackendState(agentId, "working" as AgentState);
          store.setAgentTyping(agentId, true);

          // Agent 氣泡顯示步驟
          const bubbleText = stepToBubbleText(
            data.step || "",
            data.message,
          );
          enqueueBubble(agentId, {
            type: "thought",
            text: bubbleText,
          });

          // Boss 狀態跟著更新
          store.updateBossBackendState("working" as BossState);

          // 事件日誌
          addEventLog({
            id: `evt-${Date.now()}`,
            type: "pre_tool_use",
            agentId,
            summary: data.message || data.step || "進度更新",
            timestamp,
          });
          break;
        }

        case "task_complete": {
          if (!data.project_id) break;

          const agentId = taskAgentMapRef.current.get(data.project_id);
          if (!agentId) break;

          // Agent 完成
          store.updateAgentBackendState(agentId, "completed" as AgentState);
          store.setAgentTyping(agentId, false);

          // 完成氣泡
          enqueueBubble(agentId, {
            type: "speech",
            text: "完成！",
            icon: "check",
          });

          // Boss 收到報告
          store.updateBossBackendState("reviewing" as BossState);
          enqueueBubble("boss", {
            type: "speech",
            text: `${data.name || data.project_id} 建站完成！`,
          });

          // 觸發 Agent 離開
          setTimeout(() => {
            const currentAgent = useGameStore.getState().agents.get(agentId);
            if (currentAgent && currentAgent.phase === "idle") {
              agentMachineService.triggerDeparture(agentId);
            }
            taskAgentMapRef.current.delete(data.project_id!);
          }, 3000);

          // Boss 回到閒置
          setTimeout(() => {
            useGameStore.getState().updateBossBackendState("idle" as BossState);
          }, 5000);

          // 事件日誌
          addEventLog({
            id: `evt-${Date.now()}`,
            type: "notification",
            agentId,
            summary: `建站完成：${data.name || data.project_id}`,
            timestamp,
          });
          break;
        }

        case "task_failed": {
          if (!data.project_id) break;

          const agentId = taskAgentMapRef.current.get(data.project_id);
          if (!agentId) break;

          // Agent 失敗
          store.updateAgentBackendState(agentId, "completed" as AgentState);
          store.setAgentTyping(agentId, false);

          // 失敗氣泡
          enqueueBubble(agentId, {
            type: "thought",
            text: data.error || "建站失敗",
            icon: "error",
          });

          // Boss 反應
          enqueueBubble("boss", {
            type: "speech",
            text: `${data.name || data.project_id} 建站失敗`,
          });

          // 觸發離開
          setTimeout(() => {
            const currentAgent = useGameStore.getState().agents.get(agentId);
            if (currentAgent && currentAgent.phase === "idle") {
              agentMachineService.triggerDeparture(agentId);
            }
            taskAgentMapRef.current.delete(data.project_id!);
          }, 3000);

          // Boss 回到閒置
          setTimeout(() => {
            useGameStore.getState().updateBossBackendState("idle" as BossState);
          }, 5000);

          // 事件日誌
          addEventLog({
            id: `evt-${Date.now()}`,
            type: "error",
            agentId,
            summary: `建站失敗：${data.error || data.project_id}`,
            timestamp,
          });
          break;
        }

        case "queue_update": {
          // 更新排隊狀態
          store.setQueueStatus({
            max_concurrent: data.max_concurrent ?? 3,
            active_count: data.active_count ?? 0,
            queue_count: data.queue_count ?? 0,
            active: data.active ?? [],
            queue: data.queue ?? [],
          });
          break;
        }

        case "worker_status": {
          // 更新 Boss 狀態反映 Worker 健康度
          if (data.healthy) {
            store.updateBossBackendState("idle" as BossState);
          }
          break;
        }

        case "heartbeat":
          // 心跳，不需處理
          break;
      }
    },
    [getOrCreateAgent, enqueueBubble, addEventLog],
  );

  // 連接 SSE
  const connect = useCallback(() => {
    if (!token) return;

    // 關閉既有連線
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    const url = `${apiBase}/api/dashboard/events?token=${token}`;

    try {
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = () => {
        console.log("[SSE] 連線成功");
        setConnected(true);

        // 設定初始狀態
        const store = useGameStore.getState();
        store.setSessionId("joey-office");
        store.updateBossBackendState("idle" as BossState);
      };

      es.onmessage = (event) => {
        try {
          const data: SSEEvent = JSON.parse(event.data);
          handleEvent(data);
        } catch (err) {
          console.warn("[SSE] 解析失敗:", err);
        }
      };

      es.onerror = () => {
        console.warn("[SSE] 連線中斷，5 秒後重試...");
        setConnected(false);
        es.close();
        eventSourceRef.current = null;

        reconnectTimerRef.current = setTimeout(() => {
          reconnectTimerRef.current = null;
          connect();
        }, 5000);
      };
    } catch (err) {
      console.warn("[SSE] 無法建立連線:", err);
      setConnected(false);
    }
  }, [apiBase, token, handleEvent, setConnected]);

  // 主要 effect — 連接/斷開
  useEffect(() => {
    if (!token) return;

    // 重置狀態
    resetSpawnIndex();
    agentCounterRef.current = 0;
    taskAgentMapRef.current.clear();

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [token, connect]);
}

// ============================================================================
// 載入 Dashboard 概覽資料
// ============================================================================

export async function fetchDashboardOverview(
  apiBase: string,
  token: string,
): Promise<{
  total_projects: number;
  building_count: number;
  completed_today: number;
  worker_healthy: boolean;
} | null> {
  try {
    const res = await fetch(`${apiBase}/api/dashboard/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) return await res.json();
  } catch {
    // 靜默失敗
  }
  return null;
}

export async function fetchQueueStatus(
  apiBase: string,
  token: string,
): Promise<{
  max_concurrent: number;
  active_count: number;
  queue_count: number;
  active: Array<{ id: string; name: string; source: string; started_at: string }>;
  queue: Array<{ id: string; name: string; source: string; position: number }>;
} | null> {
  try {
    const res = await fetch(`${apiBase}/api/dashboard/queue`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) return await res.json();
  } catch {
    // 靜默失敗
  }
  return null;
}

export async function fetchActiveTasks(
  apiBase: string,
  token: string,
): Promise<
  Array<{
    project_id: string;
    name: string;
    step: string;
    progress: number;
  }>
> {
  try {
    const res = await fetch(`${apiBase}/api/dashboard/active-tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      return data.tasks || [];
    }
  } catch {
    // 靜默失敗
  }
  return [];
}
