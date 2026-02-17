import axios from "axios"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://ai-agent.89115053.xyz"

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
})

// 自動附加 JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// 401 自動跳轉登入
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token")
      window.location.href = "/"
    }
    return Promise.reject(err)
  }
)

// ==================== Auth ====================

export async function login(password: string) {
  const res = await api.post("/api/auth/login", { password })
  return res.data as { token: string; expires_at: string }
}

export async function verifyToken() {
  const res = await api.get("/api/auth/verify")
  return res.data as { valid: boolean; user: string }
}

// ==================== Projects ====================

export async function listProjects() {
  const res = await api.get("/api/projects")
  return res.data as { projects: import("@/types/project").Project[]; total: number }
}

export async function getProject(id: string) {
  const res = await api.get(`/api/projects/${id}`)
  return res.data as import("@/types/project").Project
}

export async function createProject(data: Record<string, unknown>) {
  const res = await api.post("/api/projects", data)
  return res.data as import("@/types/project").Project
}

export async function updateProject(id: string, data: Record<string, unknown>) {
  const res = await api.put(`/api/projects/${id}`, data)
  return res.data as import("@/types/project").Project
}

export async function buildProject(id: string) {
  const res = await api.post(`/api/projects/${id}/build`)
  return res.data
}

export async function reviseProject(id: string, data: Record<string, unknown>) {
  const res = await api.post(`/api/projects/${id}/revise`, data)
  return res.data
}

// ==================== SSE Progress ====================

export function streamProgress(projectId: string, onEvent: (event: import("@/types/project").ProgressEvent) => void) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : ""
  const url = `${API_BASE}/api/projects/${projectId}/progress?token=${token}`
  const source = new EventSource(url)

  source.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data)
      onEvent(data)
    } catch {
      // heartbeat or invalid data
    }
  }

  source.onerror = () => {
    source.close()
  }

  return source
}

// ==================== Revisions & Assets ====================

export async function listRevisions(projectId: string) {
  const res = await api.get(`/api/projects/${projectId}/revisions`)
  return res.data as {
    revisions: Array<{
      id: string
      timestamp: string
      revision_notes: string
      success: boolean
      urls?: Record<string, string>
    }>
    total: number
  }
}

export async function listAssets(projectId: string) {
  const res = await api.get(`/api/projects/${projectId}/assets`)
  return res.data as {
    images: Array<{ filename: string; filepath: string; size: number }>
    catalogs: Array<{ filename: string; filepath: string; size: number }>
  }
}

// ==================== Parse ====================

export async function parseContent(content: string) {
  const res = await api.post("/api/parse-content", { content })
  return res.data
}

export async function parseCatalog(file: File) {
  const form = new FormData()
  form.append("file", file)
  const res = await api.post("/api/parse-catalog", form)
  return res.data
}

// ==================== Design ====================

export async function searchDesign(query: string, domain = "style", maxResults = 5) {
  const res = await api.post("/api/design/search", { query, domain, max_results: maxResults })
  return res.data
}

export async function generateDesignSystem(query: string, projectName: string) {
  const res = await api.post("/api/design/generate", { query, project_name: projectName })
  return res.data
}

// ==================== Upload ====================

export async function uploadAsset(projectId: string, file: File) {
  const form = new FormData()
  form.append("project_id", projectId)
  form.append("file", file)
  const res = await api.post("/api/upload/assets", form)
  return res.data
}

export async function uploadCatalog(projectId: string, file: File) {
  const form = new FormData()
  form.append("project_id", projectId)
  form.append("file", file)
  const res = await api.post("/api/upload/catalog", form)
  return res.data
}

export async function uploadMd(projectId: string, file: File) {
  const form = new FormData()
  form.append("project_id", projectId)
  form.append("file", file)
  const res = await api.post("/api/upload/md", form)
  return res.data
}

export default api
