# Joey AI Agent — 建站控制台前端

AI 建站服務的 Web 控制台，用於管理 LINE 自動建站專案和從瀏覽器新建/修正網站。

## 技術棧

- **Next.js 16** (App Router)
- **React 19** + TypeScript
- **shadcn/ui** + Tailwind CSS 4
- **Zustand** 狀態管理
- **Axios** HTTP 客戶端
- **React Hook Form** + **Zod** 表單驗證
- **Sonner** Toast 通知
- **Lucide React** 圖示

## 功能

### 儀表板
- 顯示所有專案（LINE 建站 + Web 新建）
- 專案卡片：名稱、狀態、部署 URL、GitHub URL、建立時間

### 專案管理（6 Tab）
- **總覽**：狀態資訊 + iframe 網站預覽
- **內容**：品牌資訊、Hero、產品/服務、FAQ、聯絡方式
- **設計**：行業模板（4 種）、風格搜尋、5 色配色編輯器、字體選擇
- **素材**：圖片上傳 + 產品目錄 PDF 上傳
- **技術**：後台能力、功能模組（8 項）、SEO、追蹤碼、Ralph Loop
- **歷史**：修正記錄 + 專案時間線

### 新建精靈（7 步）
0. 上傳訪談 MD → AI 智慧解析
1. 基本資訊 + 行業模板選擇
2. 內容確認（品牌/Hero）
3. 設計美學（配色 + 字體）
4. 素材上傳（圖片 + PDF）
5. 技術設定（後台/功能/SEO/追蹤碼/Ralph Loop）
6. 確認送出 → Agent 建站

## 環境變數

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://ai-agent.89115053.xyz
```

## 開發

```bash
npm install
npm run dev     # http://localhost:3000
```

## 部署

目前透過 Cloudflare Tunnel 部署在 Mac mini：

```bash
npm run build
npm start -- -p 3001   # Cloudflare Tunnel 對應 port 3001
```

- **正式環境**：https://89115053.xyz
- **GitHub**：https://github.com/JoeyVIP/joey-ai-frontend

## 專案結構

```
src/
├── app/
│   ├── page.tsx                    # 登入頁
│   ├── layout.tsx                  # 全域 Layout
│   ├── dashboard/page.tsx          # 儀表板
│   └── projects/
│       ├── [id]/page.tsx           # 專案詳情（6 Tab）
│       └── new/page.tsx            # 新建精靈（7 步）
├── components/
│   ├── ui/                         # shadcn/ui 元件
│   └── tabs/                       # 專案詳情的 6 個 Tab
│       ├── overview-tab.tsx
│       ├── content-tab.tsx
│       ├── design-tab.tsx
│       ├── assets-tab.tsx
│       ├── tech-tab.tsx
│       └── history-tab.tsx
├── lib/
│   ├── api.ts                      # API 客戶端（Axios + JWT）
│   └── utils.ts                    # 工具函數
├── stores/
│   └── project-store.ts            # Zustand 狀態
└── types/
    └── project.ts                  # TypeScript 型別定義
```
