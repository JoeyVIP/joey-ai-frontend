"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { getRebuildStatus, type RebuildStatus } from "@/lib/api"
import { toast } from "sonner"

const STEP_EMOJI: Record<string, string> = {
  pending: "\u23f3",
  cloning: "\ud83d\udce5",
  validating: "\ud83d\udd0d",
  updating: "\ud83d\udcdd",
  building: "\ud83c\udfd7\ufe0f",
  pushing: "\ud83d\ude80",
}

interface UseRebuildProgressOptions {
  projectId: string
  /** 每次 +1 觸發一次 rebuild polling（0 = 不觸發） */
  triggerKey: number
}

export function useRebuildProgress({ projectId, triggerKey }: UseRebuildProgressOptions) {
  const [isRebuilding, setIsRebuilding] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toastIdRef = useRef<string | number | null>(null)

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const poll = useCallback(async () => {
    try {
      const data: RebuildStatus = await getRebuildStatus(projectId)

      if (data.status === "idle") return

      const emoji = STEP_EMOJI[data.status] || "\u2699\ufe0f"
      const stepInfo = data.total_steps
        ? `\u6b65\u9a5f ${data.step}/${data.total_steps}`
        : ""
      const elapsed = data.elapsed_seconds != null ? `${data.elapsed_seconds}s` : ""
      const suffix = [stepInfo, elapsed].filter(Boolean).join(", ")
      const text = `${emoji} ${data.message || data.status}${suffix ? `  (${suffix})` : ""}`

      if (data.status === "completed") {
        if (toastIdRef.current) {
          toast.success(data.message || "\u7db2\u7ad9\u5df2\u66f4\u65b0\uff01", {
            id: toastIdRef.current,
            duration: 5000,
          })
        } else {
          toast.success(data.message || "\u7db2\u7ad9\u5df2\u66f4\u65b0\uff01", { duration: 5000 })
        }
        toastIdRef.current = null
        setIsRebuilding(false)
        stopPolling()
        return
      }

      if (data.status === "failed") {
        const errMsg = data.error ? `${data.message}: ${data.error}` : (data.message || "\u91cd\u5efa\u5931\u6557")
        if (toastIdRef.current) {
          toast.error(errMsg, { id: toastIdRef.current, duration: 6000 })
        } else {
          toast.error(errMsg, { duration: 6000 })
        }
        toastIdRef.current = null
        setIsRebuilding(false)
        stopPolling()
        return
      }

      // 進行中：更新 loading toast
      if (toastIdRef.current) {
        toast.loading(text, { id: toastIdRef.current })
      } else {
        toastIdRef.current = toast.loading(text)
      }
    } catch {
      // polling 失敗不中斷，靜默忽略
    }
  }, [projectId, stopPolling])

  useEffect(() => {
    if (triggerKey === 0) return

    // 清除前一次的 polling（若有）
    stopPolling()
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current)
      toastIdRef.current = null
    }

    setIsRebuilding(true)
    toastIdRef.current = toast.loading("\u23f3 \u6e96\u5099\u91cd\u5efa\u4e2d...")

    // 立即 poll 一次，然後每 2 秒
    poll()
    intervalRef.current = setInterval(poll, 2000)

    return () => {
      stopPolling()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerKey])

  return { isRebuilding }
}
