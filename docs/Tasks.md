# Tasks — Fathom Clone

> Order of work. Each task has a "done when" check. Scope tiers come from `PRD.md §5`; don't start a **Shell** item while a **Real** item is broken.


---

## Phase 0 — Before the clock starts (setup only, no project code)

Accounts and keys (check the challenge rules first on what's allowed beforehand):
- [ ] Node.js LTS + npm, Git, VS Code, Chrome installed; `node -v`, `git --version` work.
- [ ] GitHub account; Vercel account linked to GitHub.
- [ ] Supabase account (a project can be created at the start of the challenge).
- [ ] Anthropic API key with credit.
- [ ] Deepgram account + API key (free starter credit); note that `nova-3` diarization and the audio-intelligence add-ons are enabled on the plan.
- [ ] Recall.ai account + API key; note your **region base URL**; confirm free credits and pricing.
- [ ] Google Cloud project: OAuth consent screen (**Testing** mode, add your own and the evaluators' emails as test users); enable **Google Meet REST API**; OAuth client (web) created (redirect URIs can be added later).
- [ ] Zoom Marketplace: create a **General (OAuth) app** in development mode; note the client ID and secret.
- [ ] A 3–6 minute sample meeting recording (people who agreed to be recorded) for the seed call and the upload demo.
- [ ] Manually test once (dashboard or curl, no code): a Recall bot joins one of your Meet calls and records.
- [ ] Tunnel tool installed (`cloudflared` or `ngrok`) for local webhook tests.
- [ ] Motion MCP connected in Claude Code (done).

---

## Foundation and the core pipeline 

**Goal: a recording goes in and a call page with a transcript and summary comes out, on the live Vercel URL.**

### 1.1 Project setup 
- [ ] Scaffold: `npx create-next-app@latest` (TypeScript, Tailwind, App Router, ESLint, `src/` off). The folder must be empty except `docs/`: move `docs/` out, scaffold, move it back.
- [ ] Install: `@supabase/supabase-js @supabase/ssr zod @anthropic-ai/sdk @deepgram/sdk @tanstack/react-query motion lucide-react`; `npx shadcn@latest init` + add button, dialog, dropdown-menu, popover, tabs, switch, select, input, textarea, checkbox, tooltip, sonner, skeleton.
- [ ] Fonts (Sora, Inter, Barlow Semi Condensed, JetBrains Mono) via `next/font`; colour tokens from `designPlan.md §3` in `globals.css` + Tailwind config.
- [ ] Git init → GitHub repo → Vercel import → first deploy. Env vars set in Vercel and `.env.local`.
- **Done when:** the production URL shows a "Hello" page with the correct fonts and colours.

### 1.2 Database and auth 
- [ ] Supabase project; migrations `0001_init.sql` (all tables from `architecture.md §5`), `0002_rls.sql` (policies + `can_view_call()`), `0003_search.sql` (generated tsvector + GIN indexes).
- [ ] Storage buckets `recordings`, `thumbnails` (private).
- [ ] Google provider enabled in Supabase Auth; redirect URLs for localhost + production.
- [ ] `lib/supabase/{server,client,admin,middleware}.ts`; middleware protects `(app)` and `onboarding`.
- [ ] `/signup`, `/login` UI (`UI.md §2`); `/auth/callback`; the profile row and default `user_settings` and 4 default `highlight_tags` are created on first login (DB trigger).
- **Done when:** sign in with Google on production → redirected to onboarding step 1; logout works; RLS blocks another user's rows (tested with 2 accounts).

### 1.3 Onboarding 
- [ ] Shared `StepShell` (logo, progress bar, footer with Sign out); `SentenceSelect`, `ChoiceCard` components.
- [ ] Steps 1–4 and 6 per `UI.md §3`, saving to `profiles` / `user_settings`; step 5 shows the connect buttons + Skip.
- [ ] Resume at `onboarding_step`; on finish, copy the demo seed call to the user.
- **Done when:** a new account goes through all 6 steps, refresh resumes correctly, and it lands on `/calls`.

### 1.4 App shell and My Calls
- [ ] `(app)/layout.tsx`: top bar, tabs, Ask panel placeholder, avatar menu (`UI.md §4`).
- [ ] `/calls`: month-grouped grid, `CallCard`, status overlays, empty state, "Load more".
- [ ] `supabase/seed.sql` demo call (transcript segments, summary JSON, action items, highlights) made from your sample recording.
- **Done when:** the demo call shows as a card with the correct counts and duration.

### 1.5 Upload → transcription → summary pipeline
- [ ] New Meeting dialog, **Record or upload** tab: upload sub-card (drag-and-drop, validation, progress).
- [ ] `POST /api/calls`, `/api/calls/:id/upload-url` (signed upload URL), direct browser upload, `/api/calls/:id/complete`.
- [ ] `lib/providers/deepgram.ts`: submit `{ url }` with `model=nova-3&diarize&utterances&smart_format&summarize=v2&topics&callback=…&secret=…` (`architecture.md §4.0`). `/api/webhooks/deepgram`: verify the secret, dedupe on `request_id`, map `utterances` → segments (seconds → ms, speaker number → "Speaker A"), store Deepgram's own summary/topics, set `summarizing`, trigger summarize.
- [ ] `lib/ai/schemas.ts` (Zod), `templates.ts`, `summarize.ts` (Claude tool-use JSON, one retry on a validation error). `/api/calls/:id/summarize`: writes summary, action items, AI highlights, title.
- [ ] Status machine + `webhook_events` de-duplication + `/api/calls/:id/retry`.
- [ ] Test locally through a tunnel, then on production.
- **Done when:** uploading the sample file on production gives status `ready` with a correct speaker-labelled transcript (speakers split correctly, timestamps in ms) and a sensible summary within ~2 minutes; the retry path works after forcing a failure.

### 1.6 Call page v1 
- [ ] `/calls/[id]` layout (`UI.md §7`): custom player with a fresh media URL (`/api/calls/:id/media`), Summary tab (sections, `@m:ss` seek chips, order toggle, copy), Transcript tab (rows, click to seek, current-row highlight, follow with manual-scroll override, search).
- [ ] Right column: editable title, attendees/speaker rename, action items (toggle, edit, add, delete), highlights list.
- [ ] Processing and failed states with polling.
- **Done when:** on the demo call and the uploaded call, every timestamp seeks correctly and the checkboxes persist after refresh.

### 1.7 Tab capture 
- [ ] `useTabRecorder` hook (`architecture.md §3.2`): display + mic mix, audio-only default, chunked MediaRecorder, `onended` handling, the "no tab audio" warning.
- [ ] Record-tab card in New Meeting; the recording bar under the tabs; End → upload → pipeline.
- **Done when:** recording a Meet tab for 2 minutes in Chrome (your voice + the other side's audio) produces a processed call where both voices appear in the transcript.


---

## Real meetings, overlay, AI and sharing 

**Goal: create a Meet from the app, the notetaker records it, the overlay works during the call, Ask Fathom works, and share links work.**

### 2.1 Meeting connectors 
- [ ] `lib/crypto.ts` (AES-GCM) for tokens.
- [ ] Google: `/api/integrations/google/{start,callback}` (offline access, `state` check), token refresh, `lib/providers/google-meet.ts` `createSpace()`.
- [ ] Zoom: `/api/integrations/zoom/{start,callback}`, refresh, `createMeeting()`.
- [ ] `POST /api/meetings`; New Meeting **Create meeting** tab with the result screen; onboarding step 5 buttons wired; Settings Video Conferencing status.
- **Done when:** both "Create & open" buttons produce real working meeting links on production.

### 2.2 Notetaker bot
- [ ] `lib/providers/recall.ts`: create bot (`meeting_url`, `bot_name`, recording config, optional banner image), get bot, remove bot, get recording media URL. Verify against the current docs.
- [ ] `/api/calls/:id/bot` (POST/DELETE); **Join with notetaker** tab (link validation), auto-send from the Create tab.
- [ ] `/api/webhooks/recall`: signature check, dedupe, status mapping (`joining`, `waiting_admit`, `recording` + `recording_started_at`, `done` → start transcription), failure reasons (not admitted, meeting ended, kicked).
- [ ] Live status on the card, the call page and the New Meeting result (TanStack Query polling every 3s while active).
- **Done when:** a real Meet created from the app gets "{Name}'s Notetaker" in the lobby → admitted → recording → after leaving, the call reaches `ready`. Also tested with a pasted Zoom link and a pasted Teams link.

### 2.3 Overlay 
- [ ] `OverlayPortal` (Document PiP + stylesheet copy + docked fallback) and `Overlay` UI (`UI.md §5`).
- [ ] Opens from New Meeting results / the recording bar ("Open overlay"); timer from `recording_started_at` or the local start time.
- [ ] Highlight buttons → `POST highlights` with `offset_ms`; toast. Scratchpad autosave (debounced 1s) to `calls.scratchpad`. End button → stops tab capture or removes the bot.
- **Done when:** during a live Meet the overlay floats above the Meet tab, 3 highlight clicks show up at the right times on the call page, and End finishes the call.



### 2.4 Ask Fathom
- [ ] `lib/ai/ask.ts`: per-call context builder; account-level retrieval (`lib/search.ts`, `websearch_to_tsquery`, top calls + snippets + date-range summaries); streaming route handlers; citation parsing → chips.
- [ ] Call page **Ask Fathom** tab; the app-level **Ask panel** with suggestion chips and the scope dropdown; threads saved.
- [ ] Top-bar search results mode on `/calls?q=`.
- **Done when:** "What did we decide about the beta?" answers correctly with a working `[m:ss]` link; "Any looming deadlines?" answers across calls with call citations; search finds a phrase said only in a transcript.

### 2.5 Highlights, templates and share
- [ ] "+ Highlight at m:ss" from the player; timeline markers; edit/delete.
- [ ] Template dropdown → Regenerate; "Extract Action Items from Transcript" button when the auto setting is off.
- [ ] Share popover (access levels, copy, regenerate token); `/share/[token]` read-only page via a service-role server read.
- **Done when:** a share link works in incognito, and revoking the link breaks it.

### 2.6 Team and playlists 
- [ ] Team conversion from the upsell ("Start 14-Day Trial"), workspace invite link `/join/[token]`, call visibility (Private/Workspace), `/team` grid + members card.
- [ ] Playlists: create, add from call/highlight, list page, detail with clip player + reorder + "Play all", share page.
- **Done when:** a second test account joins the workspace and sees the shared call in Team Calls; a playlist of 3 clips plays through in order.

---

## Remaining surfaces, public site, polish, submission

**Goal: every screen in `UI.md §15` exists, everything Real still works, and it's deployed with a README. Feature freeze at H66.**

### 3.1 Settings and top-bar extras 
- [ ] `/settings`: all 9 sections (`UI.md §12`); behavioural settings wired (bot name, auto action items, default template, recording banner, default share access, highlight tags CRUD + reorder + colour); integration/API/MCP/apps modals; delete account (removes storage files + rows + auth user via an admin route).
- [ ] Refer popover (invite code, copy, share intents); signup via `/invite/[code]` credits the inviter +10.
- [ ] Help & Feedback widget (FAQ Ask AI via Haiku, ticket/feedback forms saved to `feedback`).
- **Done when:** changing the bot name changes the name of the next bot that joins; deleting a tag removes it from the overlay.

### 3.2 Shell pages 
- [ ] `/deals` (upsell + sample table), `/alerts` (keyword alerts if time allows, else redirect + toast), Team/Playlists empty explainers polished.

### 3.3 Public website 
- [ ] Header with click/hover-intent dropdowns + mobile sheet + sticky-after-80px behaviour; footer.
- [ ] Scroll motion kit (`designPlan.md §7.2`): `<Reveal>` wrapper, `<Marquee>` (pauses on hover/focus), sticky Clarity/Momentum/Ease section, count-up, optional progress bar — all gated on `prefers-reduced-motion`.
- [ ] Flat SVG illustrations: planet (purple/pink), moon (cyan/white), astronaut, rocket. No gradient defs.
- [ ] Home (`UI.md §1.2`), Overview (§1.3), Solutions template + 4 content files (§1.4), Integrations index + detail (§1.5), Pricing (§1.6), What's New, Help, legal, Security, Status, the comparison template.
- [ ] Product frames made from real screenshots of our app (taken after 3.1).
- **Done when:** every header/footer link resolves (no 404s) and every page passes the design QA checklist (`designPlan.md §11`).



### 3.4 Polish and hardening 
- [ ] Loading, empty and error states on every data screen; toasts for every mutation.
- [ ] Responsive pass at 360 / 768 / 1280 / 1440.
- [ ] Rate limit on the Ask endpoints; prompt-injection wrapper on transcripts; no service key in client bundles (`grep` the build output).
- [ ] Metadata: titles, favicon, OG image.

### ⛔ FEATURE FREEZE 

### 3.5 Test pass 
Run each on **production**, in a fresh incognito window:
- [ ] Sign up → onboarding (both "By Myself" and "With My Team") → demo call visible.
- [ ] Create Google Meet → notetaker admitted → overlay highlights → leave → ready → summary, action items, transcript, highlights at the right times.
- [ ] Paste a Zoom link → bot → ready. Paste a Teams link → bot joins.
- [ ] Record a tab (audio-only) → ready. Upload an MP4 and an MP3 → ready.
- [ ] Every timestamp seeks; the transcript follows playback; the template change regenerates.
- [ ] Ask (per call + account, both scopes) with working citations; search from the top bar.
- [ ] Share link in incognito; revoke; playlist share.
- [ ] Team invite with a second account; Team Calls shows the shared call; the private call is not visible.
- [ ] Settings persist after reload; delete account on a throwaway account.
- [ ] Firefox: capture/overlay show graceful messages; everything else works.
- [ ] Refresh on every route; logout/login.
- [ ] Design QA (`designPlan.md §11`): no `gradient` anywhere; scroll effects only on marketing pages; reveals use `once: true`; reduced-motion checked; marquees pause on hover.

### 3.6 Submission
- [ ] **README.md:** what it is; live URL; demo credentials or a "sign up with Google" note (test-user caveat for the Google Meet connect); architecture diagram (from `architecture.md`); capture paths; **what is Real / Functional / Shell** (the PRD tier table); decisions and why (web-only vs desktop vs extension, bot API, PiP overlay, no gradients by design); known limitations; local setup (env vars, migrations, tunnel); AI usage statement pointing to the prompt log.
- [ ] `docs/` included in the repo.
- [ ] Final deploy; tag `v1.0`.
- [ ] 3-minute demo script rehearsed (below). Record a backup screen video of the full flow.

---

## Demo script (3 minutes)

1. **(0:00)** Landing page → "Sign up free" → Google → onboarding in about 30s → My Calls with the demo call.
2. **(0:40)** New Meeting → Create Google Meet → Meet opens → notetaker in the lobby → admit → overlay floats above Meet → say 3 sentences including a task ("Sara will send the pricing deck by Friday") → click **Needs review** → End.
3. **(1:30)** While it processes, open the pre-processed demo call: Summary → click `@2:04` → the player seeks → Transcript follows → Ask Fathom "What did we decide about the beta?" → citation click.
4. **(2:15)** Back to the live call (now ready): action item "Sara – send pricing deck" with assignee and timestamp; the highlight at the right moment.
5. **(2:40)** Share → incognito opens the read-only page. Settings → rename the bot, show the highlight tags. End with the README's Real/Shell table.

---

## Working with AI during the challenge (for a clean prompt log)

- One feature per conversation turn; reference the relevant doc section ("Implement `UI.md §7` Summary tab using the schema in `architecture.md §4.1`").
- Ask for small diffs and review them; run and test before the next task.
- Paste real errors with context; state constraints ("don't touch unrelated files", "no gradients – see designPlan §1").
- Commit after each "Done when" passes, with messages that match the task IDs (e.g. `1.5 upload→transcription pipeline`).
