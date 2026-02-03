import { Project, CreateProjectData, TaskLog } from "@/types/project"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

class APIClient {
  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Projects
  async getProjects(userId: number): Promise<Project[]> {
    return this.fetch<Project[]>(`/api/projects?user_id=${userId}`)
  }

  async getProject(projectId: number, userId: number): Promise<Project> {
    return this.fetch<Project>(`/api/projects/${projectId}?user_id=${userId}`)
  }

  async createProject(
    data: CreateProjectData,
    userId: number
  ): Promise<Project> {
    return this.fetch<Project>(`/api/projects?user_id=${userId}`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateProject(
    projectId: number,
    updates: Partial<Project>,
    userId: number
  ): Promise<Project> {
    return this.fetch<Project>(
      `/api/projects/${projectId}?user_id=${userId}`,
      {
        method: "PATCH",
        body: JSON.stringify(updates),
      }
    )
  }

  async deleteProject(projectId: number, userId: number): Promise<void> {
    await this.fetch(`/api/projects/${projectId}?user_id=${userId}`, {
      method: "DELETE",
    })
  }

  async getProjectLogs(projectId: number, userId: number): Promise<TaskLog[]> {
    return this.fetch<TaskLog[]>(
      `/api/projects/${projectId}/logs?user_id=${userId}`
    )
  }

  // SSE Stream
  connectToProjectStream(
    projectId: number,
    userId: number
  ): EventSource {
    const url = `${API_URL}/api/projects/${projectId}/stream?user_id=${userId}`
    return new EventSource(url)
  }

  // File Upload
  async uploadFile(projectId: number, file: File): Promise<{ file_path: string }> {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(
      `${API_URL}/api/uploads/${projectId}`,
      {
        method: "POST",
        body: formData,
      }
    )

    if (!response.ok) {
      throw new Error("File upload failed")
    }

    return response.json()
  }
}

export const apiClient = new APIClient()
