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

## Cycle 4 - Cloud Conflict Guard

### Development

- Added Supabase `updated_at` tracking through `cloud.lastKnownUpdatedAt`.
- Cloud saves now check the latest remote row before upserting the local snapshot.
- If another device saved first, the app blocks overwrite and shows a `원격 변경 있음` conflict panel.
- Added conflict choices: `원격 불러오기`, `로컬 유지`, and `백업 후 덮어쓰기`.

### Code Review Notes

- The conflict guard prevents silent last-write-wins overwrites in the common two-device case.
- `원격 불러오기` uses the already-fetched conflicting row when available, avoiding another race-prone read for the basic path.
- `백업 후 덮어쓰기` intentionally forces the save only after creating a local backup, so the user has a recovery file.
- This is still snapshot-level conflict detection, not field-level merge.

### Real-User Review

- If a board is open on a laptop and phone, the second saver now gets a visible warning instead of accidentally erasing the first device's changes.
- The copy explains the tradeoff in plain Korean and gives immediate next actions.
- Mobile layout stacks the conflict actions so the choices remain tappable.

### Next Development Task

Cycle 5 should improve attachment usefulness:

- Add cloud-ready attachment metadata for future Supabase Storage support.
- Add image/PDF/file preview states so attached evidence is easier to inspect.
- Keep current IndexedDB fallback, but make the UI clearly show whether a file body exists only on this browser.

## Cycle 5 - Attachment Evidence Preview

### Development

- Added normalized attachment metadata: `previewKind`, `storageProvider`, `storageBucket`, `storagePath`, and `localOnly`.
- New local uploads now carry cloud-ready storage path metadata while still saving file bodies in IndexedDB.
- Replaced simple attachment links with preview cards that show file type, size, storage scope, and whether the file body exists locally.
- Image attachments can show an inline thumbnail when the local file body is available.

### Code Review Notes

- Existing attachment records are upgraded through `normalizeAttachment()` without requiring a manual migration.
- `storagePath` prepares future Supabase Storage support, but no file bodies are uploaded to cloud storage yet.
- The UI explicitly separates metadata availability from file-body availability, reducing confusion across browsers.

### Real-User Review

- A user can now tell at a glance whether an attachment is an image, PDF, spreadsheet, text file, or generic file.
- When a backup or cloud-loaded board points to an attachment whose body is missing on this browser, the card says so instead of only showing a broken link.
- The edit drawer keeps attachment removal simple while showing the file type before the name.

### Next Development Task

Cycle 6 should make the board easier to review after many cards accumulate:

- Add saved quick filters for `중요`, `막힘`, `결정`, and `첨부 있음`.
- Add a visible active-filter summary near the search/sort controls.
- Make filtering persistent per board so returning users land in their preferred working view.

## Cycle 6 - Saved Quick Filters

### Development

- Added a quick filter bar for `중요`, `막힘`, `결정`, and `첨부 있음`.
- Quick filters can be combined, and the board shows cards matching any selected quick filter.
- Added an active filter summary beside the search/sort controls.
- Preferences now save per board using a board-scoped localStorage key, while still reading the legacy global key as fallback.

### Code Review Notes

- The filter predicates reuse existing card fields: `priority`, `status`, `type`, and `attachments`.
- Unknown or duplicated quick filter ids are normalized out of saved preferences.
- Quick filters remain available in read-only mode because they only affect the local viewing state, not shared board data.

### Real-User Review

- A user with a crowded board can jump directly to urgent, blocked, decided, or evidence-backed work without typing a search query.
- The summary text makes it clear why fewer cards are visible.
- Board-scoped persistence prevents one board's review filter from surprising the user on another board.

### Next Development Task

Cycle 7 should make the app more useful when opened at the start of a work session:

- Add a `오늘 볼 것` dashboard panel.
- Surface blocked cards, important cards, recent decisions, attachment-backed evidence, and stale unfinished work.
- Let each dashboard item jump to a matching card or apply a focused quick filter.

## Cycle 7 - Today Dashboard

### Development

- Added a `오늘 볼 것` dashboard between the layout guide and board stats.
- The dashboard counts important, blocked, recent decision, attachment-backed, and stale unfinished cards.
- Dashboard clicks apply a focused view: broad quick-filter-backed items reuse saved quick filters, while `최근 결정` and `오래된 미완료` use dedicated board-scoped dashboard focus.
- The active filter summary now explains dashboard focus states as well as quick filters.

### Code Review Notes

- The dashboard is derived from existing card fields and does not mutate shared board data.
- Archived and pending moderation cards are excluded from dashboard counts so the panel reflects actionable work.
- `dashboardFocus` is normalized with prefs, preventing stale or unknown saved focus ids from breaking filtering.

### Real-User Review

- Opening a busy board now gives an immediate “what needs attention” read before the user scans individual cards.
- `오래된 미완료` catches silent drift that ordinary priority/status filters miss.
- Reusing quick filters for broad filters keeps dashboard clicks predictable, while recent/stale views stay precise.

### Next Development Task

Cycle 8 should make team execution clearer:

- Add optional assignee and due date fields to cards.
- Show overdue and due-soon indicators on cards and in the dashboard.
- Include assignee/due date in backup, CSV export, and edit flows.
