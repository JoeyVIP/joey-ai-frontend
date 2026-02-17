"use client"

import Link from "next/link"
import type { Project } from "@/types/project"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Github } from "lucide-react"

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "啟用", variant: "default" },
  building: { label: "建置中", variant: "secondary" },
  revising: { label: "修正中", variant: "secondary" },
  completed: { label: "已完成", variant: "default" },
  failed: { label: "失敗", variant: "destructive" },
}

const sourceLabels: Record<string, string> = {
  line: "LINE",
  web: "Web",
  imported: "匯入",
}

const templateLabels: Record<string, string> = {
  manufacturing: "製造業",
  restaurant: "餐廳",
  brand: "品牌",
  corporate: "企業",
}

export function ProjectCard({ project }: { project: Project }) {
  const status = statusConfig[project.status] || statusConfig.active

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg leading-tight">{project.name}</CardTitle>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <div className="flex gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {sourceLabels[project.source] || project.source}
            </Badge>
            {project.industry_template && (
              <Badge variant="outline" className="text-xs">
                {templateLabels[project.industry_template] || project.industry_template}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {project.deploy_url && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="truncate">{project.deploy_url}</span>
            </div>
          )}
          {project.github_url && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Github className="h-3.5 w-3.5" />
              <span className="truncate">{project.github_url.replace("https://github.com/", "")}</span>
            </div>
          )}
          {project.created_at && (
            <p className="text-xs text-muted-foreground">
              建立於 {project.created_at.slice(0, 10)}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
