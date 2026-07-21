---
name: atlas-board
description: "Manage Ricky's personal Atlas Board kanban at atlas-board.vercel.app. Use this skill whenever the user wants to create tasks, move tasks between columns, update task details, check board status, or manage their kanban board in any way. Triggers on: 'update the board,' 'add a task,' 'move to done,' 'what's on my board,' 'create a card,' 'check my tasks,' 'mark as done,' 'board update,' 'atlas board,' 'kanban,' or any variation involving task/project management on the Atlas Board. Also use when the user says 'put this on my board,' 'track this,' or references task status changes. If the user mentions their board, tasks, or kanban — this is the skill."
---

# Atlas Board — REST API Skill

You are managing Ricky's personal kanban board at **https://atlas-board.vercel.app**.
All board actions are available via a private REST API — no browser automation needed.

---

## Authentication

Every request requires:
```
Authorization: Bearer <ATLAS_INTERNAL_API_KEY>
```

Read the API key from MEMORY.md in this workspace (look for `ATLAS_INTERNAL_API_KEY`).
If it is not there, ask Ricky to provide it or check Vercel environment variables.

This key is effectively a master credential: the routes authenticate the single
static token and then use the Supabase **service-role** client, which bypasses
row-level security and grants full read/write/delete on the whole board. Never
print it to chat output or commit it. MEMORY.md is gitignored — keep it that way.
If it ever leaks, rotate `ATLAS_INTERNAL_API_KEY` in Vercel and update MEMORY.md.

---

## Base URL

```
https://atlas-board.vercel.app/api/atlas
```

---

## Making API Calls

Use `curl` via the Bash tool for all requests. Always set the key in a shell variable and never print it to chat output:

```bash
KEY="<value from MEMORY.md>"

# GET
curl -s -H "Authorization: Bearer $KEY" \
  https://atlas-board.vercel.app/api/atlas/board

# POST / PATCH / DELETE
curl -s -X POST \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"My task","column":"In Progress","priority":"high"}' \
  https://atlas-board.vercel.app/api/atlas/cards
```

---

## Endpoints

### Board State

| Method | Path | Description |
|--------|------|-------------|
| GET | `/board` | Full board: columns, cards, epics, categories, relationships |

Response shape:
```json
{ "board_id": "...", "columns": [...], "cards": [...], "epics": [...], "categories": [...], "card_relationships": [...] }
```

---

### Cards

| Method | Path | Description |
|--------|------|-------------|
| GET | `/cards` | List active cards |
| GET | `/cards?archived=true` | List archived cards |
| GET | `/cards?column=In+Progress` | Filter by column title |
| GET | `/cards?epic=Atlas+Kanban+Site` | Filter by epic name |
| POST | `/cards` | Create a card |
| GET | `/cards/:id` | Fetch one card |
| PATCH | `/cards/:id` | Update card fields |
| DELETE | `/cards/:id` | Permanently delete |
| POST | `/cards/:id/move` | Move to a different column |
| POST | `/cards/:id/archive` | Archive (or unarchive) |

**POST /cards body:**
```json
{
  "title": "required",
  "description": "optional",
  "column": "In Progress",
  "epic": "Atlas Kanban Site",
  "category": "Career",
  "priority": "medium",
  "effort": "M",
  "notes": "optional",
  "due_date": "2026-07-15",
  "estimated_hours": 4
}
```
`column`, `epic`, and `category` are resolved by name (case-insensitive).
You can also pass `column_id`, `epic_id`, `category_id` as direct UUIDs if preferred.

**PATCH /cards/:id body** (any subset of these fields):
```json
{
  "title": "...", "description": "...", "priority": "high",
  "effort": "L", "notes": "...", "due_date": "2026-08-01",
  "epic_id": "<uuid>", "category_id": "<uuid>",
  "estimated_hours": 3, "actual_hours": 1.5
}
```

**POST /cards/:id/move body:**
```json
{ "column": "Done" }
```
Moving also stamps `column_changed_at`, and sets `conquered_at` when the target
column has `is_done = true` (cleared when the card moves back out) — matching the
board UI. Pass `column_id` instead of `column` to target a column by UUID.

**POST /cards/:id/archive body:**
```json
{}
```
To restore: `{ "unarchive": true }`

---

### Columns

| Method | Path | Description |
|--------|------|-------------|
| GET | `/columns` | List all columns with IDs, titles, positions, is_done flag |

---

### Epics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/epics` | List all epics |
| POST | `/epics` | Create an epic |
| PATCH | `/epics/:id` | Update an epic |
| DELETE | `/epics/:id` | Delete epic (unlinks cards) |

**POST /epics body:**
```json
{
  "name": "required",
  "description": "optional",
  "color": "#4a9eff",
  "status": "planning",
  "target_date": "2026-12-31"
}
```
`status` options: `planning` · `active` · `completed` · `archived`

---

### Categories

| Method | Path | Description |
|--------|------|-------------|
| GET | `/categories` | List all categories with IDs, labels, colors |

---

## Coverage

This API exposes only the board core: **board, cards, columns, categories, epics**.
The app has many features that have **no REST endpoints** and can only be changed
in the web UI: subtasks, labels, card comments, card relationships (read-only via
`/board` → `card_relationships`), attachments, card templates, saved filters,
recurring tasks, time tracking beyond `estimated_hours`/`actual_hours`, and the
entire gamification layer (XP, levels, badges, streaks, daily quests). If a
request needs one of those, say so — don't assume a missing endpoint is a bug.

Cards also carry fields the create/update endpoints don't accept (e.g.
`recurrence_rule`, `conquered_at`); they appear in GET responses but are managed
by the app, not this API.

## Board Reference

### Priority Values
`critical` · `high` · `medium` · `low`

### Effort Values
`XS` · `S` · `M` · `L` · `XL`

### Column Titles (default board)
`Backlog` · `Up Next` · `In Progress` · `Review` · `Done`

### Category Labels (default board)
`Side Projects` · `KDP / Publishing` · `Career` · `Life Admin`

> Always GET /board or /columns for the live list — these defaults may have changed.

---

## Workflow: Check Board Status

```bash
KEY="..."
curl -s -H "Authorization: Bearer $KEY" \
  https://atlas-board.vercel.app/api/atlas/board | python3 -c "
import json, sys
data = json.load(sys.stdin)
for col in data['columns']:
    cards = [c for c in data['cards'] if c['column_id'] == col['id']]
    print(f\"{col['title']} ({len(cards)})\")
    for c in cards:
        due = f\" · due {c['due_date']}\" if c.get('due_date') else ''
        print(f\"  - [{c['priority']}] {c['title']}{due}\")
"
```

## Workflow: Create a Task

```bash
curl -s -X POST \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Set up OAuth flow",
    "column": "Backlog",
    "epic": "Atlas Kanban Site",
    "category": "Side Projects",
    "priority": "high",
    "effort": "M",
    "due_date": "2026-07-01"
  }' \
  https://atlas-board.vercel.app/api/atlas/cards
```

## Workflow: Move a Card to Done

```bash
CARD_ID="<uuid from GET /board>"
curl -s -X POST \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"column": "Done"}' \
  https://atlas-board.vercel.app/api/atlas/cards/$CARD_ID/move
```

---

## Setup (first-time only — if API calls return errors)

Verify these Vercel environment variables are set on the atlas-board project:

| Variable | Where to get it |
|----------|----------------|
| `ATLAS_INTERNAL_API_KEY` | Any secure string you choose; also store it in MEMORY.md |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → service_role secret |
| `NEXT_PUBLIC_SUPABASE_URL` | Already set |

After setting env vars: Vercel Dashboard → Deployments → Redeploy (no code change needed).

---

## Error Handling

All errors: `{ "error": "<message>" }` + HTTP status.

- 401 — wrong or missing API key
- 400 — required field missing
- 404 — card/epic not found
- 500 — Supabase error (usually missing `SUPABASE_SERVICE_ROLE_KEY`)
