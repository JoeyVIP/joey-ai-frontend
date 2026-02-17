"use client"

import { useState, useEffect, useCallback } from "react"
import type { Project } from "@/types/project"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Image as ImageIcon, Trash2 } from "lucide-react"
import { uploadAsset, uploadCatalog, listAssets } from "@/lib/api"
import { toast } from "sonner"

interface AssetsTabProps {
  project: Project
}

interface AssetFile {
  filename: string
  filepath: string
  size: number
}

export function AssetsTab({ project }: AssetsTabProps) {
  const [images, setImages] = useState<AssetFile[]>([])
  const [catalogs, setCatalogs] = useState<AssetFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  // 從後端載入已上傳的素材
  useEffect(() => {
    listAssets(project.id)
      .then((data) => {
        setImages(data.images)
        setCatalogs(data.catalogs)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [project.id])

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files) return
      setUploading(true)
      try {
        for (const file of Array.from(files)) {
          const result = await uploadAsset(project.id, file)
          setImages((prev) => [...prev, result])
        }
        toast.success("圖片上傳成功")
      } catch {
        toast.error("上傳失敗")
      } finally {
        setUploading(false)
        e.target.value = ""
      }
    },
    [project.id]
  )

  const handleCatalogUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      setUploading(true)
      try {
        const result = await uploadCatalog(project.id, file)
        setCatalogs((prev) => [...prev, result])
        toast.success("產品目錄上傳成功")
      } catch {
        toast.error("上傳失敗")
      } finally {
        setUploading(false)
        e.target.value = ""
      }
    },
    [project.id]
  )

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground animate-pulse">載入素材中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 圖片素材 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">圖片素材</CardTitle>
            <label>
              <Button variant="outline" size="sm" disabled={uploading} asChild>
                <span>
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  {uploading ? "上傳中..." : "上傳圖片"}
                </span>
              </Button>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <label className="block cursor-pointer">
              <div className="text-center py-8 border-2 border-dashed rounded-lg hover:border-primary/50 transition-colors">
                <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">拖放或點擊上傳圖片</p>
                <p className="text-xs text-muted-foreground mt-1">支援 JPG, PNG, GIF, WebP, SVG（最大 10MB）</p>
              </div>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            </label>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative group border rounded-lg p-2">
                  <div className="aspect-square bg-secondary rounded flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-xs truncate mt-1">{img.filename}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(img.size)}</p>
                  <button
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-white rounded-full p-1 shadow transition-opacity"
                    onClick={() => setImages(images.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 產品目錄 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">產品目錄</CardTitle>
            <label>
              <Button variant="outline" size="sm" disabled={uploading} asChild>
                <span>
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  上傳 PDF
                </span>
              </Button>
              <input type="file" accept=".pdf" className="hidden" onChange={handleCatalogUpload} />
            </label>
          </div>
        </CardHeader>
        <CardContent>
          {catalogs.length === 0 ? (
            <label className="block cursor-pointer">
              <div className="text-center py-8 border-2 border-dashed rounded-lg hover:border-primary/50 transition-colors">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">上傳產品目錄 PDF</p>
                <p className="text-xs text-muted-foreground mt-1">最大 50MB，AI 將自動解析產品清單</p>
              </div>
              <input type="file" accept=".pdf" className="hidden" onChange={handleCatalogUpload} />
            </label>
          ) : (
            <div className="space-y-3">
              {catalogs.map((cat, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                  <FileText className="h-8 w-8 text-red-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{cat.filename}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(cat.size)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCatalogs(catalogs.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
