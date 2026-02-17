"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { createProject, parseContent, buildProject, uploadAsset, uploadCatalog } from "@/lib/api"
import type {
  IndustryTemplate,
  ProjectContent,
  BrandInfo,
  DesignColors,
  DesignTypography,
  TechSettings,
  BackendType,
} from "@/types/project"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, ArrowRight, Wand2, Rocket, Upload, FileText, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"

const STEPS = ["上傳訪談", "基本資訊", "內容確認", "設計美學", "素材上傳", "技術設定", "確認送出"]

const templates: { id: IndustryTemplate; label: string; desc: string }[] = [
  { id: "manufacturing", label: "製造業", desc: "專業、規模感、冷色調" },
  { id: "restaurant", label: "餐廳", desc: "溫暖、氛圍感、暖色" },
  { id: "brand", label: "品牌", desc: "質感、獨特性" },
  { id: "corporate", label: "企業", desc: "穩重、信任感" },
]

const backendOptions: { id: BackendType; label: string; desc: string }[] = [
  { id: "none", label: "無後台", desc: "純靜態網站" },
  { id: "simple_cms", label: "簡易 CMS", desc: "基本內容管理" },
  { id: "full_backend", label: "完整後台", desc: "資料庫 + 管理面板" },
]

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

const BANNED_FONTS = ["Inter", "Roboto", "Arial", "Helvetica", "system-ui"]

export default function NewProjectPage() {
  const router = useRouter()
  const { checkAuth, isAuthenticated } = useAuthStore()
  const [step, setStep] = useState(0)
  const [isParsing, setIsParsing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Step 0-2: 基本資訊
  const [name, setName] = useState("")
  const [template, setTemplate] = useState<IndustryTemplate>("corporate")
  const [mdContent, setMdContent] = useState("")
  const [brand, setBrand] = useState<BrandInfo>({
    name: "",
    slogan: "",
    story: "",
    values: [],
    target_audience: "",
  })
  const [heroHeadline, setHeroHeadline] = useState("")
  const [heroSubheadline, setHeroSubheadline] = useState("")

  // Step 3: 設計美學
  const [colors, setColors] = useState<DesignColors>({
    primary: "#1a1a2e",
    secondary: "#16213e",
    cta: "#e94560",
    background: "#f5f5f5",
    text: "#1a1a1a",
    notes: "",
  })
  const [typography, setTypography] = useState<DesignTypography>({
    heading: "",
    body: "",
    mood: "",
    best_for: "",
    google_fonts_url: "",
    css_import: "",
  })

  // Step 4: 素材上傳
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [catalogFile, setCatalogFile] = useState<File | null>(null)

  // Step 5: 技術設定
  const [techSettings, setTechSettings] = useState<TechSettings>({
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
  })

  useEffect(() => {
    checkAuth().then((ok) => {
      if (!ok) router.push("/")
    })
  }, [checkAuth, router])

  const handleParseMd = async () => {
    if (!mdContent.trim()) return
    setIsParsing(true)
    try {
      const data = await parseContent(mdContent)
      if (data.brand) setBrand(data.brand)
      if (data.hero_headline) setHeroHeadline(data.hero_headline)
      if (data.hero_subheadline) setHeroSubheadline(data.hero_subheadline)
      if (data.industry_suggestion) {
        const valid: IndustryTemplate[] = ["manufacturing", "restaurant", "brand", "corporate"]
        if (valid.includes(data.industry_suggestion as IndustryTemplate)) {
          setTemplate(data.industry_suggestion as IndustryTemplate)
        }
      }
      if (data.brand?.name && !name) setName(data.brand.name)
      if (data.seo) {
        setTechSettings((prev) => ({ ...prev, seo: { ...prev.seo!, ...data.seo } }))
      }
      toast.success("AI 解析完成！")
      setStep(1)
    } catch {
      toast.error("AI 解析失敗")
    } finally {
      setIsParsing(false)
    }
  }

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    setImageFiles((prev) => [...prev, ...Array.from(files)])
  }, [])

  const handleCatalogSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setCatalogFile(file)
  }, [])

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("請輸入專案名稱")
      return
    }
    setIsCreating(true)
    try {
      const content: ProjectContent = {
        brand,
        hero_headline: heroHeadline,
        hero_subheadline: heroSubheadline,
        products_services: [],
        faq: [],
        additional_sections: {},
      }
      const project = await createProject({
        name,
        industry_template: template,
        content,
        design_system: {
          project_name: name,
          category: template,
          colors,
          typography,
          key_effects: "",
          anti_patterns: "",
        },
        tech_settings: techSettings,
      })

      // 上傳素材
      if (imageFiles.length > 0 || catalogFile) {
        toast.info("正在上傳素材...")
        for (const file of imageFiles) {
          await uploadAsset(project.id, file)
        }
        if (catalogFile) {
          await uploadCatalog(project.id, catalogFile)
        }
      }

      toast.success("專案已建立！")

      // 自動啟動建站
      await buildProject(project.id)
      router.push(`/projects/${project.id}`)
    } catch {
      toast.error("建立專案失敗")
    } finally {
      setIsCreating(false)
    }
  }

  const defaultFeatures = {
    contact_form: true,
    faq_section: true,
    google_maps: false,
    blog: false,
    social_feed: false,
    newsletter: false,
    live_chat: false,
    multilingual: false,
  }

  const toggleFeature = (key: string) => {
    const features = techSettings.features || defaultFeatures
    setTechSettings({
      ...techSettings,
      features: { ...features, [key]: !features[key as keyof typeof features] },
    })
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold">新建專案</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* 步驟指示器 */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <button
                onClick={() => setStep(i)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                  i === step
                    ? "bg-primary text-primary-foreground"
                    : i < step
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary text-muted-foreground"
                }`}
              >
                {s}
              </button>
              {i < STEPS.length - 1 && <div className="w-4 h-px bg-border mx-1" />}
            </div>
          ))}
        </div>

        {/* Step 0: 上傳訪談 MD */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>上傳訪談 MD</CardTitle>
              <CardDescription>貼上訪談紀錄，AI 會自動解析品牌資訊、產品、FAQ 等內容</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="貼上訪談 MD 內容，或描述網站需求..."
                value={mdContent}
                onChange={(e) => setMdContent(e.target.value)}
                rows={12}
              />
              <div className="flex gap-2">
                <Button onClick={handleParseMd} disabled={isParsing || !mdContent.trim()}>
                  <Wand2 className="h-4 w-4 mr-1.5" />
                  {isParsing ? "AI 解析中..." : "AI 智慧解析"}
                </Button>
                <Button variant="outline" onClick={() => setStep(1)}>
                  跳過，手動填寫
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: 基本資訊 */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>基本資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>專案名稱 *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="輸入專案名稱" />
              </div>
              <div>
                <Label>行業模板</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
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
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setStep(0)}>
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  上一步
                </Button>
                <Button onClick={() => setStep(2)} disabled={!name.trim()}>
                  下一步
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: 內容確認 */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>內容確認</CardTitle>
              <CardDescription>確認 AI 解析的內容，或手動修改</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>品牌名稱</Label>
                  <Input value={brand.name} onChange={(e) => setBrand({ ...brand, name: e.target.value })} />
                </div>
                <div>
                  <Label>品牌標語</Label>
                  <Input value={brand.slogan} onChange={(e) => setBrand({ ...brand, slogan: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>品牌故事</Label>
                <Textarea
                  value={brand.story}
                  onChange={(e) => setBrand({ ...brand, story: e.target.value })}
                  rows={4}
                />
              </div>
              <div>
                <Label>目標客群</Label>
                <Input
                  value={brand.target_audience}
                  onChange={(e) => setBrand({ ...brand, target_audience: e.target.value })}
                />
              </div>
              <div>
                <Label>Hero 大標題</Label>
                <Input value={heroHeadline} onChange={(e) => setHeroHeadline(e.target.value)} />
              </div>
              <div>
                <Label>Hero 副標題</Label>
                <Input value={heroSubheadline} onChange={(e) => setHeroSubheadline(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  上一步
                </Button>
                <Button onClick={() => setStep(3)}>
                  下一步
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: 設計美學 */}
        {step === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>配色方案</CardTitle>
                <CardDescription>選擇網站的 5 色配色，或使用預設方案</CardDescription>
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
                <div className="flex h-12 rounded-lg overflow-hidden mt-4">
                  <div className="flex-[6]" style={{ backgroundColor: colors.primary }} />
                  <div className="flex-[3]" style={{ backgroundColor: colors.secondary }} />
                  <div className="flex-1" style={{ backgroundColor: colors.cta }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">60-30-10 配色比例預覽</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>字體選擇</CardTitle>
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
                <div className="bg-destructive/10 rounded-lg p-3">
                  <p className="text-xs text-destructive font-medium">禁止使用以下字體：</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {BANNED_FONTS.map((f) => (
                      <Badge key={f} variant="destructive" className="text-xs">
                        {f}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                上一步
              </Button>
              <Button onClick={() => setStep(4)}>
                下一步
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: 素材上傳 */}
        {step === 4 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>圖片素材</CardTitle>
                <CardDescription>上傳 Logo、產品照片、公司環境照等</CardDescription>
              </CardHeader>
              <CardContent>
                {imageFiles.length === 0 ? (
                  <label className="block cursor-pointer">
                    <div className="text-center py-10 border-2 border-dashed rounded-lg hover:border-primary/50 transition-colors">
                      <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground">點擊或拖放上傳圖片</p>
                      <p className="text-xs text-muted-foreground mt-1">支援 JPG, PNG, GIF, WebP, SVG（最大 10MB）</p>
                    </div>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                  </label>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {imageFiles.map((file, i) => (
                        <div key={i} className="relative group border rounded-lg p-2">
                          <div className="aspect-square bg-secondary rounded flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <p className="text-xs truncate mt-1">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / (1024 * 1024)).toFixed(1)} MB
                          </p>
                          <button
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-white rounded-full p-1 shadow transition-opacity"
                            onClick={() => setImageFiles(imageFiles.filter((_, j) => j !== i))}
                          >
                            <span className="text-destructive text-xs">✕</span>
                          </button>
                        </div>
                      ))}
                    </div>
                    <label className="inline-block cursor-pointer">
                      <Button variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="h-3.5 w-3.5 mr-1.5" />
                          新增更多
                        </span>
                      </Button>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                    </label>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>產品目錄 PDF</CardTitle>
                <CardDescription>上傳產品目錄，AI 將自動解析產品清單</CardDescription>
              </CardHeader>
              <CardContent>
                {!catalogFile ? (
                  <label className="block cursor-pointer">
                    <div className="text-center py-10 border-2 border-dashed rounded-lg hover:border-primary/50 transition-colors">
                      <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground">點擊上傳產品目錄 PDF</p>
                      <p className="text-xs text-muted-foreground mt-1">最大 50MB</p>
                    </div>
                    <input type="file" accept=".pdf" className="hidden" onChange={handleCatalogSelect} />
                  </label>
                ) : (
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <FileText className="h-8 w-8 text-red-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{catalogFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(catalogFile.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setCatalogFile(null)}>
                      移除
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                上一步
              </Button>
              <Button onClick={() => setStep(5)}>
                下一步
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: 技術設定 */}
        {step === 5 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>後台能力</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {backendOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setTechSettings({ ...techSettings, backend_type: opt.id })}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        techSettings.backend_type === opt.id
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

            <Card>
              <CardHeader>
                <CardTitle>功能模組</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(featureLabels).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label className="text-sm">{label}</Label>
                      <Switch
                        checked={!!techSettings.features?.[key as keyof typeof techSettings.features]}
                        onCheckedChange={() => toggleFeature(key)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO 設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Meta Title</Label>
                  <Input
                    value={techSettings.seo?.meta_title || ""}
                    onChange={(e) =>
                      setTechSettings({ ...techSettings, seo: { ...techSettings.seo!, meta_title: e.target.value } })
                    }
                    placeholder={name || "網站標題"}
                  />
                </div>
                <div>
                  <Label>Meta Description</Label>
                  <Input
                    value={techSettings.seo?.meta_description || ""}
                    onChange={(e) =>
                      setTechSettings({
                        ...techSettings,
                        seo: { ...techSettings.seo!, meta_description: e.target.value },
                      })
                    }
                    placeholder="簡短描述網站內容"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>追蹤碼</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>GA4 ID</Label>
                    <Input
                      value={techSettings.tracking?.ga4_id || ""}
                      onChange={(e) =>
                        setTechSettings({
                          ...techSettings,
                          tracking: { ...techSettings.tracking!, ga4_id: e.target.value },
                        })
                      }
                      placeholder="G-XXXXXXXXXX"
                    />
                  </div>
                  <div>
                    <Label>FB Pixel ID</Label>
                    <Input
                      value={techSettings.tracking?.fb_pixel_id || ""}
                      onChange={(e) =>
                        setTechSettings({
                          ...techSettings,
                          tracking: { ...techSettings.tracking!, fb_pixel_id: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>GTM ID</Label>
                    <Input
                      value={techSettings.tracking?.gtm_id || ""}
                      onChange={(e) =>
                        setTechSettings({
                          ...techSettings,
                          tracking: { ...techSettings.tracking!, gtm_id: e.target.value },
                        })
                      }
                      placeholder="GTM-XXXXXXX"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ralph Loop 重試控制</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>啟用自動重試</Label>
                    <p className="text-xs text-muted-foreground">Agent 任務失敗時自動重試</p>
                  </div>
                  <Switch
                    checked={techSettings.ralph_loop?.enabled ?? true}
                    onCheckedChange={(checked) =>
                      setTechSettings({
                        ...techSettings,
                        ralph_loop: { ...techSettings.ralph_loop!, enabled: checked },
                      })
                    }
                  />
                </div>
                {techSettings.ralph_loop?.enabled && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>最大重試次數</Label>
                        <Badge variant="outline">{techSettings.ralph_loop?.max_retries || 3}</Badge>
                      </div>
                      <Slider
                        value={[techSettings.ralph_loop?.max_retries || 3]}
                        onValueChange={([v]) =>
                          setTechSettings({
                            ...techSettings,
                            ralph_loop: { ...techSettings.ralph_loop!, max_retries: v },
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
                          {Math.round((techSettings.ralph_loop?.timeout_seconds || 2700) / 60)} 分
                        </Badge>
                      </div>
                      <Slider
                        value={[(techSettings.ralph_loop?.timeout_seconds || 2700) / 60]}
                        onValueChange={([v]) =>
                          setTechSettings({
                            ...techSettings,
                            ralph_loop: { ...techSettings.ralph_loop!, timeout_seconds: v * 60 },
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

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(4)}>
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                上一步
              </Button>
              <Button onClick={() => setStep(6)}>
                下一步
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 6: 確認送出 */}
        {step === 6 && (
          <Card>
            <CardHeader>
              <CardTitle>確認送出</CardTitle>
              <CardDescription>確認以下資訊後開始建站</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">專案名稱</Label>
                  <p className="font-medium">{name || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">行業模板</Label>
                  <Badge variant="outline">{templates.find((t) => t.id === template)?.label || template}</Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">品牌名稱</Label>
                  <p className="font-medium">{brand.name || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Hero 標題</Label>
                  <p className="font-medium">{heroHeadline || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">配色</Label>
                  <div className="flex gap-1 mt-1">
                    {[colors.primary, colors.secondary, colors.cta].map((c, i) => (
                      <div key={i} className="w-6 h-6 rounded border" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">字體</Label>
                  <p className="text-sm">{typography.heading || "未設定"} / {typography.body || "未設定"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">後台類型</Label>
                  <p className="text-sm">{backendOptions.find((o) => o.id === techSettings.backend_type)?.label}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">素材</Label>
                  <p className="text-sm">
                    {imageFiles.length} 張圖片{catalogFile ? " + 1 份 PDF" : ""}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setStep(5)}>
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  返回修改
                </Button>
                <Button onClick={handleCreate} disabled={isCreating || !name.trim()}>
                  <Rocket className="h-4 w-4 mr-1.5" />
                  {isCreating ? "建立中..." : "確認建站"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
