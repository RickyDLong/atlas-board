# Atlas Board — Backlog

## Recently shipped (confirmed in 2026-07-21 review)
- [x] Undo/redo for destructive actions (`useUndoRedo.ts`, `UndoToast.tsx`)
- [x] Keyboard shortcuts (`useKeyboardShortcuts.ts`, `ShortcutsModal.tsx`)
- [x] Card due dates with overdue indicators (+ `overdue-notify` edge function, `user_preferences.overdue_notifications`)
- [x] Card comments + activity log (`CardComments.tsx`, `ActivityLog.tsx`, migrations 020–021)
- [x] Board analytics — Stats view + cumulative-flow diagram + column transitions (migrations 014–015)
- [x] Vitest for unit/integration testing (many co-located `*.test.ts(x)`)
- [x] Card templates, labels, subtasks, relationships, attachments, saved filters, recurring tasks (migrations 006, 016, 018–024)

## Bugs
- [ ] Card `position`: now set on create, but confirm in-column drag reorder persists it
- [ ] Epic progress: column done-state now uses `is_done` (migration 012) — verify progress no longer hardcodes the literal "Done" title
- [ ] Context menu can render off-screen on narrow viewports
- [ ] Stray `src/{components/` directory — not present in current tree; confirm it's gone and drop this item

## Improvements
- [ ] Drag-and-drop card reordering within a column (no dnd library in deps yet)
- [ ] Accessibility pass — ARIA labels, keyboard navigation, focus management
- [ ] Optimistic update error handling — rollback on server failure
- [ ] Server-side search for large card sets (currently client-side filter)
- [ ] Mobile responsive layout improvements
- [ ] Profile table + settings UI (`Profile` interface exists in types, no `profiles` table)

## Features
- [ ] Drag-and-drop between columns (native HTML5 or a library like dnd-kit)
- [ ] Notification system beyond overdue email (card reminders, epic deadlines)
- [ ] Multiple boards per user (API + `getBoardId` currently assume one board)
- [ ] Export board data (JSON, CSV)
- [ ] Offline mode with local-first sync
- [ ] REST API coverage for non-core entities (subtasks, labels, comments, relationships) — currently UI-only

## Tech Debt
- [ ] Extract `dashboard/page.tsx` into smaller components (still ~42 KB / monolithic)
- [ ] Add error boundaries for component-level error handling
- [ ] Implement proper loading skeletons instead of generic spinner
