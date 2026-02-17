"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, error, login, checkAuth } = useAuthStore()
  const [password, setPassword] = useState("")

  useEffect(() => {
    checkAuth().then((ok) => {
      if (ok) router.push("/dashboard")
    })
  }, [checkAuth, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await login(password)
    if (ok) router.push("/dashboard")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">載入中...</div>
      </div>
    )
  }

  if (isAuthenticated) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Joey AI Agent</CardTitle>
          <CardDescription>AI 建站控制台</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="輸入管理密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading || !password}>
              {isLoading ? "驗證中..." : "登入"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
