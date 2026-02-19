"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { useProjectStore } from "@/stores/project-store"
import { ProjectCard } from "@/components/project-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, LogOut, RefreshCw, Users, Shield } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, checkAuth, logout, user, isSuperAdmin } = useAuthStore()
  const { projects, isLoading, fetchProjects } = useProjectStore()

  useEffect(() => {
    checkAuth().then((ok) => {
      if (!ok) router.push("/")
    })
  }, [checkAuth, router])

  useEffect(() => {
    if (isAuthenticated) fetchProjects()
  }, [isAuthenticated, fetchProjects])

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">載入中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold">Joey AI Agent</h1>
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{user.display_name}</span>
                {isSuperAdmin ? (
                  <Badge variant="default" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    管理員
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    {user.plan_tier}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <Button variant="ghost" size="sm" onClick={() => router.push("/users")}>
                <Users className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => fetchProjects()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout()
                router.push("/")
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">專案儀表板</h2>
            <p className="text-muted-foreground mt-1">
              共 {projects.length} 個專案
            </p>
          </div>
          {isSuperAdmin && (
            <Button onClick={() => router.push("/projects/new")}>
              <Plus className="h-4 w-4 mr-2" />
              新建專案
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-white rounded-lg animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">
              {isSuperAdmin ? "尚無專案" : "尚未有指派的專案"}
            </p>
            {isSuperAdmin && (
              <Button onClick={() => router.push("/projects/new")}>
                <Plus className="h-4 w-4 mr-2" />
                建立第一個專案
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
