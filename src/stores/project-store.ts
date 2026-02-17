import { create } from "zustand"
import type { Project, ProgressEvent } from "@/types/project"
import { listProjects, getProject, streamProgress } from "@/lib/api"

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean
  error: string
  progressEvents: ProgressEvent[]

  fetchProjects: () => Promise<void>
  fetchProject: (id: string) => Promise<void>
  setCurrentProject: (project: Project | null) => void
  startProgressStream: (projectId: string) => () => void
  clearProgress: () => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: "",
  progressEvents: [],

  fetchProjects: async () => {
    set({ isLoading: true, error: "" })
    try {
      const data = await listProjects()
      set({ projects: data.projects, isLoading: false })
    } catch (err) {
      set({ error: "載入專案失敗", isLoading: false })
      console.error(err)
    }
  },

  fetchProject: async (id: string) => {
    set({ isLoading: true, error: "" })
    try {
      const project = await getProject(id)
      set({ currentProject: project, isLoading: false })
    } catch (err) {
      set({ error: "載入專案失敗", isLoading: false })
      console.error(err)
    }
  },

  setCurrentProject: (project) => set({ currentProject: project }),

  startProgressStream: (projectId: string) => {
    set({ progressEvents: [] })
    const source = streamProgress(projectId, (event) => {
      set((state) => ({
        progressEvents: [...state.progressEvents, event],
      }))
      // 完成時重新載入專案
      if (event.step === "completed" || event.step === "failed") {
        get().fetchProject(projectId)
      }
    })
    return () => source.close()
  },

  clearProgress: () => set({ progressEvents: [] }),
}))
