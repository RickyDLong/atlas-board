# Atlas Board — Project Instructions

## Codebase Conventions

### Stack
- Next.js 16 with App Router (NOT Pages Router)
- TypeScript strict mode
- Tailwind CSS 4 (utility-first, no CSS modules)
- Supabase for DB + Auth
- React 19

### File Organization
```
src/app/          → Routes and pages (App Router conventions)
src/components/   → Reusable UI components
src/hooks/        → Custom React hooks
src/lib/          → Supabase clients and server actions
src/types/        → TypeScript interfaces and constants
src/constants/    → App-wide constants
supabase/         → Database migrations
```

### Naming
- Components: PascalCase (`BoardCard.tsx`)
- Hooks: camelCase with `use` prefix (`useBoard.ts`)
- Lib files: kebab-case (`board-actions.ts`)
- Types: PascalCase interfaces (`Card`, `Epic`, `Column`)

### State Management
- All board state lives in `useBoard` hook — do NOT create parallel state stores
- Supabase operations go through `src/lib/board-actions.ts` — do NOT call Supabase directly from components
- Optimistic updates: update local state first, then persist to Supabase

### Styling
- Dark theme only (background: #0a0a0f, #12121a, #1a1a26)
- Fonts: Space Grotesk (UI), JetBrains Mono (code/labels)
- Accent: #4a9eff (blue), #a855f7 (purple)
- Status colors: #f87171 (critical), #fb923c (high), #fbbf24 (medium), #34d399 (low)
- All styling via Tailwind classes — no inline styles, no CSS modules

### Database
- All tables use Row Level Security (RLS) — every new table MUST have RLS policies
- Foreign keys cascade on board deletion
- New migrations go in `supabase/migrations/` with sequential numbering

### Auth
- Supabase Auth handles sessions via middleware (`src/middleware.ts`)
- Protected routes: everything except `/`, `/auth/*`
- Never store auth tokens in localStorage — Supabase SSR handles this

### Testing & Quality
- Run `npm run build` before considering any feature complete
- Run `npm run lint` to check for issues
- No tests configured yet — when added, use Vitest

### Deployment
- Vercel auto-deploys from main branch
- Environment vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Do NOT commit `.env.local`

## Important: Read MEMORY.md
Always read `/MEMORY.md` at the root of this project before starting work. It contains known issues, session history, and project context.
