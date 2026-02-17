"use client"

import { useState } from "react"
import type { Project, TechSettings, BackendType } from "@/types/project"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const backendOptions: { id: BackendType; label: string; desc: string }[] = [
  { id: "none", label: "無後台", desc: "純靜態網站" },
  { id: "simple_cms", label: "簡易 CMS", desc: "基本內容管理" },
  { id: "full_backend", label: "完整後台", desc: "資料庫 + 管理面板" },
]

interface TechTabProps {
  project: Project
  onSave: (settings: TechSettings) => void
}

export function TechTab({ project, onSave }: TechTabProps) {
  const [settings, setSettings] = useState<TechSettings>(
    project.tech_settings || {
      backend_type: "none",
      features: {
        contact_form: true,
        faq_section: true,
        google_maps: false,
        blog: false,
        social_feed: false,
        newsletter: false,
        live_chat: false,
        multilingual: false,
      },
      seo: { meta_title: "", meta_description: "", og_image_url: "", canonical_url: "" },
      tracking: { ga4_id: "", fb_pixel_id: "", gtm_id: "" },
      ralph_loop: { enabled: true, max_retries: 3, timeout_seconds: 2700 },
      pages: ["home", "about", "products", "contact"],
    }
  )

  const features = settings.features || {
    contact_form: true,
    faq_section: true,
    google_maps: false,
    blog: false,
    social_feed: false,
    newsletter: false,
    live_chat: false,
    multilingual: false,
  }

  const featureLabels: Record<string, string> = {
    contact_form: "聯絡表單",
    faq_section: "FAQ 區塊",
    google_maps: "Google Maps",
    blog: "部落格",
    social_feed: "社群動態",
    newsletter: "電子報",
    live_chat: "即時客服",
    multilingual: "多語系",
  }

  const toggleFeature = (key: string) => {
    setSettings({
      ...settings,
      features: { ...features, [key]: !features[key as keyof typeof features] },
    })
  }

  return (
    <div className="space-y-6">
      {/* 後台類型 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">後台能力</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {backendOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSettings({ ...settings, backend_type: opt.id })}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  settings.backend_type === opt.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <p className="font-medium text-sm">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 功能模組 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">功能模組</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(featureLabels).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <Label className="text-sm">{label}</Label>
                <Switch
                  checked={!!features[key as keyof typeof features]}
                  onCheckedChange={() => toggleFeature(key)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">SEO 設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Meta Title</Label>
            <Input
              value={settings.seo?.meta_title || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  seo: { ...settings.seo!, meta_title: e.target.value },
                })
              }
            />
          </div>
          <div>
            <Label>Meta Description</Label>
            <Input
              value={settings.seo?.meta_description || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  seo: { ...settings.seo!, meta_description: e.target.value },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 追蹤碼 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">追蹤碼</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>GA4 ID</Label>
              <Input
                value={settings.tracking?.ga4_id || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    tracking: { ...settings.tracking!, ga4_id: e.target.value },
                  })
                }
                placeholder="G-XXXXXXXXXX"
              />
            </div>
            <div>
              <Label>FB Pixel ID</Label>
              <Input
                value={settings.tracking?.fb_pixel_id || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    tracking: { ...settings.tracking!, fb_pixel_id: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label>GTM ID</Label>
              <Input
                value={settings.tracking?.gtm_id || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    tracking: { ...settings.tracking!, gtm_id: e.target.value },
                  })
                }
                placeholder="GTM-XXXXXXX"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ralph Loop */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ralph Loop 重試控制</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>啟用自動重試</Label>
              <p className="text-xs text-muted-foreground">Agent 任務失敗時自動重試</p>
            </div>
            <Switch
              checked={settings.ralph_loop?.enabled ?? true}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  ralph_loop: { ...settings.ralph_loop!, enabled: checked },
                })
              }
            />
          </div>
          {settings.ralph_loop?.enabled && (
            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between mb-2">
                  <Label>最大重試次數</Label>
                  <Badge variant="outline">{settings.ralph_loop?.max_retries || 3}</Badge>
                </div>
                <Slider
                  value={[settings.ralph_loop?.max_retries || 3]}
                  onValueChange={([v]) =>
                    setSettings({
                      ...settings,
                      ralph_loop: { ...settings.ralph_loop!, max_retries: v },
                    })
                  }
                  min={1}
                  max={5}
                  step={1}
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <Label>單次超時（分鐘）</Label>
                  <Badge variant="outline">
                    {Math.round((settings.ralph_loop?.timeout_seconds || 2700) / 60)} 分
                  </Badge>
                </div>
                <Slider
                  value={[(settings.ralph_loop?.timeout_seconds || 2700) / 60]}
                  onValueChange={([v]) =>
                    setSettings({
                      ...settings,
                      ralph_loop: { ...settings.ralph_loop!, timeout_seconds: v * 60 },
                    })
                  }
                  min={15}
                  max={90}
                  step={5}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => onSave(settings)}>儲存技術設定</Button>
      </div>
    </div>
  )
}
