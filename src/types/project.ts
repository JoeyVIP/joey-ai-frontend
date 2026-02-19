export type ProjectStatus = "active" | "building" | "revising" | "completed" | "failed"
export type ProjectSource = "line" | "web" | "imported"
export type BackendType = "none" | "simple_cms" | "full_backend"
export type IndustryTemplate = "manufacturing" | "restaurant" | "brand" | "corporate"

export interface BrandInfo {
  name: string
  slogan: string
  story: string
  values: string[]
  target_audience: string
}

export interface ProductService {
  name: string
  description: string
  features: string[]
  price: string
  image_url: string
}

export interface FAQItem {
  question: string
  answer: string
}

export interface ContactInfo {
  phone: string
  email: string
  address: string
  business_hours: string
  google_maps_embed: string
  social_links: Record<string, string>
}

export interface ProjectContent {
  brand?: BrandInfo
  hero_headline: string
  hero_subheadline: string
  products_services: ProductService[]
  faq: FAQItem[]
  contact?: ContactInfo
  additional_sections: Record<string, string>
}

export interface DesignColors {
  primary: string
  secondary: string
  cta: string
  background: string
  text: string
  notes: string
}

export interface DesignTypography {
  heading: string
  body: string
  mood: string
  best_for: string
  google_fonts_url: string
  css_import: string
}

export interface DesignStyle {
  name: string
  type: string
  effects: string
  keywords: string
  best_for: string
}

export interface DesignSystem {
  project_name: string
  category: string
  style?: DesignStyle
  colors?: DesignColors
  typography?: DesignTypography
  key_effects: string
  anti_patterns: string
}

export interface FeatureToggles {
  contact_form: boolean
  faq_section: boolean
  google_maps: boolean
  blog: boolean
  social_feed: boolean
  newsletter: boolean
  live_chat: boolean
  multilingual: boolean
}

export interface SEOSettings {
  meta_title: string
  meta_description: string
  og_image_url: string
  canonical_url: string
}

export interface TrackingSettings {
  ga4_id: string
  fb_pixel_id: string
  gtm_id: string
}

export interface RalphLoopSettings {
  enabled: boolean
  max_retries: number
  timeout_seconds: number
}

export interface TechSettings {
  backend_type: BackendType
  features?: FeatureToggles
  seo?: SEOSettings
  tracking?: TrackingSettings
  ralph_loop?: RalphLoopSettings
  pages: string[]
}

// ==================== CMS Schema ====================

export type CmsFieldType =
  | "text"
  | "textarea"
  | "number"
  | "url"
  | "email"
  | "phone"
  | "image"
  | "boolean"
  | "select"
  | "list"
  | "repeater"
  | "group"

export interface CmsFieldDef {
  key: string
  label: string
  type: CmsFieldType
  required?: boolean
  placeholder?: string
  help_text?: string
  default?: unknown
  options?: string[]       // select 用
  fields?: CmsFieldDef[]   // group/repeater 子欄位
}

export interface CmsSectionDef {
  key: string
  title: string
  icon: string  // lucide icon 名稱
  fields: CmsFieldDef[]
}

export interface CmsSchema {
  version: string
  sections: CmsSectionDef[]
}

export interface Project {
  id: string
  name: string
  status: ProjectStatus
  source: ProjectSource
  industry_template: IndustryTemplate
  github_url: string
  deploy_url: string
  deploy_platform: string
  content?: ProjectContent
  design_system?: DesignSystem
  tech_settings?: TechSettings
  cms_schema?: CmsSchema
  cms_data?: Record<string, unknown>
  assets: string[]
  catalogs: string[]
  created_at: string
  updated_at: string
  task_folder: string
}

export interface ProgressEvent {
  step: string
  message: string
  progress: number
  timestamp: string
  details?: Record<string, unknown>
}

// ==================== 多租戶用戶系統 ====================

export type UserRole = "super_admin" | "client"
export type PlanTier = "free" | "basic" | "advanced" | "enterprise"

export interface UserInfo {
  id: string
  username: string
  display_name: string
  role: UserRole
  project_ids: string[]
  plan_tier: PlanTier
  is_cms_enabled: boolean
  created_at: string
  last_login: string
}
