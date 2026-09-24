# Fathom Clone

An AI meeting notetaker, rebuilt as a web app: it captures or joins meetings,
transcribes them with speaker labels, and turns them into summaries, action
items, highlights and a searchable, **askable** meeting history — plus the full
Fathom-style marketing site.

Built with Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase
(Auth/Postgres/Storage/RLS) · Deepgram (transcription) · **Groq** (LLM) ·
Google Meet & Zoom (meeting links).

---

## What works (scope tiers — PRD §5)

**Real / fully working:** Google auth + onboarding, the app shell, three capture
paths (notetaker seam, tab recording, upload), the Deepgram→Groq pipeline
(transcript → structured summary → action items → highlights → title, with a
status machine and resume-from-failed retry), the call page (custom player,
Summary/Transcript/Ask tabs, clickable timestamps, editable title, attendee
rename, action-item & highlight CRUD, share), My Calls + full-text search,
per-call and account-level Ask Fathom with citations, highlight tags, sharing.

**Functional:** playlists (clip player, reorder, play-all, share), team
workspaces (invite + join, Team Calls), settings (behavioural settings drive
behaviour; highlight-tag CRUD; delete account), referrals, Help & Feedback.

**Shell / presentation:** integration cards ("coming soon"), Deals, Alerts,
pricing/billing.

**Meeting connectors (real):** Google Meet & Zoom OAuth with encrypted tokens,
refresh-on-expiry, and real link creation.

**Notetaker bot (Recall.ai):** send the bot to a pasted Meet/Zoom/Teams link or
automatically from Create meeting; live status (Joining → Waiting to be
admitted → Recording → Processing → Ready) on the call row, call page and
dialog; failure reasons (not admitted, removed, meeting ended…) with retry;
Remove notetaker; the recording banner setting controls the bot's video tile
and join message. The Document Picture-in-Picture overlay is still a seam.

Everything is demonstrable with `MOCK_PROVIDERS=true` (no paid keys needed).

---

## Architecture

```
Browser ── Next.js (Vercel) ──┬─ Supabase (Postgres + RLS, Storage, Auth)
  capture: tab / upload        ├─ Deepgram  (nova-3 transcription, webhook)
  signed direct upload  ───────┤─ Groq      (summaries + Ask, OpenAI-compatible)
                               └─ Google/Zoom (create meeting links)
pipeline: transcribe → summarize → index → ready   (status machine, idempotent)
```

See `docs/architecture.md` for the full design, `docs/PRD.md` for requirements,
`docs/UI.md` for screens, `docs/designPlan.md` for the visual system.

## Capture paths

1. **Send notetaker** — a Recall.ai bot joins a Meet/Zoom/Teams link
   (`lib/providers/recall.ts`, lifecycle in `lib/bot/lifecycle.ts`). Status
   arrives by signed webhook (`/api/webhooks/recall`) and, while a call is
   active, by polling `/api/calls/:id/status`, which also pulls the bot's
   state from Recall so local dev works without a public URL. Both paths are
   de-duplicated through `webhook_events`. When the bot is done, a fresh media
   URL is fetched from Recall and handed to the normal Deepgram → Groq pipeline.
2. **Record this tab** — `getDisplayMedia` + mic mixed via Web Audio, chunked
   MediaRecorder, uploaded directly to storage.
3. **Upload** — an audio/video file goes through the same pipeline.

All converge on one `calls` record and one pipeline.

## Local setup

1. Create a Supabase project. In the SQL editor, run **`supabase/schema.sql`**
   (or the four `supabase/migrations/000*.sql` in order).
2. Supabase → Auth → enable **Google**; add redirect
   `http://localhost:3000/auth/callback` (+ your prod URL).
3. `cp .env.example .env.local` and fill `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Keep
   `MOCK_PROVIDERS=true` to run without paid keys.
4. `npm install && npm run dev` → open http://localhost:3000.

Full key list and security notes: **`docs/SETUP.md`**.

### Going live (optional)

- **Groq** (`GROQ_API_KEY`) for real summaries + Ask.
- **Deepgram** (`DEEPGRAM_API_KEY`, `DEEPGRAM_WEBHOOK_SECRET`) for real
  transcription — set `MOCK_PROVIDERS=false` and expose a public URL (Vercel, or
  a local tunnel with `NEXT_PUBLIC_SITE_URL` pointed at it) so the callback lands.
- **Google/Zoom** OAuth client IDs + `TOKEN_ENC_KEY` for real meeting links.

## Scripts

- `npm run dev` — dev server (webpack; Turbopack has a next/font dev bug here)
- `npm run build` — production build (Turbopack)
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint
- `npm run check:notetaker` — offline checks: meeting-link validation, Recall webhook signatures, lifecycle mapping

## Security

RLS on every table, service-role key server-only, encrypted OAuth tokens,
128-bit revocable share tokens, secret-checked de-duplicated webhooks,
prompt-injection-wrapped transcripts, rate-limited Ask. See `docs/SETUP.md §
Security`.

## AI usage

This project was built with AI pair-programming; the full prompt/response log
ships in `.agent-logs/` and the capture setup is documented in `CAPTURE-TEST.md`.
