# Atlas Board — Project Memory

## Project Overview
- **Repo:** atlas-board
- **Live:** https://atlas-board.vercel.app
- **Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Supabase (PostgreSQL + Auth), Vercel
- **Purpose:** Personal kanban board with per-user data isolation, priority/effort tagging, epics, categories, and filtering

## Architecture Quick Reference
- **State:** Single `useBoard` hook manages all board state (columns, cards, categories, epics)
- **API Layer:** `src/lib/board-actions.ts` — all Supabase CRUD operations
- **Auth:** Supabase Auth (GitHub OAuth + email/password), middleware refreshes sessions
- **DB:** 5 RLS-secured tables: boards, columns, categories, cards, epics
- **Components:** `src/components/board/` — BoardCard, BoardColumn, CardModal, EpicPanel, SettingsModal

## Known Issues (as of 2026-04-06)
1. Card `position` field is always 0 — never updated on reorder
2. Epic progress hardcodes "Done" column name match — breaks if column renamed
3. No undo/redo for destructive actions (delete card, etc.)
4. Context menu can render off-screen on small viewports
5. Limited ARIA labels on interactive elements (accessibility gap)
6. No offline support or local caching
7. Profile interface exists in types but no table/UI for it
8. Optimistic state updates have potential race conditions on rapid edits

## Atlas REST API (added 2026-06-09)
- **Base URL:** `https://atlas-board.vercel.app/api/atlas`
- **Auth:** `Authorization: Bearer <ATLAS_INTERNAL_API_KEY>`
- **ATLAS_INTERNAL_API_KEY:** `atl_q8ufEnPA9fH0yjCisPYdlgGbdWu7obMbQbVjq9Q8bWs`
- **Skill docs:** `docs/ATLAS_API_SKILL.md` in repo
- Key endpoints: GET /board, GET/POST /cards, PATCH /cards/:id, POST /cards/:id/move, POST /cards/:id/archive, GET/POST /epics, GET /columns, GET /categories
- Requires `SUPABASE_SERVICE_ROLE_KEY` set in Vercel env vars to function

## Session Log
- **2026-04-06:** Project created in Cowork. Full codebase audit completed. MEMORY.md and CLAUDE.md initialized.
- **2026-06-09:** Added blocked card indicators, Pomodoro timer, roadmap view, and full REST API under /api/atlas/*.
