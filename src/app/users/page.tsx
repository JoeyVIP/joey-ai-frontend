"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { listUsers, listProjects, createUser, deleteUser } from "@/lib/api"
import type { UserInfo, Project } from "@/types/project"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Plus, Shield, User, Search, FolderOpen } from "lucide-react"
import { toast } from "sonner"

export default function UsersPage() {
  const router = useRouter()
  const { isAuthenticated, isSuperAdmin, checkAuth } = useAuthStore()
  const [users, setUsers] = useState<UserInfo[]>([])
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // 搜尋與篩選
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")

  // 建立用戶表單
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newDisplayName, setNewDisplayName] = useState("")
  const [newRole, setNewRole] = useState("client")
  const [newPlan, setNewPlan] = useState("free")
  const [newCms, setNewCms] = useState(false)
  const [newProjectIds, setNewProjectIds] = useState<string[]>([])

  useEffect(() => {
    checkAuth().then((ok) => {
      if (!ok) router.push("/")
    })
  }, [checkAuth, router])

  useEffect(() => {
    if (isAuthenticated && isSuperAdmin) {
      fetchData()
    }
  }, [isAuthenticated, isSuperAdmin])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [usersData, projectsData] = await Promise.all([
        listUsers(),
        listProjects(),
      ])
      setUsers(usersData.users)
      setAllProjects(projectsData.projects)
    } catch {
      toast.error("載入用戶列表失敗")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = useMemo(() => {
    let result = users
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (u) =>
          u.display_name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q)
      )
    }
    if (roleFilter !== "all") {
      result = result.filter((u) => u.role === roleFilter)
    }
    return result
  }, [users, searchQuery, roleFilter])

  const handleCreate = async () => {
    if (!newUsername || !newPassword) return
    try {
      await createUser({
        username: newUsername,
        password: newPassword,
        display_name: newDisplayName || newUsername,
        role: newRole,
        plan_tier: newPlan,
        is_cms_enabled: newCms,
        project_ids: newProjectIds,
      })
      toast.success(`用戶 ${newUsername} 建立成功`)
      setShowCreateDialog(false)
      resetCreateForm()
      fetchData()
    } catch {
      toast.error("建立用戶失敗")
    }
  }

  const resetCreateForm = () => {
    setNewUsername("")
    setNewPassword("")
    setNewDisplayName("")
    setNewRole("client")
    setNewPlan("free")
    setNewCms(false)
    setNewProjectIds([])
  }

  const toggleProjectId = (projectId: string) => {
    setNewProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    )
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ""
    try {
      const d = new Date(dateStr)
      return `${d.getMonth() + 1}/${d.getDate()}`
    } catch {
      return ""
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">需要管理員權限</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-bold">用戶管理</h1>
          </div>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新增用戶
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* 搜尋與篩選列 */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜尋用戶名稱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="所有角色" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有角色</SelectItem>
              <SelectItem value="client">客戶</SelectItem>
              <SelectItem value="super_admin">超級管理員</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {searchQuery || roleFilter !== "all" ? "沒有符合條件的用戶" : "尚無用戶"}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((u) => (
              <Card
                key={u.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/users/${u.id}`)}
              >
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                      {u.role === "super_admin" ? (
                        <Shield className="h-5 w-5 text-blue-600" />
                      ) : (
                        <User className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{u.display_name}</span>
                        <span className="text-sm text-muted-foreground">@{u.username}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={u.role === "super_admin" ? "default" : "secondary"}>
                          {u.role === "super_admin" ? "超級管理員" : "客戶"}
                        </Badge>
                        <Badge variant="outline">{u.plan_tier}</Badge>
                        {u.is_cms_enabled && <Badge className="bg-green-100 text-green-800">CMS</Badge>}
                        {u.project_ids && u.project_ids.length > 0 && (
                          <Badge variant="outline" className="gap-1">
                            <FolderOpen className="h-3 w-3" />
                            {u.project_ids.length} 個專案
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {u.last_login && (
                      <p>最後登入：{formatDate(u.last_login)}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* 建立用戶對話框 */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open)
        if (!open) resetCreateForm()
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新增用戶</DialogTitle>
            <DialogDescription>建立新的客戶帳號或管理員帳號。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="帳號"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
            <Input
              type="password"
              placeholder="密碼"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              placeholder="顯示名稱（選填）"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
            />
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">客戶</SelectItem>
                <SelectItem value="super_admin">超級管理員</SelectItem>
              </SelectContent>
            </Select>
            <Select value={newPlan} onValueChange={setNewPlan}>
              <SelectTrigger>
                <SelectValue placeholder="方案" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newCms}
                onChange={(e) => setNewCms(e.target.checked)}
                className="rounded"
              />
              開通 CMS 功能
            </label>

            {/* 專案指派區塊 */}
            {allProjects.length > 0 && (
              <>
                <div className="border-t pt-3">
                  <label className="text-sm font-medium">指派專案（選填）</label>
                  <ScrollArea className="h-[160px] mt-2 border rounded-md">
                    <div className="p-2 space-y-1">
                      {allProjects.map((p) => (
                        <label
                          key={p.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer"
                        >
                          <Checkbox
                            checked={newProjectIds.includes(p.id)}
                            onCheckedChange={() => toggleProjectId(p.id)}
                          />
                          <span className="text-sm truncate">{p.name}</span>
                        </label>
                      ))}
                    </div>
                  </ScrollArea>
                  {newProjectIds.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      已選 {newProjectIds.length} 個專案
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetCreateForm() }}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={!newUsername || !newPassword}>
              建立
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
