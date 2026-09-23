# Architecture — Fathom Clone

> How the system is built. Requirements live in `PRD.md`; screens in `UI.md`; order of work in `Tasks.md`.

---

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | One codebase for public site, app, API routes and webhooks |
| Styling | **Tailwind CSS** + **shadcn/ui** (Radix primitives) | Fast, accessible components; design tokens in one place |
| Animation | **Motion** (`motion` / `framer-motion`), limited use | Hover, press, modal and tab transitions only (see `designPlan.md`) |
| Auth / DB / Storage | **Supabase** (Auth, Postgres, Storage, RLS) | Removes auth and storage boilerplate; RLS gives per-user security |
| Meeting bot | **Recall.ai** | One API to send a named bot into Meet / Zoom / Teams |
| Transcription + audio intelligence | **Deepgram** (`nova-3`) | Speaker diarization, word/utterance timestamps, smart formatting, takes a URL, async callback. Its audio-intelligence add-ons (`summarize`, `topics`, `sentiment`, `intents`) give a first-pass summary and topics in the same request. |
| LLM (summaries, Ask Fathom) | **Anthropic Claude** — `claude-sonnet-5` (structured summaries, Ask), `claude-haiku-4-5-20251001` (titles, FAQ bot) | Produces the structured summary schema (§4.1), action items with assignees and timestamps, and the Ask Fathom answers. Wrapped behind `lib/ai` so the provider can be swapped. |
| Meeting links | **Google Meet REST API**, **Zoom API** | Real "Create meeting" buttons |
| Validation | **Zod** | Validates API inputs and LLM JSON |
| Data fetching | Server Components + Server Actions; **TanStack Query** for polling / live status | |
| Hosting | **Vercel** | Preview URLs, env vars, public webhook URLs from hour 1 |

---

## 2. System diagram

```
                        ┌──────────────────────────── Browser (Chrome/Edge) ───────────────────────────┐
                        │                                                                              │
 Public site ──────────►│  Next.js pages  ──  App shell (My Calls, Call page, Settings …)             │
                        │        │                    │                                                │
                        │        │          ┌─────────┴──────────┐                                     │
                        │        │          │ PiP overlay window │  (Document Picture-in-Picture)      │
                        │        │          └─────────┬──────────┘                                     │
                        │        │    getDisplayMedia + mic → MediaRecorder (tab capture)              │
                        └────────┼────────────────────┼─────────────────────────────────────────────────┘
                                 │                    │ signed upload URL (direct to storage)
                                 ▼                    ▼
                  ┌──────────────────────── Next.js on Vercel ────────────────────────┐
                  │ Route handlers / Server Actions                                    │
                  │  /api/meetings      → Google Meet API / Zoom API (create link)     │
                  │  /api/calls/:id/bot → Recall.ai (create bot)                       │
                  │  /api/webhooks/recall      ◄── bot status + recording ready        │
                  │  /api/webhooks/deepgram    ◄── transcript ready (callback)         │
                  │  lib/pipeline: transcribe → summarize → index                      │
                  │  /api/ask, /api/calls/:id/ask → Claude (streaming)                 │
                  └───────┬───────────────────────┬──────────────────────┬─────────────┘
                          │                       │                      │
                          ▼                       ▼                      ▼
                   Supabase Postgres        Supabase Storage       External APIs
                   (RLS, full-text search)  (recordings, thumbs)   Recall · Deepgram · Claude
                                                                   Google · Zoom
```

---

## 3. Capture paths

All three paths converge on one call record and one pipeline.

| Path | Start | Media ends up | Pipeline trigger |
|---|---|---|---|
| **Bot** | `POST /api/calls/:id/bot` → Recall creates a bot with `meeting_url`, `bot_name` | Recall-hosted recording (URL fetched from Recall) | Recall webhook: bot done / recording ready |
| **Tab capture** | Browser: `getDisplayMedia` + `getUserMedia`, mixed | Supabase Storage via signed upload URL | Client calls `POST /api/calls/:id/complete` |
| **Upload** | File input / drag-and-drop | Supabase Storage via signed upload URL | Client calls `POST /api/calls/:id/complete` |

### 3.1 Bot path (primary)
1. User creates or pastes a meeting URL. A `calls` row is created with `source='bot'`, `status='scheduled'`.
2. Server calls Recall "create bot" with `meeting_url`, `bot_name` (from settings), recording config, and optionally a static output image for the bot's video tile ("{Name}'s Notetaker is recording" when the banner setting is on). Stores `bot_id`.
3. Recall webhooks → `/api/webhooks/recall` update `status`: `joining → waiting_admit → recording → processing`. On "recording started", store `recording_started_at` (used for overlay highlight offsets).
4. When the recording is done: fetch the recording media URL from Recall, then submit it to Deepgram (`{ url }` + `diarize=true` + `callback`).
5. The media URL from the bot provider is short-lived, so the call page requests a fresh one via `GET /api/calls/:id/media`, which the server fetches from Recall on demand.

> Verify field and event names against the current Recall.ai docs on Day 1; keep the client in `lib/providers/recall.ts` so changes stay in one file.

### 3.2 Tab capture (bot-free fallback)
```ts
const display = await navigator.mediaDevices.getDisplayMedia({
  video: captureVideo ? { frameRate: 15, width: 1280 } : true, // video must be requested; drop the track if audio-only
  audio: true,                                              // tab audio (Chrome: user ticks "Share tab audio")
});
const mic = await navigator.mediaDevices.getUserMedia({ audio: true });

const ctx = new AudioContext();
const dest = ctx.createMediaStreamDestination();
ctx.createMediaStreamSource(new MediaStream(display.getAudioTracks())).connect(dest);
ctx.createMediaStreamSource(mic).connect(dest);

const tracks = [...dest.stream.getAudioTracks(), ...(captureVideo ? display.getVideoTracks() : [])];
const recorder = new MediaRecorder(new MediaStream(tracks), {
  mimeType: captureVideo ? 'video/webm;codecs=vp9,opus' : 'audio/webm;codecs=opus',
  videoBitsPerSecond: 350_000, audioBitsPerSecond: 48_000,
});
recorder.start(5000); // collect 5s chunks
```
- The meeting tab's audio doesn't include the user's own voice, so the mic is always mixed in.
- If the user didn't tick "Share tab audio" (`getAudioTracks().length === 0`), warn and let them retry.
- When the user clicks "Stop sharing" in the browser (`track.onended`), finish the recording the same way as clicking End.
- Default mode is **Audio only**, to stay inside the storage per-file limit (Supabase free plan: 50 MB per file). Audio at 48 kbps ≈ 21 MB/hour.

### 3.3 Upload
- The client asks `POST /api/calls/:id/upload-url` → server returns a Supabase **signed upload URL**; the browser uploads directly (never through a Vercel function, which has a ~4.5 MB body limit).
- Duration is read client-side from an `<audio>`/`<video>` element's metadata and stored.

---

## 4. Processing pipeline

```
recording available
      │
      ▼
[transcribing]  Deepgram job (nova-3, diarize, utterances, callback=/api/webhooks/deepgram?call=…&secret=…)
      │  callback (POST with the full result)
      ▼
map utterances → insert transcript_segments (speaker, start_ms, end_ms, text)
      │
      ▼
[summarizing]   Claude: transcript (with [mm:ss] Speaker: text lines) + template → JSON (Zod-validated)
      │
      ▼
upsert summaries, action_items, auto-highlights; set title if untitled; generate thumbnail (video: first frame at 3s)
      │
      ▼
[ready]         search index is maintained automatically (generated tsvector columns)
```

- **State machine** on `calls.status`: `scheduled | joining | waiting_admit | recording | uploading | transcribing | summarizing | ready | failed`. `calls.error` holds the reason; `calls.failed_stage` lets **Retry** resume from that stage.
- **Idempotency:** webhook handlers check the current status before acting; `webhook_events` stores provider event IDs to drop duplicates.
- **Time limits:** the summarize step runs in its own route with `export const maxDuration = 60` (raise if the plan allows) and is triggered with `after()` (Next.js) so the webhook returns quickly.
- **Long transcripts:** if a transcript exceeds ~150k tokens, summarize in chunks then merge (unlikely in a demo; implement last).

### 4.0 Deepgram request and response mapping

```ts
// lib/providers/deepgram.ts  — submit (async, result arrives at the callback)
const qs = new URLSearchParams({
  model: 'nova-3',
  diarize: 'true',        // speaker numbers on every word/utterance
  utterances: 'true',     // grouped speaker turns → our transcript_segments
  smart_format: 'true',   // punctuation, casing, numbers
  punctuate: 'true',
  paragraphs: 'true',
  detect_language: 'true',
  summarize: 'v2',        // audio-intelligence extras (cheap first pass)
  topics: 'true',
  sentiment: 'true',
  callback: `${SITE_URL}/api/webhooks/deepgram?call=${callId}&secret=${DEEPGRAM_WEBHOOK_SECRET}`,
});
await fetch(`https://api.deepgram.com/v1/listen?${qs}`, {
  method: 'POST',
  headers: { Authorization: `Token ${DEEPGRAM_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: mediaUrl }),   // public/signed URL of the recording
});
```

Mapping the callback body:

| Deepgram | Our column |
|---|---|
| `results.utterances[]` → `{ speaker, start, end, transcript }` | one `transcript_segments` row each; `start_ms = Math.round(start * 1000)` (Deepgram returns **seconds as floats**) |
| `speaker: 0,1,2…` (integers) | `speaker_label = 'Speaker ' + String.fromCharCode(65 + speaker)` → "Speaker A" |
| `results.channels[0].alternatives[0].transcript` | fallback single segment if `utterances` is missing |
| `results.summary.short` / `results.topics` / `results.sentiments` | stored on `summaries.content.deepgram` and shown while Claude's structured summary is still generating |
| `metadata.duration` | `calls.duration_sec` (authoritative) |
| `metadata.request_id` | `calls.transcript_job_id`, and the dedupe key in `webhook_events` |

Notes
- The callback is a **POST containing the whole result**, so one request delivers everything. Reject it if the `secret` query parameter doesn't match, and drop duplicates by `request_id`.
- For files we host in Supabase Storage, pass a **signed URL** valid for ≥1 hour; for bot recordings, pass the provider's media URL.
- Streaming (WebSocket) transcription uses the same key and is only needed for the stretch "live summary in the overlay".
- Deepgram's `summarize`/`topics` output feeds a small "quick recap" panel shown while the structured summary (§4.1) is still generating, and serves as the fallback if the Claude step fails.

### 4.1 LLM output schema (Zod)
```ts
const Summary = z.object({
  title: z.string(),
  overview: z.string(),
  purpose: z.string(),
  key_takeaways: z.array(z.string()),
  topics: z.array(z.object({
    title: z.string(),
    bullets: z.array(z.object({ text: z.string(), start_ms: z.number().nullable() })),
  })),
  decisions: z.array(z.object({ text: z.string(), start_ms: z.number().nullable() })),
  action_items: z.array(z.object({
    text: z.string(), assignee: z.string().nullable(), start_ms: z.number().nullable(),
  })),
  next_steps: z.array(z.string()),
  questions: z.array(z.string()),
});
```
- Output is forced through a **tool/function definition** whose input schema matches this, then validated with Zod. On a validation error, retry once with the error message.
- **Templates** (`lib/ai/templates.ts`) change the instructions and section emphasis: General, Sales, Customer Success, 1:1, Stand-up, Interview.
- **Chronological ordering** is done client-side by sorting bullets on `start_ms`, so it doesn't need a second LLM call.

### 4.2 Ask Fathom
- **Per call:** system prompt + full transcript (timestamped) + summary + question → streamed answer. The model is told to cite `[mm:ss]`; the UI turns those into seek links.
- **Account level:**
  1. Scope → list of call IDs the user can see (My Calls or Team Calls).
  2. Postgres full-text search (`websearch_to_tsquery`) over `transcript_segments.tsv` and `summaries.tsv` → top 8 calls, top snippets per call.
  3. For time questions ("this week", "deadlines"), also include the summaries of calls in that date range.
  4. Claude answers from the provided context only, and cites `(Call title, date, [mm:ss])`.
- Retrieval is Postgres full-text search only, which keeps the stack to one database at this data size.

---

## 5. Data model (Postgres / Supabase)

```sql
profiles (id uuid pk → auth.users, full_name, email, avatar_url,
          account_type text check in ('personal','team'), department, role,
          usage text check in ('solo','team'), onboarding_step int, onboarding_done bool,
          invite_code text unique, credits int default 25, created_at)

workspaces (id, name, owner_id → profiles, invite_token text unique, created_at)
workspace_members (workspace_id, user_id, role text check in ('owner','member'), pk(workspace_id,user_id))

user_settings (user_id pk,
  bot_name text, auto_record text, auto_share text, notes_on text, share_with text,
  auto_action_items bool default true, default_template text default 'general',
  recording_banner bool default true, auto_consent bool default false,
  default_share_access text default 'link' check in ('link','workspace','private'),
  in_meeting_chat bool default true, anonymized_data bool default true,
  zoom_auto_unscheduled bool, meet_auto_unscheduled bool, enhanced_recording bool)

integrations (id, user_id, provider text check in ('google','zoom'),
  access_token_enc text, refresh_token_enc text, expires_at, scopes text, account_email, created_at,
  unique(user_id, provider))

calls (id, owner_id, workspace_id null, visibility text default 'private',
  title, platform text check in ('meet','zoom','teams','upload','browser'),
  source text check in ('bot','tab','upload'), meeting_url, bot_id, transcript_job_id,
  status text, failed_stage text, error text,
  scheduled_at, recording_started_at, started_at, duration_sec int,
  media_path text, media_kind text check in ('video','audio'), thumbnail_path,
  template text, scratchpad text,
  share_token text unique, share_access text,
  title_tsv tsvector generated always as (to_tsvector('english', coalesce(title,''))) stored,
  created_at, updated_at)

attendees (id, call_id, name, email, speaker_label text)   -- maps "Speaker A" → name

transcript_segments (id, call_id, idx int, speaker_label, start_ms int, end_ms int, text,
  tsv tsvector generated always as (to_tsvector('english', text)) stored)

summaries (call_id pk, template, content jsonb, overview text,
  tsv tsvector generated always as (to_tsvector('english', coalesce(overview,''))) stored,
  model text, created_at)

action_items (id, call_id, text, assignee, start_ms, done bool default false, position int)

highlight_tags (id, user_id, name, color, position int)          -- seeded: Highlight, Positive Reaction, Needs Review, Feedback
highlights (id, call_id, tag_id, created_by, start_ms, end_ms, note, source text check in ('user','overlay','ai'))

playlists (id, owner_id, workspace_id null, title, description, share_token, created_at, updated_at)
playlist_items (playlist_id, highlight_id, position, pk(playlist_id, highlight_id))

ask_threads (id, user_id, call_id null, scope text, created_at)
ask_messages (id, thread_id, role text, content text, citations jsonb, created_at)

alerts (id, user_id, keyword, created_at)                          -- stretch
alert_hits (id, alert_id, call_id, segment_id, created_at)

feedback (id, user_id, kind text check in ('ticket','feedback'), subject, body, created_at)
referrals (id, inviter_id, invitee_id, created_at)
webhook_events (provider, event_id, received_at, pk(provider, event_id))
```

**Indexes:** GIN on every `tsv`; `calls(owner_id, created_at desc)`; `calls(workspace_id, created_at desc)`; `transcript_segments(call_id, idx)`; `highlights(call_id, start_ms)`.

**RLS (summary):**
- `calls`: select if `owner_id = auth.uid()` OR (`visibility = 'workspace'` AND user is a member of `workspace_id`). Insert/update/delete only by the owner.
- Child tables (`transcript_segments`, `summaries`, `action_items`, `highlights`, `attendees`) inherit access through `call_id` via a `can_view_call(call_id)` SQL function.
- Public share pages read through a **server route using the service role**, after checking `share_token` + `share_access = 'link'`. Never expose the service key to the client.

**Storage buckets:** `recordings` (private), `thumbnails` (private); reads via short-lived signed URLs.

---

## 6. Integrations

| Integration | Auth | Call | Notes |
|---|---|---|---|
| Google sign-in | Supabase Auth (Google provider) | — | Login only |
| Google Meet (create link) | Separate OAuth in `/api/integrations/google/{start,callback}`, `access_type=offline`, scope `https://www.googleapis.com/auth/meetings.space.created` | `POST https://meet.googleapis.com/v2/spaces` → `meetingUri` | Google Cloud app stays in **Testing**, with evaluator emails added as test users |
| Zoom (create link) | OAuth (user-managed app) `/api/integrations/zoom/{start,callback}` | `POST https://api.zoom.us/v2/users/me/meetings` → `join_url` | Development app works for the owner's account and added users |
| Teams | none | — | Paste a Teams link; the bot joins it. No Graph integration. |
| Recall.ai | API key (server) | create bot, get bot, webhooks | Region-specific base URL |
| Deepgram | API key (server) | `POST /v1/listen?model=nova-3&diarize=true&utterances=true&callback=…` with `{ url }` | §4.0 |
| Anthropic | API key (server) | Messages API, streaming, tool use for JSON | |

**Integration tokens:** Meet and Zoom use their own OAuth flow, separate from sign-in, because they need long-lived refreshable tokens. Tokens are stored encrypted (AES-GCM with `TOKEN_ENC_KEY`) and refreshed on expiry.

---

## 7. In-meeting overlay (Document Picture-in-Picture)

```ts
if ('documentPictureInPicture' in window) {
  const pip = await documentPictureInPicture.requestWindow({ width: 340, height: 520 }); // needs a user click
  // copy stylesheets so Tailwind classes work inside the PiP document
  [...document.styleSheets].forEach(s => {
    try { const st = document.createElement('style');
          st.textContent = [...s.cssRules].map(r => r.cssText).join('');
          pip.document.head.appendChild(st);
    } catch { if (s.href) { const l = document.createElement('link'); l.rel='stylesheet'; l.href=s.href; pip.document.head.appendChild(l); } }
  });
  setPipContainer(pip.document.body);  // React: createPortal(<Overlay/>, pipContainer)
  pip.addEventListener('pagehide', () => setPipContainer(null));
} else {
  // fallback: docked panel inside the app
}
```
- The overlay is a **React portal** from the app tab, so it shares state (timer, call ID, tags) with no extra messaging.
- Highlight click → `offset_ms = Date.now() - recording_started_at` → `POST /api/calls/:id/highlights`.
- Closing the app tab closes the overlay. The UI tells the user to keep the app tab open.
- Tab capture is started from the **main tab**. Starting it from inside the PiP window hasn't been tested yet; the main tab is known to work.

---

## 8. Routes

### Pages
```
(marketing)  /  /overview  /solutions/[slug]  /integrations  /integrations/[slug]  /pricing
             /resources/whats-new  /help  /legal/terms  /legal/privacy  /security  /status
(auth)       /login  /signup  /auth/callback
(onboarding) /onboarding/[step]   step ∈ account-type | preferences | about-you | usage | connect | first-call
(app)        /calls  /calls/[id]  /team  /playlists  /playlists/[id]  /alerts  /deals  /settings
             /join/[inviteToken]
(public)     /share/[token]  /share/playlist/[token]
```

### API (route handlers)
```
POST /api/meetings                          create Meet/Zoom link (provider in body)
POST /api/calls                             create call row
POST /api/calls/:id/upload-url              signed upload URL
POST /api/calls/:id/complete                upload finished → start transcription
POST /api/calls/:id/bot                     send notetaker
DELETE /api/calls/:id/bot                   remove bot from meeting
GET  /api/calls/:id/media                   fresh signed/provider media URL
POST /api/calls/:id/retry                   resume from failed_stage
POST /api/calls/:id/summarize               (internal) run LLM step; also used by "Regenerate"
POST /api/calls/:id/ask                     per-call Ask (stream)
POST /api/ask                               account-level Ask (stream)
POST /api/webhooks/recall                   verify signature
POST /api/webhooks/deepgram                 verify secret query param; body = full result
GET  /api/integrations/{google|zoom}/start  → provider consent
GET  /api/integrations/{google|zoom}/callback
POST /api/help/ask                          FAQ bot
```
CRUD for highlights, action items, playlists, tags, settings, sharing and feedback uses **Server Actions** in `app/(app)/**/actions.ts`.

---

## 9. Folder structure

```
fathom-clone/
├─ app/
│  ├─ (marketing)/  layout.tsx  page.tsx  overview/  solutions/[slug]/  integrations/  pricing/  resources/  legal/ …
│  ├─ (auth)/       login/  signup/  auth/callback/route.ts
│  ├─ onboarding/   [step]/page.tsx  layout.tsx
│  ├─ (app)/        layout.tsx (TopBar + Tabs + AskPanel)
│  │   calls/ page.tsx  [id]/page.tsx   team/  playlists/  alerts/  deals/  settings/
│  ├─ share/        [token]/page.tsx  playlist/[token]/page.tsx
│  └─ api/          meetings/  calls/[id]/…  ask/  webhooks/{recall,deepgram}/  integrations/…  help/
├─ components/
│  ├─ ui/           (shadcn primitives)
│  ├─ marketing/    Header, MegaMenu, Hero, FeatureTabs, LogoWall, SolutionTemplate, Footer, Planet (SVG)
│  ├─ app/          TopBar, AppTabs, AskPanel, CallCard, MonthGroup, NewMeetingDialog, StatusBadge
│  ├─ call/         Player, SummaryTab, TranscriptTab, AskTab, ActionItems, Highlights, ShareMenu, Attendees
│  ├─ capture/      useTabRecorder.ts, OverlayPortal.tsx, Overlay.tsx, UploadDropzone.tsx
│  └─ onboarding/   StepShell, SentenceSelect, ChoiceCard
├─ lib/
│  ├─ supabase/     server.ts client.ts admin.ts middleware.ts
│  ├─ ai/           client.ts  summarize.ts  ask.ts  templates.ts  schemas.ts
│  ├─ pipeline/     transcribe.ts  process.ts  status.ts
│  ├─ providers/    recall.ts  deepgram.ts  google-meet.ts  zoom.ts
│  ├─ crypto.ts     search.ts     time.ts (ms ↔ mm:ss)
├─ supabase/
│  ├─ migrations/   0001_init.sql  0002_rls.sql  0003_search.sql
│  └─ seed.sql      demo call with transcript, summary, highlights
├─ public/          illustrations (flat SVG), logos (own), og image
├─ docs/            PRD.md architecture.md designPlan.md UI.md Tasks.md
└─ README.md
```

---

## 10. Environment variables

```
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server only
ANTHROPIC_API_KEY=
DEEPGRAM_API_KEY=
DEEPGRAM_WEBHOOK_SECRET=
RECALL_API_KEY=
RECALL_REGION_BASE_URL=             # e.g. https://us-west-2.recall.ai
RECALL_WEBHOOK_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
TOKEN_ENC_KEY=                      # 32-byte base64
```

---

## 11. Security checklist
- Service-role key is used only in `lib/supabase/admin.ts` (server). ESLint rule: no import from client components.
- Webhooks: verify the signature/secret, check the event ID in `webhook_events`, and look up the call by the stored `bot_id` / `transcript_job_id`, never by a client-supplied call ID alone.
- OAuth: `state` parameter tied to the user session (CSRF); tokens encrypted; refresh on expiry.
- Share tokens: `crypto.randomBytes(16).toString('base64url')`; revocable (regenerate).
- LLM prompts: transcripts are wrapped as data (`<transcript>…</transcript>`) with the instruction to ignore instructions inside them (prompt-injection hygiene).
- Rate limit Ask endpoints per user (simple DB counter per minute).

## 12. Deployment
- Vercel project linked to GitHub; `main` → production.
- Supabase project: run migrations; enable Google provider; add redirect URLs for production + `localhost:3000`.
- Register webhook URLs in Recall; Deepgram's `callback` is set per job, so point it at the production domain (or the tunnel URL locally).
- Local webhook testing: `cloudflared tunnel` or `ngrok`; set `NEXT_PUBLIC_SITE_URL` to the tunnel URL.
