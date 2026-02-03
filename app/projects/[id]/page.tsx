"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { apiClient } from "@/lib/api"
import { useProjectStore } from "@/store/useProjectStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { TaskLog, SSEMessage } from "@/types/project"

const statusConfig = {
  pending: { label: "等待中", icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
  running: { label: "執行中", icon: Loader2, color: "text-blue-600", bg: "bg-blue-50" },
  completed: { label: "已完成", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
  failed: { label: "失敗", icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
  cancelled: { label: "已取消", icon: XCircle, color: "text-gray-600", bg: "bg-gray-50" },
}

export default function ProjectDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const projectId = Number(params?.id)

  const { currentProject, setCurrentProject, logs, setLogs, addLog, updateProject } = useProjectStore()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (projectId) {
      loadProject()
      loadLogs()
    }
  }, [session, projectId])

  useEffect(() => {
    if (!currentProject || currentProject.status === "completed" || currentProject.status === "failed") {
      return
    }

    // Connect to SSE stream
    const eventSource = apiClient.connectToProjectStream(projectId, )

    eventSource.onmessage = (event) => {
      try {
        const data: SSEMessage = JSON.parse(event.data)

        if (data.type === "log" && data.message) {
          const newLog: TaskLog = {
            id: data.log_id || Date.now(),
            project_id: projectId,
            message: data.message,
            log_type: (data.log_type as TaskLog["log_type"]) || "info",
            created_at: data.timestamp || new Date().toISOString(),
          }
          addLog(newLog)
        } else if (data.type === "status" && data.status) {
          updateProject(projectId, { status: data.status })
        } else if (data.type === "complete") {
          updateProject(projectId, {
            status: data.status!,
            result_summary: data.result_summary,
            error_message: data.error_message,
          })
          eventSource.close()
        }
      } catch (err) {
        console.error("SSE parsing error:", err)
      }
    }

    eventSource.onerror = (err) => {
      console.error("SSE error:", err)
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [currentProject, projectId, session])

  const loadProject = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const project = await apiClient.getProject(projectId, )
      setCurrentProject(project)
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入專案失敗")
    } finally {
      setIsLoading(false)
    }
  }

  const loadLogs = async () => {
    try {
      const projectLogs = await apiClient.getProjectLogs(projectId, )
      setLogs(projectLogs)
    } catch (err) {
      console.error("Failed to load logs:", err)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>錯誤</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error || "專案不存在"}</p>
            <Link href="/dashboard">
              <Button>返回儀表板</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const config = statusConfig[currentProject.status]
  const StatusIcon = config.icon

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Project Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="mb-2">{currentProject.name}</CardTitle>
                    <CardDescription>{currentProject.description || "無描述"}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`${config.bg} ${config.color} px-3 py-2 rounded-lg flex items-center gap-2`}>
                  <StatusIcon className={`h-5 w-5 ${currentProject.status === "running" ? "animate-spin" : ""}`} />
                  <span className="font-medium">{config.label}</span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">建立時間</span>
                    <span>{new Date(currentProject.created_at).toLocaleString("zh-TW")}</span>
                  </div>
                  {currentProject.started_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">開始時間</span>
                      <span>{new Date(currentProject.started_at).toLocaleString("zh-TW")}</span>
                    </div>
                  )}
                  {currentProject.completed_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">完成時間</span>
                      <span>{new Date(currentProject.completed_at).toLocaleString("zh-TW")}</span>
                    </div>
                  )}
                </div>

                {currentProject.status === "completed" && currentProject.result_summary && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">執行結果</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {currentProject.result_summary}
                    </p>
                  </div>
                )}

                {currentProject.status === "failed" && currentProject.error_message && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2 text-red-600">錯誤訊息</h4>
                    <p className="text-sm text-red-600 whitespace-pre-wrap">
                      {currentProject.error_message}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">任務需求</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {currentProject.task_prompt}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Logs */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-12rem)]">
              <CardHeader>
                <CardTitle>執行日誌</CardTitle>
                <CardDescription>即時顯示任務執行過程</CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100%-5rem)] overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    尚無日誌
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className={`p-3 rounded-lg text-sm ${
                          log.log_type === "error"
                            ? "bg-red-50 text-red-800 dark:bg-red-900/20"
                            : log.log_type === "success"
                            ? "bg-green-50 text-green-800 dark:bg-green-900/20"
                            : log.log_type === "tool_use"
                            ? "bg-blue-50 text-blue-800 dark:bg-blue-900/20"
                            : "bg-gray-50 text-gray-800 dark:bg-gray-800"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-muted-foreground shrink-0">
                            {new Date(log.created_at).toLocaleTimeString("zh-TW")}
                          </span>
                          <span className="flex-1">{log.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
