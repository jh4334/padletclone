# Boardly Local

Boardly Local is a local-first workspace board for collecting tasks, ideas, decisions, links, comments, reactions, and attachments. It can run locally only, or sync board data through Supabase.

## Features

- Local-first storage with optional Supabase sync
- Canvas, Workflow, Timeline, and Focus layouts
- Cards with type, status, priority, section, tags, evidence links, comments, and reactions
- Per-card status changes and deletion
- Browser attachment storage through IndexedDB
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
- A local browser copy is kept in `localStorage` as fallback.
- Attachments use `IndexedDB`.
- Attachment file bodies are still saved only in the current browser profile.
- Use `백업` and `복원` to move data between browsers or devices.

## Supabase Setup

1. Open your Supabase project SQL Editor.
2. Run `supabase-schema.sql`.
3. Open `boardly.config.js`.
4. Keep `SUPABASE_URL` as your project URL.
5. Put your Project API `anon` / `publishable` key in `SUPABASE_ANON_KEY`.

Do not put the `service_role` key in this frontend project.

## Deploy

This is a static site. It can be hosted on Cloudflare Pages, Vercel, GitHub Pages, or any static web host.
