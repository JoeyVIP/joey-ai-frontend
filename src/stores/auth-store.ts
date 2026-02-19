import { create } from "zustand"
import { login as apiLogin, verifyToken } from "@/lib/api"
import type { UserInfo } from "@/types/project"

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  error: string
  user: UserInfo | null
  isSuperAdmin: boolean
  isCmsEnabled: boolean
  login: (username: string, password: string) => Promise<boolean>
  checkAuth: () => Promise<boolean>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  error: "",
  user: null,
  isSuperAdmin: false,
  isCmsEnabled: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: "" })
    try {
      const data = await apiLogin(username, password)
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      set({
        isAuthenticated: true,
        isLoading: false,
        user: data.user,
        isSuperAdmin: data.user.role === "super_admin",
        isCmsEnabled: data.user.is_cms_enabled,
      })
      return true
    } catch {
      set({ error: "帳號或密碼錯誤", isLoading: false })
      return false
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      set({ isAuthenticated: false, isLoading: false })
      return false
    }
    try {
      const res = await verifyToken()
      // 從 localStorage 還原完整用戶資訊
      const savedUser = localStorage.getItem("user")
      let user: UserInfo | null = null
      if (savedUser) {
        try {
          user = JSON.parse(savedUser)
        } catch {
          // ignore
        }
      }
      // 用 verify 回傳的最新角色資訊更新
      if (user) {
        user.role = res.role as UserInfo["role"]
        user.is_cms_enabled = res.is_cms_enabled
        user.plan_tier = res.plan_tier as UserInfo["plan_tier"]
      }
      set({
        isAuthenticated: true,
        isLoading: false,
        user,
        isSuperAdmin: res.role === "super_admin",
        isCmsEnabled: res.is_cms_enabled,
      })
      return true
    } catch {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      set({ isAuthenticated: false, isLoading: false, user: null })
      return false
    }
  },

  logout: () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    set({ isAuthenticated: false, user: null, isSuperAdmin: false, isCmsEnabled: false })
  },
}))
