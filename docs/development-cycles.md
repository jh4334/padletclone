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

## Cycle 2 - Supabase Access Metadata

### Development

- Added `ownerId` to the board access state so each board has a future permission owner field.
- Supabase loads now request `view_token`, `edit_token`, `owner_id`, and `access_updated_at` along with the snapshot.
- Cloud saves now upsert the access tokens and owner metadata as first-class row columns, while keeping the same values inside the snapshot.
- `supabase-schema.sql` now creates and migrates the access metadata columns for existing tables.

### Code Review Notes

- Access metadata is now durable outside the JSON snapshot, which makes later RLS/auth policy work possible.
- The row metadata and `snapshot.access` are intentionally duplicated; this keeps the current frontend simple while preparing policy-level checks.
- Current Supabase policies are still public for the no-login prototype. The tokens improve structure, not complete server-side security.

### Real-User Review

- A user who opens the same board from another device can keep the same read/edit links after cloud load.
- The app is now less likely to silently regenerate share tokens when Supabase already has canonical board access metadata.
- The setup docs now explain why running the SQL again matters after this upgrade.

### Next Development Task

Cycle 3 should make share links token-aware in app behavior:

- Validate the URL `token` against the loaded `view_token` or `edit_token`.
- Show a clear “권한 없음” state when the token does not match.
- Keep the app usable locally when Supabase is not configured, but prepare the same logic for future RLS/auth enforcement.

## Cycle 3 - Token-Aware Share Links

### Development

- Added an access gate with `open`, `pending`, and `denied` states.
- The app now validates the URL `token` against the loaded read/edit token before allowing board interaction.
- Invalid tokens show a `권한 없음` state and hide board cards, section names, decision records, activity history, and share link values.
- Export, backup, copy-link, card creation, editing, templates, comments, reactions, and cloud saves now respect the access gate.

### Code Review Notes

- The token check now prevents accidental frontend access with stale or mistyped share links.
- The implementation avoids exposing valid share tokens in the sidebar when the current token is invalid.
- This is still a frontend gate. Supabase policies remain public until a server/RLS layer verifies tokens before returning rows.

### Real-User Review

- If someone opens the wrong copied link, they see a clear `권한 없음` state instead of a board that looks editable.
- A valid read-only link still opens the board for viewing and keeps edit controls disabled.
- A valid edit link keeps the normal editing workflow intact.

### Next Development Task

Cycle 4 should reduce accidental data loss and collaboration conflicts:

- Add conflict detection using `updated_at` from Supabase before overwriting a cloud snapshot.
- Show a clear “원격 변경 있음” message when another device changed the board first.
- Offer safe choices: reload cloud version, keep local version, or export local backup before overwriting.
