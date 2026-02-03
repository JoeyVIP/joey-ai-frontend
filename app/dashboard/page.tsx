"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { apiClient } from "@/lib/api"
import { useProjectStore } from "@/store/useProjectStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react"

const statusConfig = {
  pending: {
    label: "等待中",
    icon: Clock,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  running: {
    label: "執行中",
    icon: Loader2,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  completed: {
    label: "已完成",
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  failed: {
    label: "失敗",
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  cancelled: {
    label: "已取消",
    icon: XCircle,
    color: "text-gray-600",
    bg: "bg-gray-50",
  },
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { projects, setProjects, setLoading, isLoading } = useProjectStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      loadProjects()
    }
  }, [status])

  const loadProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.getProjects()
      setProjects(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入專案失敗")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                我的專案
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                歡迎回來，{session?.user?.name}
              </p>
            </div>
            <Link href="/projects/new">
              <Button size="lg">
                <Plus className="mr-2 h-5 w-5" />
                新建專案
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-400 mb-4">
                <Plus className="h-16 w-16 mx-auto" />
              </div>
              <CardTitle className="mb-2">尚無專案</CardTitle>
              <CardDescription className="mb-6">
                開始建立你的第一個 AI 專案
              </CardDescription>
              <Link href="/projects/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  新建專案
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const config = statusConfig[project.status] || statusConfig.pending
              const StatusIcon = config.icon

              return (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg line-clamp-1">
                          {project.name}
                        </CardTitle>
                        <div className={`${config.bg} ${config.color} px-2 py-1 rounded-full flex items-center gap-1 text-xs`}>
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </div>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {project.description || "無描述"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-gray-500">
                        建立於 {new Date(project.created_at).toLocaleDateString("zh-TW")}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
