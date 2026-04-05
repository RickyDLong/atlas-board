# Atlas Board

A personal project management board built for speed and focus. Kanban-style columns, priority tagging, epic grouping, and category filtering — all in a dark, minimal UI.

**Live:** [atlas-board.vercel.app](https://atlas-board.vercel.app)

---

## What It Does

Atlas Board gives each authenticated user their own private Kanban board with:

- **Drag-and-drop columns** — Backlog, Up Next, In Progress, Review, Done (fully customizable)
- **Cards** with priority levels (Critical / High / Medium / Low), effort sizing (XS–XL), descriptions, and notes
- **Epics** — group related cards under a named epic with status tracking and target dates
- **Categories** — color-coded labels for organizing work across different areas
- **Collapsible filter bar** — filter by category, priority, or epic without visual clutter
- **Per-user data isolation** — every user gets their own board; no cross-user data visibility

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| Database | [Supabase](https://supabase.com) (PostgreSQL) |
| Auth | Supabase Auth (GitHub OAuth, Email/Password) |
| Hosting | [Vercel](https://vercel.com) |

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Landing page (server component, redirects if authenticated)
│   ├── layout.tsx            # Root layout with metadata and favicon config
│   ├── dashboard/
│   │   └── page.tsx          # Main Kanban board (client component)
│   └── auth/
│       ├── login/page.tsx    # Login with GitHub OAuth + email/password
│       ├── signup/page.tsx   # Account creation
│       └── callback/route.ts # OAuth callback handler
├── components/
│   ├── board/
│   │   ├── BoardColumn.tsx   # Column container with card list
│   │   ├── BoardCard.tsx     # Individual card component
│   │   ├── CardModal.tsx     # Card create/edit modal
│   │   ├── EpicPanel.tsx     # Epic management side panel
│   │   └── SettingsModal.tsx # Board settings (columns, categories)
│   └── AtlasLogo.tsx         # SVG logomark component
├── hooks/
│   └── useBoard.ts           # Client-side state management for board data
├── lib/
│   ├── board-actions.ts      # All Supabase CRUD operations
│   └── supabase/
│       ├── client.ts         # Browser Supabase client
│       ├── server.ts         # Server-side Supabase client
│       └── middleware.ts     # Session refresh middleware
├── types/
│   └── database.ts           # TypeScript interfaces, constants, defaults
supabase/
└── migrations/
    └── 001_initial_schema.sql # Full database schema with RLS policies
```

## Database

Five tables, all secured with Row Level Security:

- **boards** — one per user, owns everything below it
- **columns** — board stages (position-ordered)
- **categories** — color-coded labels
- **epics** — grouping mechanism with status lifecycle
- **cards** — the actual work items, linked to a column and optionally to a category and epic

Every table has RLS policies ensuring users can only access data belonging to their own boards. Child tables (columns, categories, epics, cards) enforce this through subqueries against the `boards` table.

## Auth Flow

1. User clicks "Continue with GitHub" (or signs up with email)
2. Supabase redirects to GitHub for OAuth consent
3. GitHub redirects back to Supabase's callback URL
4. Supabase exchanges the code for a session and redirects to `/auth/callback`
5. The callback route exchanges the auth code for a session cookie
6. User lands on `/dashboard` with their private board

New users automatically get a board with default columns (Backlog → Done) and starter categories.

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [GitHub OAuth App](https://github.com/settings/developers) (for social login)

### Setup

1. **Clone the repo**

```bash
git clone https://github.com/RickyDLong/atlas-board.git
cd atlas-board
npm install
```

2. **Create a Supabase project** and run the migration

Copy the contents of `supabase/migrations/001_initial_schema.sql` into your Supabase SQL Editor and execute it.

3. **Configure environment variables**

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. **Configure Supabase Auth**

- Go to Authentication → URL Configuration
- Set **Site URL** to your deployment URL (e.g., `https://atlas-board.vercel.app`)
- Add your callback URL to **Redirect URLs** (e.g., `https://your-domain.com/auth/callback`)
- Enable GitHub provider under Authentication → Providers with your OAuth app credentials

5. **Run locally**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deploy to Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com/new)
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables
4. Deploy

## License

MIT

---

Built by [Runeforge Labs](https://github.com/RickyDLong)
