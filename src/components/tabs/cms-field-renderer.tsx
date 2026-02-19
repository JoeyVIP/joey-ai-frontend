"use client"

import type { CmsFieldDef } from "@/types/project"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CmsRepeaterField } from "./cms-repeater-field"

interface CmsFieldRendererProps {
  field: CmsFieldDef
  value: unknown
  onChange: (value: unknown) => void
}

export function CmsFieldRenderer({ field, value, onChange }: CmsFieldRendererProps) {
  const renderField = () => {
    switch (field.type) {
      case "text":
      case "url":
      case "email":
      case "phone":
        return (
          <Input
            type={field.type === "text" ? "text" : field.type === "url" ? "url" : field.type === "email" ? "email" : "tel"}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        )

      case "number":
        return (
          <Input
            type="number"
            value={value != null ? String(value) : ""}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            placeholder={field.placeholder}
          />
        )

      case "textarea":
        return (
          <Textarea
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={3}
          />
        )

      case "image":
        return (
          <div className="space-y-2">
            <Input
              type="url"
              value={(value as string) ?? ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder || "圖片 URL"}
            />
            {typeof value === "string" && value.length > 0 && (
              <img
                src={value}
                alt={field.label}
                className="h-20 w-20 rounded-md object-cover border"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
              />
            )}
          </div>
        )

      case "boolean":
        return (
          <div className="flex items-center gap-2 pt-1">
            <Switch
              checked={!!value}
              onCheckedChange={(checked) => onChange(checked)}
            />
            <span className="text-sm text-muted-foreground">
              {value ? "啟用" : "停用"}
            </span>
          </div>
        )

      case "select":
        return (
          <Select
            value={(value as string) ?? ""}
            onValueChange={(v) => onChange(v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "請選擇"} />
            </SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "list":
        return (
          <Input
            value={Array.isArray(value) ? (value as string[]).join(", ") : (value as string) ?? ""}
            onChange={(e) =>
              onChange(
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
            placeholder={field.placeholder || "用逗號分隔"}
          />
        )

      case "repeater":
        return (
          <CmsRepeaterField
            field={field}
            items={Array.isArray(value) ? (value as Record<string, unknown>[]) : []}
            onChange={(items) => onChange(items)}
          />
        )

      case "group":
        if (!field.fields) return null
        return (
          <div className="border rounded-lg p-4 space-y-3">
            {field.fields.map((subField) => (
              <CmsFieldRenderer
                key={subField.key}
                field={subField}
                value={(value as Record<string, unknown>)?.[subField.key] ?? subField.default ?? null}
                onChange={(v) =>
                  onChange({
                    ...((value as Record<string, unknown>) ?? {}),
                    [subField.key]: v,
                  })
                }
              />
            ))}
          </div>
        )

      default:
        return <Input value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
    }
  }

  // boolean 和 repeater 的 label 處理不同
  if (field.type === "repeater") {
    return renderField()
  }

  return (
    <div className="space-y-1.5">
      <Label>
        {field.label}
        {field.required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {renderField()}
      {field.help_text && (
        <p className="text-xs text-muted-foreground">{field.help_text}</p>
      )}
    </div>
  )
}
