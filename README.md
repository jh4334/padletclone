# Boardly Local

Boardly Local is a local-first workspace board for collecting tasks, ideas, decisions, links, comments, reactions, and attachments. It can run locally only, or sync board data through Supabase.

## Product Shape

Boardly Local is not only a Padlet clone and not only a workflow tool. It is a Padlet-style collection board with workflow views layered on top:

- Use `Canvas` like Padlet to collect ideas, links, files, comments, and reactions.
- Use `Workflow` to move cards through status-based execution.
- Use `Timeline` to review the record chronologically.
- Use `Focus` to isolate important, blocked, or decided cards.

## Features

- Local-first storage with optional Supabase sync
- Canvas, Workflow, Timeline, and Focus layouts
- Cards with type, status, priority, section, tags, evidence links, comments, and reactions
- Per-card status changes, editing, attachment management, and deletion
- Separate read-only and edit sharing links for safer collaboration handoff
- Share links validate their URL token against the board's loaded access metadata and show a no-access state on mismatch
- Supabase save conflict detection before overwriting a board changed from another device
- Board templates for weekly reviews, meetings, and idea exploration
- Activity log with one-step undo for recent local changes
- Attachment preview cards with file type, local-only status, and IndexedDB body availability
- Saved quick filters for important, blocked, decided, and attachment-backed cards
- Today dashboard for blocked, important, recent decision, attachment-backed, and stale unfinished cards
- CSV export and JSON backup/restore
- Responsive desktop and mobile UI

## Run Locally

```bash
python3 -m http.server 5177 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:5177/index.html?board=my-workspace
```

## Storage Model

- Cards, sections, comments, and reactions are saved to Supabase when configured.
- Templates, activity history, and card edits are stored inside the board snapshot.
- Before saving to Supabase, the app checks the latest `updated_at` value and shows a conflict panel if another device saved first.
- Read-only/edit share tokens are saved in both the board snapshot and Supabase row metadata.
- Read-only/edit links are currently enforced in the frontend after the board metadata is loaded. Treat them as a collaboration UX guard, not as a complete server-side security boundary until auth/RLS or a trusted server check is added.
- A local browser copy is kept in `localStorage` as fallback.
- Search, sort, archived visibility, quick filters, and dashboard focus are saved per board in `localStorage`.
- Attachments use `IndexedDB`.
- Attachment metadata is saved with cards, including future cloud storage path fields.
- Attachment file bodies are still saved only in the current browser profile and are marked as browser-only in the UI.
- Use `백업` and `복원` to move data between browsers or devices.

## Supabase Setup

1. Open your Supabase project SQL Editor.
2. Run `supabase-schema.sql`.
   - If you already created the table before, run the file again. It includes `add column if not exists` migration lines for the access metadata columns.
3. Open `boardly.config.js`.
4. Keep `SUPABASE_URL` as your project URL.
5. Put your Project API `anon` / `publishable` key in `SUPABASE_ANON_KEY`.

Do not put the `service_role` key in this frontend project.

## Deploy

This is a static site. It can be hosted on Cloudflare Pages, Vercel, GitHub Pages, or any static web host.
