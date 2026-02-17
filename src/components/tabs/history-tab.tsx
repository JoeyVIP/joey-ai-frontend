"use client"

import { useEffect, useState } from "react"
import type { Project } from "@/types/project"
import { listRevisions } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Clock } from "lucide-react"

interface Revision {
  id: string
  timestamp: string
  revision_notes: string
  success: boolean
  urls?: Record<string, string>
}

export function HistoryTab({ project }: { project: Project }) {
  const [revisions, setRevisions] = useState<Revision[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listRevisions(project.id)
      .then((data) => setRevisions(data.revisions))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [project.id])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">修正歷史</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground animate-pulse">載入中...</p>
            </div>
          ) : revisions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">尚無修正記錄</p>
              <p className="text-sm text-muted-foreground mt-2">送出修正後，每次變更都會記錄在這裡</p>
            </div>
          ) : (
            <div className="space-y-4">
              {revisions.map((rev) => (
                <div key={rev.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {rev.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm whitespace-pre-wrap">{rev.revision_notes}</p>
                        {rev.urls && Object.keys(rev.urls).length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {rev.urls.deploy_url && (
                              <a
                                href={rev.urls.deploy_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline"
                              >
                                查看部署
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={rev.success ? "default" : "destructive"} className="text-xs">
                        {rev.success ? "成功" : "失敗"}
                      </Badge>
                      {rev.timestamp && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {rev.timestamp.slice(0, 16).replace("T", " ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 專案時間線 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">專案時間線</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative pl-6 space-y-4">
            <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />

            {project.created_at && (
              <div className="relative flex items-center gap-3">
                <div className="absolute -left-4 w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
                <div className="flex-1">
                  <span className="text-sm font-medium">專案建立</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {project.created_at.slice(0, 10)}
                </Badge>
              </div>
            )}
            {project.github_url && (
              <div className="relative flex items-center gap-3">
                <div className="absolute -left-4 w-4 h-4 rounded-full bg-blue-500 border-2 border-white" />
                <div className="flex-1">
                  <span className="text-sm font-medium">GitHub 建立</span>
                  <p className="text-xs text-muted-foreground truncate">{project.github_url}</p>
                </div>
              </div>
            )}
            {project.deploy_url && (
              <div className="relative flex items-center gap-3">
                <div className="absolute -left-4 w-4 h-4 rounded-full bg-purple-500 border-2 border-white" />
                <div className="flex-1">
                  <span className="text-sm font-medium">網站部署</span>
                  <p className="text-xs text-muted-foreground truncate">{project.deploy_url}</p>
                </div>
              </div>
            )}
            {revisions.length > 0 && (
              <div className="relative flex items-center gap-3">
                <div className="absolute -left-4 w-4 h-4 rounded-full bg-orange-500 border-2 border-white" />
                <div className="flex-1">
                  <span className="text-sm font-medium">累計 {revisions.length} 次修正</span>
                  <p className="text-xs text-muted-foreground">
                    {revisions.filter((r) => r.success).length} 次成功，
                    {revisions.filter((r) => !r.success).length} 次失敗
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
