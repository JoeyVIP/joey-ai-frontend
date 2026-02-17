"use client"

import type { Project } from "@/types/project"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink, Github, Globe } from "lucide-react"

export function OverviewTab({ project }: { project: Project }) {
  return (
    <div className="space-y-6">
      {/* 狀態和連結 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">專案狀態</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">狀態</span>
              <Badge>{project.status}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">來源</span>
              <Badge variant="outline">{project.source}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">行業模板</span>
              <Badge variant="outline">{project.industry_template}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">建立時間</span>
              <span className="text-sm">{project.created_at?.slice(0, 10) || "-"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">部署資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.deploy_url ? (
              <a
                href={project.deploy_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:underline"
              >
                <Globe className="h-4 w-4" />
                {project.deploy_url}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">尚未部署</p>
            )}
            {project.github_url ? (
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:underline"
              >
                <Github className="h-4 w-4" />
                {project.github_url}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">尚無 GitHub repo</p>
            )}
            {project.deploy_platform && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">平台</span>
                <span className="text-sm">{project.deploy_platform}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 網站預覽 */}
      {project.deploy_url && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">網站預覽</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <a href={project.deploy_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  開啟網站
                </a>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden bg-white">
              <iframe
                src={project.deploy_url}
                className="w-full h-[500px]"
                title="網站預覽"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
