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

  async getProjects(): Promise<Project[]> {
    return this.fetch<Project[]>("/api/projects")
  }

  async getProject(projectId: number): Promise<Project> {
    return this.fetch<Project>(`/api/projects/${projectId}`)
  }

  async createProject(data: CreateProjectData): Promise<Project> {
    return this.fetch<Project>("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getProjectLogs(projectId: number): Promise<TaskLog[]> {
    return this.fetch<TaskLog[]>(`/api/projects/${projectId}/logs`)
  }

  connectToProjectStream(projectId: number, userId?: number): EventSource {
    const url = `${API_URL}/api/projects/${projectId}/stream`
    return new EventSource(url)
  }
}

export const apiClient = new APIClient()
