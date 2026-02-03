"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"
import { useProjectStore } from "@/store/useProjectStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

export default function NewProjectPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { addProject } = useProjectStore()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    task_prompt: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session?.user?.id) {
      setError("請先登入")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const project = await apiClient.createProject(formData, Number(session.user.id))
      addProject(project)

      router.push(`/projects/${project.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "建立專案失敗")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">建立新專案</CardTitle>
            <CardDescription>
              描述你的需求，AI 將為你自動生成程式碼並部署
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  專案名稱 <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  placeholder="例如：個人部落格、電商網站..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  簡短描述
                </label>
                <Input
                  id="description"
                  placeholder="用一句話描述這個專案"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="task_prompt" className="text-sm font-medium">
                  詳細需求 <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="task_prompt"
                  placeholder="詳細描述你想要什麼功能、風格、技術棧等&#10;&#10;例如：&#10;- 建立一個部落格網站&#10;- 使用 Next.js 14 和 Tailwind CSS&#10;- 包含文章列表、詳情頁和關於頁面&#10;- 簡約的深色主題&#10;- 部署到 Vercel"
                  className="min-h-[200px]"
                  value={formData.task_prompt}
                  onChange={(e) => setFormData({ ...formData, task_prompt: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  💡 提示：描述越詳細，AI 生成的結果越符合你的需求
                </p>
              </div>

              <div className="flex gap-4">
                <Link href="/dashboard" className="flex-1">
                  <Button type="button" variant="outline" className="w-full" disabled={isSubmitting}>
                    取消
                  </Button>
                </Link>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      建立中...
                    </>
                  ) : (
                    "開始建立"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
