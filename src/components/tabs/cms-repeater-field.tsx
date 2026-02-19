"use client"

import type { CmsFieldDef } from "@/types/project"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, GripVertical } from "lucide-react"
import { CmsFieldRenderer } from "./cms-field-renderer"

interface CmsRepeaterFieldProps {
  field: CmsFieldDef
  items: Record<string, unknown>[]
  onChange: (items: Record<string, unknown>[]) => void
}

export function CmsRepeaterField({ field, items, onChange }: CmsRepeaterFieldProps) {
  const subFields = field.fields ?? []

  const addItem = () => {
    const emptyItem: Record<string, unknown> = {}
    for (const f of subFields) {
      emptyItem[f.key] = f.default ?? (f.type === "boolean" ? false : f.type === "repeater" ? [] : "")
    }
    onChange([...items, emptyItem])
  }

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, key: string, value: unknown) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [key]: value }
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {field.label}
          {field.required && <span className="text-destructive ml-0.5">*</span>}
        </span>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          新增
        </Button>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-3 border border-dashed rounded-lg">
          尚未新增項目
        </p>
      )}

      {items.map((item, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-3 relative group">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <GripVertical className="h-3.5 w-3.5" />
              <span>#{index + 1}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 opacity-50 group-hover:opacity-100"
              onClick={() => removeItem(index)}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {subFields.map((subField) => {
              // repeater 子欄位需要全寬
              const isWide = subField.type === "textarea" || subField.type === "repeater" || subField.type === "group"
              return (
                <div key={subField.key} className={isWide ? "md:col-span-2" : ""}>
                  <CmsFieldRenderer
                    field={subField}
                    value={item[subField.key] ?? subField.default ?? null}
                    onChange={(v) => updateItem(index, subField.key, v)}
                  />
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
