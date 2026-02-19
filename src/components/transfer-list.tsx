"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronRight, ChevronLeft, Search } from "lucide-react"

export interface TransferItem {
  id: string
  name: string
  status?: string
  deploy_url?: string
}

interface TransferListProps {
  availableItems: TransferItem[]
  assignedItems: TransferItem[]
  onAssign: (ids: string[]) => void
  onUnassign: (ids: string[]) => void
}

function statusLabel(status?: string) {
  switch (status) {
    case "completed":
      return <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">完成</Badge>
    case "active":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">進行中</Badge>
    case "building":
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 text-xs">建置中</Badge>
    case "failed":
      return <Badge variant="outline" className="bg-red-50 text-red-700 text-xs">失敗</Badge>
    default:
      return status ? <Badge variant="outline" className="text-xs">{status}</Badge> : null
  }
}

function PanelList({
  title,
  items,
  selectedIds,
  onToggle,
}: {
  title: string
  items: TransferItem[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
}) {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter((item) => item.name.toLowerCase().includes(q))
  }, [items, search])

  return (
    <div className="flex-1 border rounded-lg bg-white">
      <div className="px-3 py-2 border-b bg-slate-50 rounded-t-lg">
        <span className="text-sm font-medium">{title} ({items.length})</span>
      </div>
      <div className="p-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="搜尋..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>
      <ScrollArea className="h-[300px]">
        <div className="px-2 pb-2 space-y-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">無項目</p>
          ) : (
            filtered.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer"
              >
                <Checkbox
                  checked={selectedIds.has(item.id)}
                  onCheckedChange={() => onToggle(item.id)}
                />
                <span className="text-sm flex-1 truncate">{item.name}</span>
                {statusLabel(item.status)}
              </label>
            ))
          )}
        </div>
      </ScrollArea>
      <div className="px-3 py-1.5 border-t text-xs text-muted-foreground">
        已選 {selectedIds.size} 項
      </div>
    </div>
  )
}

export function TransferList({ availableItems, assignedItems, onAssign, onUnassign }: TransferListProps) {
  const [leftSelected, setLeftSelected] = useState<Set<string>>(new Set())
  const [rightSelected, setRightSelected] = useState<Set<string>>(new Set())

  const toggleLeft = (id: string) => {
    setLeftSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleRight = (id: string) => {
    setRightSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAssign = () => {
    onAssign(Array.from(leftSelected))
    setLeftSelected(new Set())
  }

  const handleUnassign = () => {
    onUnassign(Array.from(rightSelected))
    setRightSelected(new Set())
  }

  return (
    <div className="flex gap-3 items-stretch">
      <PanelList
        title="可用專案"
        items={availableItems}
        selectedIds={leftSelected}
        onToggle={toggleLeft}
      />
      <div className="flex flex-col justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleAssign}
          disabled={leftSelected.size === 0}
          className="px-2"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleUnassign}
          disabled={rightSelected.size === 0}
          className="px-2"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      <PanelList
        title="已指派"
        items={assignedItems}
        selectedIds={rightSelected}
        onToggle={toggleRight}
      />
    </div>
  )
}
