export type ProjectStatus = "pending" | "running" | "completed" | "failed" | "cancelled"

export interface Project {
  id: number
  owner_id: number
  name: string
  description?: string
  status: ProjectStatus
  task_prompt: string
  uploaded_files?: string
  result_summary?: string
  output_files?: string
  error_message?: string
  created_at: string
  started_at?: string
  completed_at?: string
  updated_at: string
}

export interface TaskLog {
  id: number
  project_id: number
  message: string
  log_type: "info" | "error" | "success" | "tool_use"
  created_at: string
}

export interface CreateProjectData {
  name: string
  description?: string
  task_prompt: string
}

export interface SSEMessage {
  type: "log" | "status" | "complete"
  log_id?: number
  message?: string
  log_type?: string
  timestamp?: string
  status?: ProjectStatus
  updated_at?: string
  result_summary?: string
  error_message?: string
}
