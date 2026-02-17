import { create } from "zustand"
import { login as apiLogin, verifyToken } from "@/lib/api"

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  error: string
  login: (password: string) => Promise<boolean>
  checkAuth: () => Promise<boolean>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  error: "",

  login: async (password: string) => {
    set({ isLoading: true, error: "" })
    try {
      const data = await apiLogin(password)
      localStorage.setItem("token", data.token)
      set({ isAuthenticated: true, isLoading: false })
      return true
    } catch {
      set({ error: "密碼錯誤", isLoading: false })
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
      await verifyToken()
      set({ isAuthenticated: true, isLoading: false })
      return true
    } catch {
      localStorage.removeItem("token")
      set({ isAuthenticated: false, isLoading: false })
      return false
    }
  },

  logout: () => {
    localStorage.removeItem("token")
    set({ isAuthenticated: false })
  },
}))
