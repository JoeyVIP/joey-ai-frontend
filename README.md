# Joey AI Agent - Web Frontend

AI-powered project automation platform frontend built with Next.js 14.

## Features

- 🤖 GitHub OAuth Authentication
- 📊 Real-time project progress tracking (SSE)
- 🎨 Modern UI with Tailwind CSS and shadcn/ui
- 📱 Responsive design (Mobile-First)
- 🌐 Internationalization (Traditional Chinese)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **State Management**: Zustand
- **Authentication**: NextAuth.js v4
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running (see joey-ai-agent)

### Installation

1. Clone the repository

```bash
cd web-frontend
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

```
web-frontend/
├── app/                      # Next.js 14 App Router
│   ├── api/                  # API routes
│   │   └── auth/             # NextAuth endpoints
│   ├── dashboard/            # Dashboard page
│   ├── projects/             # Project pages
│   │   ├── new/              # Create project
│   │   └── [id]/             # Project detail
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Landing/login page
│   └── globals.css           # Global styles
├── components/
│   └── ui/                   # Reusable UI components
├── lib/                      # Utilities
│   ├── api.ts                # API client
│   ├── auth.ts               # NextAuth config
│   └── utils.ts              # Helpers
├── store/                    # Zustand stores
│   └── useProjectStore.ts
├── types/                    # TypeScript types
│   ├── next-auth.d.ts
│   └── project.ts
└── public/                   # Static assets
```

## Pages

### 1. Landing Page (`/`)
- GitHub OAuth login
- Feature highlights

### 2. Dashboard (`/dashboard`)
- List all user projects
- Project status indicators
- Create new project button

### 3. New Project (`/projects/new`)
- Project creation form
- Name, description, detailed requirements

### 4. Project Detail (`/projects/[id]`)
- Real-time progress monitoring (SSE)
- Execution logs
- Project status and results

## Deployment

### Render

The project is configured for Render deployment using Docker.

```bash
# Build Docker image
docker build -t joey-ai-frontend .

# Run container
docker run -p 3000:3000 joey-ai-frontend
```

### Environment Variables (Production)

Required environment variables for production:

- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXTAUTH_URL` - Frontend URL
- `NEXTAUTH_SECRET` - Secret key for NextAuth
- `GITHUB_CLIENT_ID` - GitHub OAuth Client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth Client Secret

## GitHub OAuth Setup

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Homepage URL: `http://localhost:3000` (development)
4. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
5. Copy Client ID and Client Secret to `.env.local`

## License

MIT License

## Author

Joey Liao
