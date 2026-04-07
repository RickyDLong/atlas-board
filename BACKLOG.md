# Atlas Board — Backlog

## Bugs
- [ ] Card `position` field never updates — always 0, so sort order is unreliable
- [ ] Epic progress calculation hardcodes "Done" column name — breaks if renamed
- [ ] Context menu can render off-screen on narrow viewports
- [ ] Stray `src/{components/` directory exists (empty, from bad mkdir) — should be deleted

## Improvements
- [ ] Drag-and-drop card reordering within a column (position tracking)
- [ ] Undo/redo for destructive actions (delete card, move card)
- [ ] Accessibility pass — ARIA labels, keyboard navigation, focus management
- [ ] Optimistic update error handling — rollback on server failure
- [ ] Server-side search for large card sets (currently client-side filter)
- [ ] Mobile responsive layout improvements
- [ ] Profile table + settings UI (interface exists in types, no implementation)

## Features
- [ ] Drag-and-drop between columns (native HTML5 or library like dnd-kit)
- [ ] Card due dates with overdue indicators
- [ ] Notification system (card reminders, epic deadlines)
- [ ] Keyboard shortcuts (n = new card, / = search, etc.)
- [ ] Board analytics — cards completed per week, average time in column
- [ ] Multiple boards per user
- [ ] Card comments / activity log
- [ ] Export board data (JSON, CSV)
- [ ] Offline mode with local-first sync

## Tech Debt
- [ ] Add Vitest for unit/integration testing
- [ ] Extract dashboard page into smaller components (currently monolithic)
- [ ] Add error boundaries for component-level error handling
- [ ] Implement proper loading skeletons instead of generic spinner
- [ ] Clean up stray `src/{components/` directory
