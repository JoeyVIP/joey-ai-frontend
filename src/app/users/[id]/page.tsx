"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { getUser, updateUser, deleteUser, listProjects } from "@/lib/api"
import type { UserInfo, Project } from "@/types/project"
import { TransferList, type TransferItem } from "@/components/transfer-list"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ArrowLeft, Save, Loader2, KeyRound, Trash2 } from "lucide-react"
import { toast } from "sonner"

export default function UserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  const { isAuthenticated, isSuperAdmin, checkAuth } = useAuthStore()

  const [user, setUser] = useState<UserInfo | null>(null)
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // 可編輯欄位
  const [displayName, setDisplayName] = useState("")
  const [role, setRole] = useState("client")
  const [planTier, setPlanTier] = useState("free")
  const [cmsEnabled, setCmsEnabled] = useState(false)
  const [assignedProjectIds, setAssignedProjectIds] = useState<string[]>([])

  // 密碼重設
  const [newPassword, setNewPassword] = useState("")
  const [isResettingPassword, setIsResettingPassword] = useState(false)

  // 刪除確認
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    checkAuth().then((ok) => {
      if (!ok) router.push("/")
    })
  }, [checkAuth, router])

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [userData, projectsData] = await Promise.all([
        getUser(userId),
        listProjects(),
      ])
      setUser(userData)
      setAllProjects(projectsData.projects)
      // 填入表單
      setDisplayName(userData.display_name)
      setRole(userData.role)
      setPlanTier(userData.plan_tier)
      setCmsEnabled(userData.is_cms_enabled)
      setAssignedProjectIds(userData.project_ids || [])
    } catch {
      toast.error("載入用戶資料失敗")
      router.push("/users")
    } finally {
      setIsLoading(false)
    }
  }, [userId, router])

  useEffect(() => {
    if (isAuthenticated && isSuperAdmin) {
      loadData()
    }
  }, [isAuthenticated, isSuperAdmin, loadData])

  // TransferList 資料
  const { availableItems, assignedItems } = useMemo(() => {
    const assignedSet = new Set(assignedProjectIds)
    const toItem = (p: Project): TransferItem => ({
      id: p.id,
      name: p.name,
      status: p.status,
      deploy_url: p.deploy_url,
    })
    return {
      availableItems: allProjects.filter((p) => !assignedSet.has(p.id)).map(toItem),
      assignedItems: allProjects.filter((p) => assignedSet.has(p.id)).map(toItem),
    }
  }, [allProjects, assignedProjectIds])

  const handleAssign = (ids: string[]) => {
    setAssignedProjectIds((prev) => [...prev, ...ids])
  }

  const handleUnassign = (ids: string[]) => {
    const removeSet = new Set(ids)
    setAssignedProjectIds((prev) => prev.filter((id) => !removeSet.has(id)))
  }

  const handleSave = async () => {
    if (!user) return
    try {
      setIsSaving(true)
      await updateUser(user.id, {
        display_name: displayName,
        role,
        plan_tier: planTier,
        is_cms_enabled: cmsEnabled,
        project_ids: assignedProjectIds,
      })
      toast.success("用戶資料已更新")
      loadData()
    } catch {
      toast.error("更新失敗")
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetPassword = async () => {
    if (!user || !newPassword) return
    try {
      setIsResettingPassword(true)
      await updateUser(user.id, { password: newPassword })
      toast.success("密碼已重設")
      setNewPassword("")
    } catch {
      toast.error("密碼重設失敗")
    } finally {
      setIsResettingPassword(false)
    }
  }

  const handleDelete = async () => {
    if (!user) return
    try {
      await deleteUser(user.id)
      toast.success(`用戶 ${user.username} 已刪除`)
      router.push("/users")
    } catch {
      toast.error("刪除失敗")
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">需要管理員權限</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center">
            <Button variant="ghost" size="sm" onClick={() => router.push("/users")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-5 w-40 bg-slate-200 animate-pulse rounded ml-3" />
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-white rounded-lg animate-pulse" />
          ))}
        </main>
      </div>
    )
  }

  if (!user) return null

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—"
    try {
      return new Date(dateStr).toLocaleString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push("/users")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <span className="font-bold">{user.display_name}</span>
              <span className="text-sm text-muted-foreground ml-2">@{user.username}</span>
            </div>
          </div>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            儲存變更
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Card 1: 基本資訊 */}
        <Card>
          <CardHeader>
            <CardTitle>基本資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">顯示名稱</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">帳號</label>
                <Input value={user.username} disabled className="bg-slate-50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">角色</label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">客戶</SelectItem>
                    <SelectItem value="super_admin">超級管理員</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">建立時間</label>
                <p className="text-sm text-muted-foreground pt-2">{formatDate(user.created_at)}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">最後登入</label>
                <p className="text-sm text-muted-foreground pt-2">{formatDate(user.last_login)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: 方案與權限 */}
        <Card>
          <CardHeader>
            <CardTitle>方案與權限</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">方案等級</label>
                <Select value={planTier} onValueChange={setPlanTier}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">CMS 功能</label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch checked={cmsEnabled} onCheckedChange={setCmsEnabled} />
                  <span className="text-sm">{cmsEnabled ? "已開通" : "未開通"}</span>
                </div>
              </div>
            </div>
            <div className="border-t pt-4">
              <label className="text-sm font-medium">重設密碼</label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  type="password"
                  placeholder="輸入新密碼"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="max-w-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetPassword}
                  disabled={!newPassword || isResettingPassword}
                >
                  {isResettingPassword ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <KeyRound className="h-4 w-4 mr-2" />
                  )}
                  重設密碼
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: 專案指派 */}
        <Card>
          <CardHeader>
            <CardTitle>專案指派</CardTitle>
            <CardDescription>管理此用戶可存取的專案</CardDescription>
          </CardHeader>
          <CardContent>
            <TransferList
              availableItems={availableItems}
              assignedItems={assignedItems}
              onAssign={handleAssign}
              onUnassign={handleUnassign}
            />
          </CardContent>
        </Card>

        {/* Card 4: 危險區域 */}
        {user.role !== "super_admin" && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">危險區域</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">刪除此用戶</p>
                  <p className="text-sm text-muted-foreground">此操作無法復原，所有關聯資料將被永久刪除。</p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  刪除用戶
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* 刪除確認 Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認刪除用戶</DialogTitle>
            <DialogDescription>
              確定要刪除用戶 <strong>{user.username}</strong>？此操作無法復原。
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              確認刪除
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
