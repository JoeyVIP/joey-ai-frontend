"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { useProjectStore } from "@/stores/project-store"
import { updateProject, reviseProject, buildProject } from "@/lib/api"
import type { ProjectContent, DesignSystem, TechSettings, IndustryTemplate } from "@/types/project"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProgressTimeline } from "@/components/progress-timeline"
import { OverviewTab } from "@/components/tabs/overview-tab"
import { ContentTab } from "@/components/tabs/content-tab"
import { DesignTab } from "@/components/tabs/design-tab"
import { TechTab } from "@/components/tabs/tech-tab"
import { AssetsTab } from "@/components/tabs/assets-tab"
import { HistoryTab } from "@/components/tabs/history-tab"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Rocket, Wrench } from "lucide-react"
import { toast } from "sonner"

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const { checkAuth, isAuthenticated } = useAuthStore()
  const { currentProject, isLoading, progressEvents, fetchProject, startProgressStream, clearProgress } =
    useProjectStore()

  const [showReviseDialog, setShowReviseDialog] = useState(false)
  const [revisionNotes, setRevisionNotes] = useState("")
  const [showProgressDialog, setShowProgressDialog] = useState(false)

  useEffect(() => {
    checkAuth().then((ok) => {
      if (!ok) router.push("/")
    })
  }, [checkAuth, router])

  useEffect(() => {
    if (isAuthenticated && projectId) {
      fetchProject(projectId)
    }
  }, [isAuthenticated, projectId, fetchProject])

  const handleSaveContent = async (content: ProjectContent) => {
    try {
      await updateProject(projectId, { content })
      toast.success("內容已儲存")
      fetchProject(projectId)
    } catch {
      toast.error("儲存失敗")
    }
  }

  const handleSaveDesign = async (design: DesignSystem, template: IndustryTemplate) => {
    try {
      await updateProject(projectId, {
        design_system: design,
        industry_template: template,
      })
      toast.success("設計已儲存")
      fetchProject(projectId)
    } catch {
      toast.error("儲存失敗")
    }
  }

  const handleSaveTech = async (settings: TechSettings) => {
    try {
      await updateProject(projectId, { tech_settings: settings })
      toast.success("技術設定已儲存")
      fetchProject(projectId)
    } catch {
      toast.error("儲存失敗")
    }
  }

  const handleRevise = async () => {
    if (!revisionNotes.trim()) return
    try {
      await reviseProject(projectId, { revision_notes: revisionNotes })
      setShowReviseDialog(false)
      setRevisionNotes("")
      setShowProgressDialog(true)
      clearProgress()
      startProgressStream(projectId)
      toast.success("修正任務已啟動")
    } catch {
      toast.error("啟動修正失敗")
    }
  }

  const handleBuild = async () => {
    try {
      await buildProject(projectId)
      setShowProgressDialog(true)
      clearProgress()
      startProgressStream(projectId)
      toast.success("建站任務已啟動")
    } catch {
      toast.error("啟動建站失敗")
    }
  }

  if (isLoading || !currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">載入專案中...</div>
      </div>
    )
  }

  const project = currentProject

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-bold">{project.name}</h1>
            <Badge>{project.status}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {!project.deploy_url && project.source === "web" && (
              <Button size="sm" onClick={handleBuild}>
                <Rocket className="h-4 w-4 mr-1.5" />
                開始建站
              </Button>
            )}
            {project.deploy_url && (
              <Button size="sm" variant="outline" onClick={() => setShowReviseDialog(true)}>
                <Wrench className="h-4 w-4 mr-1.5" />
                送出修正
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">總覽</TabsTrigger>
            <TabsTrigger value="content">內容</TabsTrigger>
            <TabsTrigger value="design">設計</TabsTrigger>
            <TabsTrigger value="assets">素材</TabsTrigger>
            <TabsTrigger value="tech">技術</TabsTrigger>
            <TabsTrigger value="history">歷史</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab project={project} />
          </TabsContent>
          <TabsContent value="content">
            <ContentTab project={project} onSave={handleSaveContent} />
          </TabsContent>
          <TabsContent value="design">
            <DesignTab project={project} onSave={handleSaveDesign} />
          </TabsContent>
          <TabsContent value="assets">
            <AssetsTab project={project} />
          </TabsContent>
          <TabsContent value="tech">
            <TechTab project={project} onSave={handleSaveTech} />
          </TabsContent>
          <TabsContent value="history">
            <HistoryTab project={project} />
          </TabsContent>
        </Tabs>
      </main>

      {/* 修正確認對話框 */}
      <Dialog open={showReviseDialog} onOpenChange={setShowReviseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>送出修正</DialogTitle>
            <DialogDescription>
              描述你想修正的內容，Agent 會自動執行修改。
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="例如：把首頁配色改成深藍色系，字體改用 Playfair Display..."
            value={revisionNotes}
            onChange={(e) => setRevisionNotes(e.target.value)}
            rows={5}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowReviseDialog(false)}>
              取消
            </Button>
            <Button onClick={handleRevise} disabled={!revisionNotes.trim()}>
              <Wrench className="h-4 w-4 mr-1.5" />
              確認送出
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 進度監控對話框 */}
      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>任務執行中</DialogTitle>
          </DialogHeader>
          <ProgressTimeline events={progressEvents} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
