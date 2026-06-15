# Boardly Local

Boardly Local is a local-first workspace board for collecting tasks, ideas, decisions, links, comments, reactions, and attachments in one browser.

## Features

- Local-only storage with no external database
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

- Cards, sections, comments, reactions, and preferences use `localStorage`.
- Attachments use `IndexedDB`.
- Data is saved only in the current browser profile.
- Use `백업` and `복원` to move data between browsers or devices.

## Deploy

This is a static site. It can be hosted on Cloudflare Pages, Vercel, GitHub Pages, or any static web host.
