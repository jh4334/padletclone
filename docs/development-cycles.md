# Boardly Development Cycles

This file tracks the requested 10-cycle loop:

`develop -> code review -> real-user review -> propose next task -> develop again`

## Cycle 1 - Sharing and Read-Only Access

### Development

- Added a `공유/권한` panel with separate read-only and edit links.
- Added URL role handling through `role=view` and `role=edit`.
- Added read-only UI locking for composer, sections, card edit/delete/status, comments, reactions, import, reset, undo, and canvas dragging.

### Code Review Notes

- The current read-only mode is a client-side guard. It improves UX and prevents accidental edits in the browser, but it is not a server security boundary.
- `commitMutation()` now blocks mutations in read-only mode, which gives one central guard for most board edits.
- `importBackup()` needed its own guard because it mutates state before using the generic mutation path.

### Real-User Review

- A user can now share a view-only link without asking the recipient to “please do not edit.”
- The app clearly shows whether the current session is `편집 가능` or `읽기 전용`.
- Read-only users can still inspect cards and export/backup data, but they cannot change the board.

### Next Development Task

Cycle 2 should move from client-side access UX to Supabase-backed access metadata:

- Store view/edit tokens in the `boardly_boards` row.
- Update schema notes to explain that true server-side protection requires RLS/auth.
- Prepare the app for later owner-based permissions.
