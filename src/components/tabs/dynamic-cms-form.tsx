"use client"

import { useState } from "react"
import type { Project, CmsSchema } from "@/types/project"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CmsFieldRenderer } from "./cms-field-renderer"
import { Loader2 } from "lucide-react"
import {
  FileText,
  Image,
  Store,
  Building2,
  Building,
  Phone,
  HelpCircle,
  UtensilsCrossed,
  Clock,
  CalendarCheck,
  Wrench,
  Award,
  Package,
  BarChart3,
  Sparkles,
  LayoutGrid,
  Quote,
  Share2,
  Briefcase,
  Users,
  Trophy,
} from "lucide-react"

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Image,
  Store,
  Building2,
  Building,
  Phone,
  HelpCircle,
  UtensilsCrossed,
  Clock,
  CalendarCheck,
  Wrench,
  Award,
  Package,
  BarChart3,
  Sparkles,
  LayoutGrid,
  Quote,
  Share2,
  Briefcase,
  Users,
  Trophy,
}

interface DynamicCmsFormProps {
  project: Project
  schema: CmsSchema
  onSave: (data: Record<string, unknown>) => void
  isRebuilding?: boolean
}

export function DynamicCmsForm({ project, schema, onSave, isRebuilding }: DynamicCmsFormProps) {
  const [data, setData] = useState<Record<string, unknown>>(
    (project.cms_data as Record<string, unknown>) ?? {}
  )

  const updateSection = (sectionKey: string, fieldKey: string, value: unknown) => {
    setData((prev) => ({
      ...prev,
      [sectionKey]: {
        ...((prev[sectionKey] as Record<string, unknown>) ?? {}),
        [fieldKey]: value,
      },
    }))
  }

  const handleSave = () => {
    onSave(data)
  }

  return (
    <div className="space-y-6">
      {schema.sections.map((section) => {
        const IconComponent = ICON_MAP[section.icon] ?? FileText
        const sectionData = (data[section.key] as Record<string, unknown>) ?? {}

        return (
          <Card key={section.key}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <IconComponent className="h-4 w-4" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const isWide = (t: string) =>
                  t === "textarea" || t === "repeater" || t === "group"
                const narrowFields = section.fields.filter((f) => !isWide(f.type))
                const wideFields = section.fields.filter((f) => isWide(f.type))

                return (
                  <>
                    {narrowFields.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {narrowFields.map((field) => (
                          <CmsFieldRenderer
                            key={field.key}
                            field={field}
                            value={sectionData[field.key] ?? field.default ?? null}
                            onChange={(v) => updateSection(section.key, field.key, v)}
                          />
                        ))}
                      </div>
                    )}
                    {wideFields.map((field) => (
                      <CmsFieldRenderer
                        key={field.key}
                        field={field}
                        value={sectionData[field.key] ?? field.default ?? null}
                        onChange={(v) => updateSection(section.key, field.key, v)}
                      />
                    ))}
                  </>
                )
              })()}
            </CardContent>
          </Card>
        )
      })}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isRebuilding}>
          {isRebuilding ? (
            <>
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              網站更新中...
            </>
          ) : (
            "儲存 CMS 內容"
          )}
        </Button>
      </div>
    </div>
  )
}
