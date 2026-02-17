"use client"

import type { ProgressEvent } from "@/types/project"
import { Badge } from "@/components/ui/badge"

const stepIcons: Record<string, string> = {
  task_received: "📝",
  analyzing: "🔍",
  downloading_assets: "📥",
  creating_structure: "📁",
  building_pages: "🏗️",
  styling: "🎨",
  adding_scripts: "⚡",
  pushing_github: "📤",
  deploying_render: "🚀",
  verifying: "✅",
  completed: "🎉",
  failed: "❌",
  heartbeat: "💓",
}

export function ProgressTimeline({ events }: { events: ProgressEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        等待任務啟動...
      </div>
    )
  }

  const latestEvent = events[events.length - 1]
  const isFailed = latestEvent?.step === "failed"
  const isCompleted = latestEvent?.step === "completed"

  return (
    <div className="space-y-4">
      {/* 進度條 */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{latestEvent.message}</span>
          <span className="text-muted-foreground">{latestEvent.progress}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isFailed ? "bg-destructive" : isCompleted ? "bg-green-500" : "bg-primary"
            }`}
            style={{ width: `${latestEvent.progress}%` }}
          />
        </div>
      </div>

      {/* 時間線 */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {events
          .filter((e) => e.step !== "heartbeat")
          .map((event, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className="text-lg leading-none mt-0.5">
                {stepIcons[event.step] || "⏳"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{event.message}</p>
                {event.timestamp && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.timestamp).toLocaleTimeString("zh-TW")}
                  </p>
                )}
              </div>
              {event.step === "completed" && (
                <Badge variant="default">完成</Badge>
              )}
              {event.step === "failed" && (
                <Badge variant="destructive">失敗</Badge>
              )}
            </div>
          ))}
      </div>
    </div>
  )
}
