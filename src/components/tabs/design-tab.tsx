"use client"

import { useState } from "react"
import type { Project, DesignSystem, DesignColors, DesignTypography, IndustryTemplate } from "@/types/project"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wand2 } from "lucide-react"
import { generateDesignSystem, searchDesign } from "@/lib/api"

const templates: { id: IndustryTemplate; label: string; desc: string }[] = [
  { id: "manufacturing", label: "製造業", desc: "專業、規模感、冷色調" },
  { id: "restaurant", label: "餐廳", desc: "溫暖、氛圍感、暖色" },
  { id: "brand", label: "品牌", desc: "質感、獨特性" },
  { id: "corporate", label: "企業", desc: "穩重、信任感" },
]

interface DesignTabProps {
  project: Project
  onSave: (design: DesignSystem, template: IndustryTemplate) => void
}

export function DesignTab({ project, onSave }: DesignTabProps) {
  const [template, setTemplate] = useState<IndustryTemplate>(project.industry_template || "corporate")
  const [colors, setColors] = useState<DesignColors>(
    project.design_system?.colors || {
      primary: "#1a1a2e",
      secondary: "#16213e",
      cta: "#e94560",
      background: "#f5f5f5",
      text: "#1a1a1a",
      notes: "",
    }
  )
  const [typography, setTypography] = useState<DesignTypography>(
    project.design_system?.typography || {
      heading: "",
      body: "",
      mood: "",
      best_for: "",
      google_fonts_url: "",
      css_import: "",
    }
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{ raw: string }>>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    try {
      const data = await searchDesign(searchQuery, "style")
      setSearchResults(data.results || [])
    } catch (err) {
      console.error("搜尋失敗", err)
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const data = await generateDesignSystem(searchQuery || template, project.name)
      if (data.design_system?.colors) setColors(data.design_system.colors)
      if (data.design_system?.typography) setTypography(data.design_system.typography)
    } catch (err) {
      console.error("生成失敗", err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = () => {
    onSave(
      {
        project_name: project.name,
        category: template,
        colors,
        typography,
        key_effects: "",
        anti_patterns: "",
      },
      template
    )
  }

  return (
    <div className="space-y-6">
      {/* 行業模板選擇 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">行業模板</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  template === t.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <p className="font-medium text-sm">{t.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 風格探索器 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">風格探索</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="搜尋風格（英文關鍵字，如 modern minimal dark）"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button variant="outline" onClick={handleSearch}>
              搜尋
            </Button>
            <Button onClick={handleGenerate} disabled={isGenerating}>
              <Wand2 className="h-4 w-4 mr-1.5" />
              {isGenerating ? "生成中..." : "自動生成"}
            </Button>
          </div>
          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((r, i) => (
                <div key={i} className="p-3 bg-secondary/50 rounded-lg text-sm">
                  {r.raw}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 配色編輯器 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">配色方案</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {(["primary", "secondary", "cta", "background", "text"] as const).map((key) => (
              <div key={key} className="space-y-2">
                <Label className="text-xs capitalize">{key}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colors[key]}
                    onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer border"
                  />
                  <Input
                    value={colors[key]}
                    onChange={(e) => setColors({ ...colors, [key]: e.target.value })}
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            ))}
          </div>
          {/* 預覽色帶 */}
          <div className="flex h-12 rounded-lg overflow-hidden mt-4">
            <div className="flex-[6]" style={{ backgroundColor: colors.primary }} />
            <div className="flex-[3]" style={{ backgroundColor: colors.secondary }} />
            <div className="flex-1" style={{ backgroundColor: colors.cta }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">60-30-10 配色比例預覽</p>
        </CardContent>
      </Card>

      {/* 字體選擇 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">字體選擇</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>標題字體</Label>
              <Input
                value={typography.heading}
                onChange={(e) => setTypography({ ...typography, heading: e.target.value })}
                placeholder="如 Playfair Display"
              />
            </div>
            <div>
              <Label>內文字體</Label>
              <Input
                value={typography.body}
                onChange={(e) => setTypography({ ...typography, body: e.target.value })}
                placeholder="如 Source Sans Pro"
              />
            </div>
          </div>
          <div>
            <Label>Google Fonts URL</Label>
            <Input
              value={typography.google_fonts_url}
              onChange={(e) => setTypography({ ...typography, google_fonts_url: e.target.value })}
              placeholder="https://fonts.googleapis.com/css2?family=..."
            />
          </div>
          {/* 禁用字體提示 */}
          <div className="bg-destructive/10 rounded-lg p-3">
            <p className="text-xs text-destructive font-medium">禁止使用以下字體：</p>
            <div className="flex gap-2 mt-1 flex-wrap">
              {["Inter", "Roboto", "Arial", "Helvetica", "system-ui"].map((f) => (
                <Badge key={f} variant="destructive" className="text-xs">
                  {f}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 儲存按鈕 */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>儲存設計變更</Button>
      </div>
    </div>
  )
}
