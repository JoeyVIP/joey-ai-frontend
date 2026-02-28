"use client"

import { useState } from "react"
import type { Project, ProjectContent, BrandInfo, ProductService, FAQItem, ContactInfo } from "@/types/project"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import { DynamicCmsForm } from "./dynamic-cms-form"

interface ContentTabProps {
  project: Project
  onSave: (content: ProjectContent) => void
  onSaveCms?: (data: Record<string, unknown>) => void
  isRebuilding?: boolean
}

export function ContentTab({ project, onSave, onSaveCms, isRebuilding }: ContentTabProps) {
  // 有 cms_schema → 顯示動態表單
  if (project.cms_schema && project.cms_schema.sections.length > 0 && onSaveCms) {
    return (
      <DynamicCmsForm
        project={project}
        schema={project.cms_schema}
        onSave={onSaveCms}
        isRebuilding={isRebuilding}
      />
    )
  }

  // 無 cms_schema → 舊版 hardcoded 表單
  return <LegacyContentTab project={project} onSave={onSave} />
}

function LegacyContentTab({ project, onSave }: { project: Project; onSave: (content: ProjectContent) => void }) {
  const [content, setContent] = useState<ProjectContent>(
    project.content || {
      hero_headline: "",
      hero_subheadline: "",
      products_services: [],
      faq: [],
      additional_sections: {},
    }
  )

  const [brand, setBrand] = useState<BrandInfo>(
    project.content?.brand || {
      name: project.name,
      slogan: "",
      story: "",
      values: [],
      target_audience: "",
    }
  )

  const [contact, setContact] = useState<ContactInfo>(
    project.content?.contact || {
      phone: "",
      email: "",
      address: "",
      business_hours: "",
      google_maps_embed: "",
      social_links: {},
    }
  )

  const [products, setProducts] = useState<ProductService[]>(project.content?.products_services || [])
  const [faqItems, setFaqItems] = useState<FAQItem[]>(project.content?.faq || [])

  const handleSave = () => {
    onSave({
      ...content,
      brand,
      contact,
      products_services: products,
      faq: faqItems,
    })
  }

  return (
    <div className="space-y-6">
      {/* 品牌資訊 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">品牌資訊</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>品牌名稱</Label>
              <Input
                value={brand.name}
                onChange={(e) => setBrand({ ...brand, name: e.target.value })}
              />
            </div>
            <div>
              <Label>品牌標語</Label>
              <Input
                value={brand.slogan}
                onChange={(e) => setBrand({ ...brand, slogan: e.target.value })}
              />
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
        </CardContent>
      </Card>

      {/* Hero 區塊 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hero 區塊</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>大標題</Label>
            <Input
              value={content.hero_headline}
              onChange={(e) => setContent({ ...content, hero_headline: e.target.value })}
            />
          </div>
          <div>
            <Label>副標題</Label>
            <Input
              value={content.hero_subheadline}
              onChange={(e) => setContent({ ...content, hero_subheadline: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* 產品/服務 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">產品 / 服務</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setProducts([...products, { name: "", description: "", features: [], price: "", image_url: "" }])
              }
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              新增
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {products.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">尚未新增產品或服務</p>
          )}
          {products.map((item, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>名稱</Label>
                    <Input
                      value={item.name}
                      onChange={(e) => {
                        const updated = [...products]
                        updated[i] = { ...updated[i], name: e.target.value }
                        setProducts(updated)
                      }}
                      placeholder="產品或服務名稱"
                    />
                  </div>
                  <div>
                    <Label>價格</Label>
                    <Input
                      value={item.price}
                      onChange={(e) => {
                        const updated = [...products]
                        updated[i] = { ...updated[i], price: e.target.value }
                        setProducts(updated)
                      }}
                      placeholder="如 NT$1,200"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-5"
                  onClick={() => setProducts(products.filter((_, j) => j !== i))}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div>
                <Label>描述</Label>
                <Textarea
                  value={item.description}
                  onChange={(e) => {
                    const updated = [...products]
                    updated[i] = { ...updated[i], description: e.target.value }
                    setProducts(updated)
                  }}
                  rows={2}
                  placeholder="簡短描述此產品或服務"
                />
              </div>
              <div>
                <Label>特色（逗號分隔）</Label>
                <Input
                  value={item.features.join(", ")}
                  onChange={(e) => {
                    const updated = [...products]
                    updated[i] = {
                      ...updated[i],
                      features: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    }
                    setProducts(updated)
                  }}
                  placeholder="特色一, 特色二, 特色三"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">常見問題 (FAQ)</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFaqItems([...faqItems, { question: "", answer: "" }])}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              新增
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqItems.map((item, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <Label>問題 {i + 1}</Label>
                  <Input
                    value={item.question}
                    onChange={(e) => {
                      const updated = [...faqItems]
                      updated[i] = { ...updated[i], question: e.target.value }
                      setFaqItems(updated)
                    }}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-5"
                  onClick={() => setFaqItems(faqItems.filter((_, j) => j !== i))}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div>
                <Label>答案</Label>
                <Textarea
                  value={item.answer}
                  onChange={(e) => {
                    const updated = [...faqItems]
                    updated[i] = { ...updated[i], answer: e.target.value }
                    setFaqItems(updated)
                  }}
                  rows={2}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 聯絡資訊 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">聯絡資訊</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>電話</Label>
              <Input
                value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>地址</Label>
            <Input
              value={contact.address}
              onChange={(e) => setContact({ ...contact, address: e.target.value })}
            />
          </div>
          <div>
            <Label>營業時間</Label>
            <Input
              value={contact.business_hours}
              onChange={(e) => setContact({ ...contact, business_hours: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* 儲存按鈕 */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>儲存內容變更</Button>
      </div>
    </div>
  )
}
