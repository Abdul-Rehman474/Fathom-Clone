# Prompts

Run in order. Each prompt assumes every previous prompt is finished and merged. Nothing is repeated between prompts.

---

## Prompt 1 — Build the full MVP (autonomous, looping)

```text
You are building a complete, working MVP of a Fathom.ai clone in this repository. Work autonomously from start to finish.

## Source of truth
Read these files in full before writing any code, and re-read the relevant section before each feature:
- docs/PRD.md          — features, scope tiers, user flows, acceptance criteria
- docs/architecture.md — stack, data model, pipeline, API routes, folder structure, security
- docs/designPlan.md   — design tokens, typography, components, motion rules, hard visual constraints
- docs/UI.md           — screen-by-screen specification of every page, state and interaction
- docs/Tasks.md        — build order and "done when" checks

If a detail is not in the docs, choose the option closest to the documented patterns and keep going. Never stop to ask which option to pick.

## Operating rules (important)
1. Do NOT stop, and do NOT ask for permission or confirmation, until the Definition of Done at the bottom is fully satisfied. Keep working through the entire build in one continuous run.
2. Work in a loop: implement a slice → typecheck → build → fix → self-verify against the docs → move to the next slice. Never leave a slice half-built before starting another.
3. Never leave TODO comments, stub components, placeholder text like "coming soon" (except where the docs explicitly require it), empty handlers, or dead routes. Every button, link, menu item and form in the screens you build must do something real.
4. Backend and frontend are both in scope. A screen is only done when its data comes from the database through real queries/mutations with correct access rules.
5. Follow docs/designPlan.md exactly. Hard constraints: no gradients of any kind, no mesh gradients, no background grids/dot grids/star fields/noise, no glassmorphism, no scroll-jacking, no infinite scroll in app data lists. Scroll-driven motion is allowed only where designPlan.md §7.2 permits it, and only on marketing pages.
6. For any animation code, search the Motion documentation through the motion MCP server first and build on what it returns. Import from `motion/react`, never from `framer-motion`.
7. Keep commits small and descriptive, one per completed slice.
8. Type safety: TypeScript strict, no `any` escapes, Zod validation on every API input and on every AI JSON output.

## Environment and provider keys
Create `.env.example` listing every variable from docs/architecture.md §10, and `.env.local` for local work.
Some third-party keys may be missing while you build. Handle that without blocking:
- Add `MOCK_PROVIDERS=true` support. When a provider key is absent or mocking is on, provider clients return realistic fixture data (a multi-speaker transcript with timestamps, a summary, action items) after a short simulated delay, and webhook-driven steps are invoked directly instead.
- All provider access goes through `lib/providers/*` and `lib/ai/*` so switching between mock and live is a single env change and no UI code knows the difference.
- The entire product must be demonstrable end to end with `MOCK_PROVIDERS=true`.

## Scope of THIS prompt
Build everything below. Three things are explicitly NOT in this prompt and are handled later, so do not implement them now, but leave clean seams for them:
- Google Meet / Zoom OAuth connectors and real meeting-link creation
- The Recall.ai notetaker bot and its webhooks
- The Document Picture-in-Picture in-meeting overlay
For those three, create the UI surfaces the docs describe with clearly typed, isolated service modules whose functions exist and are called, so a later prompt only fills in the provider calls.

### 1. Project foundation
- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, folder structure exactly as docs/architecture.md §9.
- Design tokens from designPlan.md §3 as CSS variables plus Tailwind theme mapping; fonts per §4 via `next/font`; radii, spacing and component specs per §5–6.
- Base UI kit: buttons (all variants), pill CTA, inputs, selects, sentence-select, toggle, tabs, dialog, popover, dropdown menu, tooltip, toast, skeleton, status badge, timestamp chip, assignee chip, tag pill, choice card, settings row.

### 2. Database, security, search
- Full schema from docs/architecture.md §5 as SQL migrations: profiles, workspaces, workspace_members, user_settings, integrations, calls, attendees, transcript_segments, summaries, action_items, highlight_tags, highlights, playlists, playlist_items, ask_threads, ask_messages, alerts, alert_hits, feedback, referrals, webhook_events.
- Row Level Security on every table, including the `can_view_call()` helper and workspace visibility.
- Generated tsvector columns + GIN indexes for full-text search; all other indexes listed in the docs.
- Private storage buckets for recordings and thumbnails; signed upload and playback URLs.
- A trigger that creates the profile, default user_settings and the four default highlight tags on first sign-in.

### 3. Auth and onboarding
- Sign-up and sign-in screens per UI.md §2 with Google sign-in; Microsoft button present and disabled with a tooltip when not configured.
- Route protection middleware; redirect rules per PRD FR-1.3.
- The six onboarding steps per UI.md §3, saving answers, resumable on refresh, with the progress bar and footer.
- On completing onboarding, seed a fully processed demo call for the new user (recording, transcript segments with speakers, summary, action items, highlights across tag colours, plus one playlist), so no screen is ever empty on first run.

### 4. App shell
- Top bar, tab navigation, avatar menu, Refer popover, Help & Feedback widget, credits badge, search field — all per UI.md §4, all functional (feedback and tickets persist, referral links generate and copy, FAQ bot answers).
- Collapsible account-level Ask panel per UI.md §4 and PRD §6.8, with suggestion chips and the My Calls / Team Calls scope dropdown.
- Recording status bar that appears while a capture is active.

### 5. Capture: upload and browser tab recording
- New Meeting dialog per UI.md §4.1 with all three tabs present. In this prompt, fully implement **Record this tab** and **Upload recording**; the Create-meeting and Send-notetaker tabs render their full UI and call service functions that currently return a clearly typed "not configured" result handled gracefully in the UI.
- Upload: direct-to-storage signed upload from the browser (never through a serverless function body), validation, progress, duration extraction.
- Tab capture per architecture.md §3.2: display capture plus microphone mixed through Web Audio, audio-only by default, chunked MediaRecorder, stop-sharing handling, missing-tab-audio warning, and a browser-support message outside Chrome/Edge.

### 6. Processing pipeline
- Deepgram transcription exactly as architecture.md §4.0: model, diarization, utterances, smart formatting, audio-intelligence extras, callback with a secret, duplicate rejection by request id, seconds→milliseconds conversion, speaker index→"Speaker A" mapping.
- Claude structured summarization per architecture.md §4.1: tool-schema output validated with Zod, one retry on validation failure, summary templates (General, Sales, Customer Success, 1:1, Stand-up, Interview), title generation, action items with assignee and timestamp, topics, decisions, next steps, questions.
- The full call status machine with per-stage failure reasons, idempotent handlers, and a retry that resumes from the failed stage.
- Thumbnail generation for video recordings.

### 7. My Calls and search
- Month-grouped card grid, cards with thumbnail/platform tile, duration badge, counts, processing and failed overlays, hover menu, empty state, filters, "Load more" pagination — per UI.md §6.
- Top-bar search with full-text results, matching snippets and timestamp links into the call.

### 8. Call page
Everything in UI.md §7: custom player with keyboard controls and highlight markers; Summary tab with template and ordering controls, copy, regenerate, clickable timestamps; Transcript tab with search, playback following, click-to-seek; per-call Ask Fathom chat with streaming answers and citation chips that seek; editable title; attendees with speaker renaming that propagates; action items CRUD with assignees and timestamps; highlights CRUD with tags; share popover with access levels and token regeneration; overflow menu actions; processing and failed states with polling.

### 9. Sharing, playlists, team
- Public read-only share pages for calls and playlists per UI.md §13, served through a server-side service-role read after token and access checks.
- Playlists: create, add highlights, reorder, remove, clip playback, play-all, share, and the documented empty state.
- Team workspaces: conversion from the upsell, invite links, join flow, call visibility, Team Calls grid and members card.

### 10. Settings and secondary pages
- The complete settings page, all nine sections per UI.md §12, with every behavioural setting actually driving behaviour (bot name, auto action items, default template, recording banner, consent, default share access, highlight tag CRUD with reorder and colour picker) and the documented "coming soon" modals only where the docs specify them.
- Delete account: removes rows, storage objects and the auth user.
- Deals and Alerts per UI.md §10–11.

### 11. Public website
All marketing pages per UI.md §1: header with dropdown menus and mobile sheet, home, overview, the four solutions pages from one template plus content files, integrations index and detail, pricing, what's new, help centre, legal, security, status, comparison template, and the footer. Flat SVG illustrations only (no gradient defs). Include the scroll motion kit from designPlan.md §7.2 — reveal wrapper, marquee that pauses on hover/focus, sticky feature section, count-up, optional progress bar — all disabled under `prefers-reduced-motion`.

## Self-verification loop (do this before you finish, then fix and repeat)
Run this audit, write the results into `docs/mvp-audit.md` as a table, fix every failure, and run the audit again. Repeat until everything passes. Do not end your run with known failures.

1. `npx tsc --noEmit` — zero errors.
2. `npm run build` — succeeds with no warnings you introduced.
3. `npm run lint` — clean.
4. Route sweep: every route in architecture.md §8 renders without runtime errors, signed-in and signed-out.
5. Link sweep: every header, footer, menu, tab and card link resolves to a real page. No 404s, no dead handlers.
6. Screen sweep: walk UI.md §15's screen inventory and confirm each screen exists with its loading, empty, error and ready states.
7. Requirement sweep: walk every FR in PRD.md §6 and mark it done or not done.
8. Flow sweep with `MOCK_PROVIDERS=true`: sign up → onboarding → demo call visible → upload a file → status reaches ready → summary, action items and speaker-labelled transcript appear → timestamps seek → per-call Ask answers with a citation → account-level Ask answers with a call citation → add a highlight → add it to a playlist → share link opens signed out → settings change persists after reload.
9. Security sweep: RLS blocks another account's rows; the service-role key appears in no client bundle; share tokens are unguessable; webhook handlers reject a bad secret and ignore duplicates; transcripts are wrapped as data in prompts.
10. Design sweep per designPlan.md §11: no gradient of any kind anywhere in the codebase; no background grids or star fields; scroll effects only on marketing pages and only the permitted ones; reduced motion respected; focus visible everywhere; tabular numbers on timers and durations.
11. Responsive sweep at 360, 768, 1280 and 1440 widths: no horizontal page scroll, nothing clipped or overlapping.

## Definition of Done
- Every item in the Scope section above is implemented, wired to the database, and reachable through the UI.
- `docs/mvp-audit.md` exists and every row passes.
- The end-to-end flow in step 8 completes without manual intervention.
- `README.md` documents setup, environment variables, migrations, the mock-provider mode, and which parts are intentionally deferred to later prompts.

Begin now and keep going until the Definition of Done is met.
```

---

## Prompt 2 — Continue if the run stops early

```text
The MVP build from the previous prompt is not finished. Re-read docs/mvp-audit.md, docs/PRD.md §6 and docs/UI.md §15, find everything still failing or missing, and continue implementing without asking for confirmation. Re-run the full self-verification loop from that prompt, update docs/mvp-audit.md, and keep looping until every row passes and the Definition of Done is met.
```

---

## Prompt 3 — Google Meet and Zoom connectors

```text
Implement the meeting-platform connectors described in docs/architecture.md §6 and docs/PRD.md FR-3.1, filling in the seams left in the MVP build. Do not restructure existing features.

1. Token handling: AES-GCM encryption helper, encrypted storage of access and refresh tokens in the integrations table, refresh-on-expiry, CSRF-protected OAuth `state`.
2. Google: connect and callback routes with offline access and the Meet space scope; a client that creates a meeting space and returns the meeting link.
3. Zoom: connect and callback routes; a client that creates a meeting and returns the join link.
4. Wire the existing UI: the New Meeting "Create meeting" tab with the result screen (link, copy, join, notetaker line), onboarding step 5 connect buttons with connected state, and the Settings video-conferencing section showing real connection status with connect/disconnect.
5. Keep `MOCK_PROVIDERS=true` working: mocked connectors return a fake but realistic meeting link.

Verify: connect both providers, create a meeting from each, confirm the link opens a real meeting, disconnect and confirm the UI reflects it, and confirm tokens are never exposed to the client. Fix everything you find before finishing.
```

---

## Prompt 4 — Notetaker bot and live status

```text
Implement the notetaker bot path described in docs/architecture.md §3.1 and docs/PRD.md FR-3.2, FR-3.3, FR-3.6.

1. A provider client that creates a bot with the meeting URL and the bot name from settings, retrieves bot state, removes a bot from a call, and fetches a fresh recording media URL on demand. Confirm the field and event names against the provider's current documentation before coding.
2. Routes to send and remove the notetaker, wired to the New Meeting "Join with notetaker" tab (with meeting-link validation for Meet, Zoom and Teams) and to auto-send from the Create-meeting flow.
3. The provider webhook: signature verification, duplicate suppression, mapping of bot lifecycle events onto the call status machine, storing the recording start time, capturing failure reasons such as not admitted, removed or meeting ended, and handing the finished recording to the existing transcription pipeline.
4. Live status on the call card, the call page and the New Meeting result, polling only while a call is active.
5. The recording notification banner setting controls the bot's displayed notice.

Verify with a real meeting: the bot appears in the lobby under the configured name, is admitted, records, and the call reaches ready with a transcript and summary. Repeat with a pasted Zoom link and a pasted Teams link. Also verify the not-admitted failure path shows a clear reason and a working retry.
```

---

## Prompt 5 — In-meeting overlay

```text
Implement the in-meeting overlay described in docs/UI.md §5 and docs/architecture.md §7.

1. A Document Picture-in-Picture window opened from a user gesture, rendered as a React portal from the app so it shares state, with stylesheets copied into the PiP document so the design system applies.
2. A docked in-app panel fallback for browsers without PiP support, with a short explanation.
3. Overlay contents: call title and platform, status dot and elapsed timer driven by the recording start time, one highlight button per highlight tag, scratchpad with debounced autosave, microphone level meter, and an End button that stops tab capture or removes the bot.
4. Highlight clicks store the tag and the offset from the recording start, and appear on the call page as clickable timestamps at the correct moments.
5. All overlay states: waiting to be admitted, recording, ending, uploading with progress, and done with a link to the call.
6. Entry points: opened automatically when a capture or bot session starts, and reopenable from the recording status bar.

Verify during a live meeting that the overlay floats above the meeting window, that several highlights land at the right timestamps, that the scratchpad persists, and that End completes the call. Then confirm the fallback panel works in a browser without PiP.
```

---

## Prompt 6 — Reliability and security hardening

```text
Harden the application against the requirements in docs/PRD.md §8 and docs/architecture.md §11, without adding features.

1. Every pipeline stage idempotent and safely retryable; verify duplicate webhooks and repeated retries cannot create duplicate transcripts, summaries or action items.
2. Long-running work never blocks a request: confirm webhook handlers return quickly and the summarization step runs with an appropriate duration limit.
3. Rate limit the Ask endpoints per user and return a friendly UI message when limited.
4. Confirm transcripts and any other model-facing content are wrapped as data with instructions to ignore embedded commands.
5. Audit access rules with two accounts and an anonymous visitor: private calls, workspace calls, share tokens, playlists, settings and the delete-account route.
6. Confirm no server-only secret reaches the client bundle, and that OAuth tokens are encrypted at rest.
7. Add clear error surfaces for every provider failure, with retry where retry makes sense.

Write the audit results into docs/security-audit.md, fix every issue found, and re-run the audit until it is clean.
```

---

## Prompt 7 — Accessibility, responsiveness and state polish

```text
Bring the whole product up to the accessibility and responsiveness requirements in docs/designPlan.md §9–10 and docs/PRD.md §8.

1. Keyboard support everywhere: focus order, visible focus rings, escape and arrow handling in menus, dialogs and tabs, and real buttons for timestamp chips with descriptive labels.
2. Screen-reader correctness: landmarks, labels, live regions for status changes only, decorative illustrations and marquees hidden from assistive technology with accessible text present elsewhere.
3. Contrast check against the token palette; fix any text below the required ratio.
4. `prefers-reduced-motion`: every animation and scroll effect disabled or reduced to a static final state.
5. Responsive pass at 360, 768, 1024, 1280 and 1440 widths for every screen, including the call page, settings, share page and all marketing pages.
6. Confirm every data screen has distinct loading, empty, error and ready states, and that every mutation reports success or failure.

Record the findings and fixes in docs/a11y-audit.md and repeat until clean.
```

---

## Prompt 8 — Visual fidelity pass

```text
Do a visual fidelity pass against docs/designPlan.md and docs/UI.md, screen by screen, using the screen inventory in UI.md §15.

For each screen, compare the implementation with its specification and correct spacing, type scale, colour token usage, radii, borders, component variants, iconography, empty-state copy and layout structure. Confirm the two surfaces read as intended: bold display typography on the marketing site, dense and calm in the product.

Re-run the design checklist in designPlan.md §11 in full, including the search for any gradient, background grid, star field, disallowed scroll effect or hidden scrollbar. Fix everything found, and list the screens reviewed with their outcome in docs/design-audit.md.
```

---

## Prompt 9 — Demo data and first-run experience

```text
Polish the first-run experience so the product is immediately understandable.

1. Refine the seeded demo call so its transcript, summary, action items and highlights are genuinely useful examples, and make sure it is created reliably for every new account.
2. Seed one example playlist built from that call's highlights.
3. Make sure suggestion chips in both Ask surfaces produce good answers against the seeded data.
4. Add an onboarding tutorial modal reachable from the avatar menu and the onboarding bubble, showing the three capture paths.
5. Confirm no screen a new user can reach is ever empty without a helpful explanation and a next action.

Verify by creating a brand-new account and walking the entire product without uploading anything.
```

---

## Prompt 10 — Full end-to-end test pass and fixes

```text
Run the complete test pass from docs/Tasks.md against the deployed application, in a fresh private window, with live provider keys rather than mocks.

Execute every case: sign-up and both onboarding paths, meeting creation on each platform, the notetaker bot on Meet, Zoom and a pasted Teams link, tab capture, uploads of both audio and video, the processing pipeline including a forced failure and retry, timestamp seeking, transcript following, template regeneration, both Ask surfaces with citations, search, highlights, playlists, sharing and revocation, team invite and visibility with a second account, settings persistence, account deletion on a throwaway account, behaviour in a browser without tab capture and PiP, and a refresh on every route.

Record each result in docs/test-report.md, fix every defect you find, re-test the affected cases, and keep looping until the report is entirely green.
```

---

## Prompt 11 — Documentation and release

```text
Prepare the repository for review.

1. README: what the product is, the live URL, how to sign in, the architecture diagram and a short explanation of the capture paths and processing pipeline, the scope tiers from docs/PRD.md §5 stating what is fully working versus presentation-only, known limitations, and complete local setup instructions covering environment variables, migrations, seeding, mock-provider mode and webhook tunnelling.
2. Make sure docs/ is committed and consistent with the final implementation; update any spec that drifted during the build.
3. Add concise code-level documentation where the logic is non-obvious: the capture paths, the status machine, retrieval for Ask, and the access-control helpers.
4. Repository hygiene: no secrets committed, `.env.example` complete, scripts documented, clean commit history, final deployment verified and tagged.

Finish by confirming the deployed application passes the success criteria in docs/PRD.md §9.
```

---

## Prompt 12 — Optional extensions

```text
With everything above complete and stable, implement these in order, verifying each before starting the next:

1. Live summary in the in-meeting overlay using streaming transcription, updating as the meeting progresses and falling back cleanly when streaming is unavailable.
2. Keyword alerts: user-defined keywords, matches detected when a call finishes processing, and a matches list linking into calls at the right timestamps.
3. Microsoft sign-in alongside Google, enabled only when configured.

Stop before any change that would risk the stability of the verified flows.
```
