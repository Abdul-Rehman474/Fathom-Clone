# PRD — Fathom Clone (AI Meeting Notetaker, Web-Only)

> Product Requirements Document. Companion docs: `architecture.md`, `designPlan.md`, `UI.md`, `Tasks.md`.

---

## 1. Summary

A web application that reproduces Fathom.ai: an AI notetaker that joins or captures video meetings (Google Meet, Zoom, Microsoft Teams), records them, transcribes them with speaker labels, and turns them into summaries, action items, highlights and a searchable, askable meeting history.

It is one web app: a single URL that covers the marketing site, the signed-in product and the recording experience.

**How a meeting gets captured**
1. **Send Notetaker** — from the app, a named bot (*"{First name}'s Notetaker"*, via Recall.ai) joins a Google Meet, Zoom or Teams call, is admitted by the host and records it.
2. **Record this tab** — `getDisplayMedia` captures the meeting tab's audio mixed with the microphone, for bot-free capture.
3. **Upload a recording** — an existing audio or video file goes through the same pipeline.

During the call, a floating **Document Picture-in-Picture overlay** sits above the meeting window with the timer, highlight buttons, scratchpad and End button.

.

---

## 2. Goals

1. **The core pipeline must work end to end:** capture → store → transcribe (with speakers and timestamps) → AI summary / action items / highlights → call page → Ask Fathom.
2. **The visible product must look like Fathom:** top-nav app shell, My Calls, call page, Settings, onboarding, public site.
3. **Integrations must be honest:** everything labelled "Connected" really is connected; everything simulated is labelled "Coming soon" or shown as a demo.
4. **Demo reliability:** a pre-processed seed call means the demo works even if an external API fails.

## 3. Out of scope for this build


- The product ships as a web app only: browser, no installs.
- Billing is presentation only: Pricing and "Upgrade" are static UI.
- CRM, Slack, Zapier and Asana appear as integration cards; no data syncing.
- SSO/SCIM and compliance certifications are marketing copy.
- Teams is supported by pasting a Teams meeting link for the bot.

---

## 4. Users

| Persona | Need |
|---|---|
| **Individual professional** (personal use) | Records their calls, gets notes, finds "what did we agree?" |
| **Team member** (team use) | Shares calls with their workspace; sees Team Calls; builds playlists of highlights |
| **Evaluator** | Signs up, runs through a meeting in minutes, sees AI output, judges the code and product |

---

## 5. Scope by tier

**Legend:** **Real** = fully working with a backend. **Functional** = works on real data, lighter implementation. **Shell** = pixel-accurate UI with static or seed data, clearly non-functional.

| # | Module | Tier | Notes |
|---|---|---|---|
| 1 | Auth (Google sign-in; Microsoft optional) | Real | Supabase Auth |
| 2 | Onboarding (7 steps) | Real | Answers stored in the profile |
| 3 | App shell (top bar, tabs, Ask panel) | Real | |
| 4 | New Meeting: create a Meet / Zoom link | Real | Google Meet REST API, Zoom API |
| 5 | Send Notetaker bot (Meet / Zoom / Teams link) | Real | Recall.ai |
| 6 | Browser tab capture (bot-free) | Real | Chrome/Edge only |
| 7 | Upload a recording | Real | Audio or video file |
| 8 | In-meeting overlay (PiP) | Real | Timer, highlight buttons, scratchpad, End |
| 9 | Transcription with speakers and timestamps | Real | Deepgram `nova-3` (diarization, utterances, audio intelligence) |
| 10 | AI summary, action items, topics, decisions | Real | Claude, structured JSON |
| 11 | Call page (player, Summary / Transcript / Ask tabs) | Real | Synced transcript, clickable timestamps |
| 12 | My Calls (month-grouped card grid, search) | Real | Postgres full-text search |
| 13 | Ask Fathom: per-call and account-level | Real | Scope dropdown |
| 14 | Highlights and highlight tags | Real | Tags managed in Settings |
| 15 | Share link (public call page) | Real | Access: anyone with link / workspace / private |
| 16 | Playlists of highlights | Functional | |
| 17 | Team workspace and Team Calls | Functional | Invite link; shared calls |
| 18 | Settings (all sections) | Functional | Behavioural settings real; integration cards UI |
| 19 | Refer (invite link, copy, share buttons) | Functional | Invite code per user |
| 20 | Help & Feedback widget | Functional | Ask AI (FAQ-grounded), ticket, feedback saved to DB |
| 21 | Alerts (keyword alerts) | Functional (stretch) | Otherwise Shell |
| 22 | Deals | Shell | Trial upsell + sample table |
| 23 | Integrations: Claude, ChatGPT, Zapier, Slack, Salesforce, HubSpot, Task Manager, API, MCP | Shell | "Coming soon" modals |
| 24 | Public site: Home, Overview, Solutions ×4, Integrations, Pricing, Resources, Legal | Real UI, static | One Solutions template reused |
| 25 | Live AI summary in overlay | Stretch | Needs streaming transcription |

---

## 6. Functional requirements

### 6.1 Authentication
- **FR-1.1** Sign up / sign in with **Continue with Google**. **Continue with Microsoft** is shown and works only if configured; otherwise it's disabled with a tooltip.
- **FR-1.2** Sessions persist; logout is available in the avatar menu.
- **FR-1.3** Unauthenticated users hitting `/calls` etc. are redirected to `/login`.

### 6.2 Onboarding (mirrors the real flow)
1. **Account type:** "Personal use only" vs "Individual or Team use" (Recommended). Detects personal email domains (gmail, outlook, yahoo…) and shows "*{email} looks like a personal email*".
2. **Preferences:** "Take notes on [All meetings in my calendar ▾ / Only meetings I host / Only external meetings / None] and share with [All attendees ▾ / Only internal attendees / Only me]", plus a **consent checkbox** that must be ticked before Continue is enabled.
3. **About you:** "I work in [Department ▾] as [Role ▾]".
4. **Usage:** "By Myself" / "With My Team". Team creates a workspace.
5. **Connect platforms:** Google Meet and Zoom connect buttons, with "Skip this step".
6. **Try it:** "Start a test recording" (tab capture), "Upload a recording", or "Go to My Calls".
- Every step shows the footer "Signing up as {email}. Wrong account? Sign out" and a thin progress bar.
- **FR-2.1** Progress is saved per step; refreshing resumes the current step.

### 6.3 Meeting creation and capture
- **FR-3.1 New Meeting modal**, with three tabs:
  - **Create meeting:** title, platform (Google Meet / Zoom). The app creates a real meeting link, opens it in a new tab, and offers to send the notetaker.
  - **Join with notetaker:** paste any Meet / Zoom / Teams URL, then "Send Notetaker".
  - **Record this browser tab** or **Upload recording**.
- **FR-3.2 Bot lifecycle** is shown live on the call card and call page: `Joining → Waiting to be admitted → Recording → Processing → Ready` (or `Failed` with reason and retry).
- **FR-3.3** Bot name comes from Settings ("{First name}'s Notetaker", editable).
- **FR-3.4 Tab capture:** the user picks the Meet tab. Tab audio and mic audio are mixed; video is optional (capture mode: *Audio + video* / *Audio only*). A consent reminder shows before recording.
- **FR-3.5 Upload:** MP3, WAV, M4A, WEBM, MP4. The size limit is enforced client-side with a clear message.
- **FR-3.6** Recording ends with **End** (overlay or page) or when the bot leaves.

### 6.4 In-meeting overlay
- **FR-4.1** Opens as an always-on-top Document Picture-in-Picture window when capture or the bot starts (Chrome/Edge). Falls back to a docked panel in the app on other browsers.
- **FR-4.2** Shows: call title, platform, status dot and elapsed timer; **highlight buttons** (one per Settings tag); **Scratchpad** (free notes, autosaved); **End** button.
- **FR-4.3** A highlight click stores `{tag, offset_ms}` relative to the recording start. It appears on the call page as a clickable timestamp.

### 6.5 Processing pipeline
- **FR-5.1** Transcription includes speaker labels (Speaker A/B, renameable to attendee names), word/utterance timestamps and language auto-detection.
- **FR-5.2** The AI produces, in one structured call: **title suggestion, overview, meeting purpose, key takeaways, topics (bullets with timestamps), decisions, action items (text, assignee, timestamp), next steps, questions raised**.
- **FR-5.3** The summary uses the selected **template** (General, Sales, Customer Success, 1:1, Stand-up, Interview). It can be regenerated with a different template from the call page.
- **FR-5.4** If "Auto-generate action items" is off in Settings, the call page shows an **"Extract Action Items from Transcript"** button instead.
- **FR-5.5** Failures at any stage are visible, with a **Retry** that resumes from the failed stage.

### 6.6 My Calls
- **FR-6.1** Card grid grouped by month ("September 2026"). Each card shows the thumbnail (or platform tile for audio-only), a duration badge, title, date, highlights count and action-items count, plus a processing status overlay while not ready.
- **FR-6.2** **Search Call Recordings** (top bar) runs full-text search over titles, summaries and transcripts. Results show matching snippets.
- **FR-6.3** Filters: platform, date range, "has action items".
- **FR-6.4** Empty state: "No call recordings" with a New Meeting button.

### 6.7 Call page
- **FR-7.1 Left column:** video/audio player; under it the tabs **Summary | Transcript | Ask Fathom**.
  - **Summary:** template dropdown, ordering dropdown (*By topic* / *Chronological*), Copy summary, Regenerate. Every bullet with a timestamp is clickable and seeks the player.
  - **Transcript:** speaker-labelled utterances with timestamps; the current utterance is highlighted during playback; search within the transcript; click to seek.
  - **Ask Fathom:** chat about this call; answers cite `[mm:ss]` timestamps that seek.
- **FR-7.2 Right column:** editable title, date, platform, duration; **Share** button (copy link, access level) and ⋮ menu (Rename, Download transcript, Add to playlist, Delete); **Attendees**; **Action items** (checkbox, assignee chip, `@ mm:ss`); **Highlights / Annotations** (tag colour, note, `@ mm:ss`, "Internal team only" label).
- **FR-7.3** Add a highlight from the player at the current time (tag + note).

### 6.8 Ask Fathom (account level)
- **FR-8.1** Right-side collapsible panel on the app pages, with suggestion chips: "Surprise me with an insight", "Any looming deadlines?", "Summarize my meetings from this week".
- **FR-8.2** Scope dropdown: **My Calls / Team Calls**.
- **FR-8.3** Answers stream in and cite calls (title + date + timestamp link).

### 6.9 Sharing
- **FR-9.1** Each call has a share token. `/share/{token}` shows a read-only call page (player, summary, transcript) without login when access is "Anyone with the link".
- **FR-9.2** The default share access comes from Settings.

### 6.10 Playlists
- **FR-10.1** Create a playlist, add highlights from any call, reorder, remove, share.
- **FR-10.2** Playlist page shows highlight clips as cards; clicking plays that segment.
- **FR-10.3** Empty state reproduces Fathom's explainer ("Create shareable playlists of highlights").

### 6.11 Team
- **FR-11.1** Team users have a workspace; the owner copies an invite link; invitees join on signup.
- **FR-11.2** A call's visibility is **Private** or **Workspace**. Team Calls lists workspace calls from all members.
- **FR-11.3** Personal-only accounts see the Team Edition upsell page (as in the screenshot).

### 6.12 Settings (single scrolling page, sections as in the original)
1. **Auto-record sentence:** "Auto-record [All meetings ▾] and auto-share [Summary & recording ▾] with attendees". Stored and shown; drives defaults.
2. **Video conferencing:** Zoom / Google Meet / Microsoft Teams cards with the real connection status. Toggles are stored.
3. **Premium features:** Bot name (edit), Auto-generate action items (toggle, real), Default summary template (dropdown, real), Recording notification banner (toggle, real: shows in bot tile / overlay).
4. **Integrations:** Claude, ChatGPT, Zapier, Slack, Salesforce, HubSpot, Task Manager → "Coming soon" modal.
5. **API access / MCP server:** UI only.
6. **Options:** Auto request recording consent, **Default share link access** (real), In-meeting chat, Use anonymized data (stored).
7. **Apps:** Desktop / Chrome / Zoom App cards with a note that this clone is web-only.
8. **Highlight options:** list of tags (colour + name); add, rename, reorder (up/down buttons), delete. Real.
9. **Delete account:** confirm modal; deletes user data.

### 6.13 Top-bar extras
- **Refer:** popover with invite URL, Copy, Tweet, LinkedIn, partner note.
- **Help & Feedback:** widget with *Ask AI – instant* (LLM grounded on a small FAQ), *Open a ticket*, *Share feedback* (both saved to DB), plus Conversation / Help center tabs.
- **Credits badge** (★ 25): increments for referrals; purely cosmetic.
- **Avatar menu:** Start Test Call, Tutorial, FAQs, Developers, Privacy Policy, Terms of Service, Security & Compliance, System Status, Download App (→ "web-only" modal), Logout, "Logged in as".

### 6.14 Public website
- Header: logo, Overview, Solutions ▾ (Customer Success, Marketing, Sales, Teams), Integrations ▾ (Asana, ChatGPT, Claude, HubSpot, Salesforce, Zapier, Public API & MCP, See all), Resources ▾ (What's New, Resource Hub, Partner with Fathom, Developer Hub, Help Center), Pricing; Book a Demo, Log In, **Sign up free**.
- Pages: Home, Overview, Solutions ×4 (one template), Integrations index + detail template, Pricing, What's New, Help Center, Terms, Privacy, Security, Status.
- Footer with Product, Company, Solutions, Integrations, Competitors, Resources columns, and legal links.
- Design constraints from `designPlan.md` apply: **no gradients, mesh or background grids.** Scroll-driven motion (reveals, sticky sections, marquees) **is allowed** within the rules in `designPlan.md §7`.

---

## 7. Key user flows

**A. First run (evaluator):** Landing → Sign up free → Google → 6 onboarding steps → My Calls (with seed "Welcome to Fathom" demo call) → open demo call → Ask Fathom.

**B. Bot meeting:** New Meeting → Create Google Meet → Meet opens in a new tab → Send Notetaker → bot waits in the lobby → host admits → overlay shows "Recording 00:12" → click highlights → End (or leave) → card shows "Processing" → Ready → call page.

**C. Bot-free meeting:** New Meeting → Record this tab → choose the Meet tab + allow mic → overlay → End → upload → processing → call page.

**D. Upload:** New Meeting → Upload → progress → processing → call page.

**E. Review and share:** Call page → toggle action items → add highlight → Add to playlist → Share → copy link → open in incognito → read-only page.

---

## 8. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | App pages interactive within ~2s on broadband; summaries ready within ~2 min for a 30-min call |
| Reliability | Every pipeline stage is idempotent and retryable; webhooks verified and de-duplicated |
| Security | RLS on every table; OAuth tokens encrypted at rest; webhook signature checks; share tokens are unguessable (≥128-bit) |
| Privacy | Consent checkbox in onboarding; recording notice (bot name + tile/overlay banner); delete account removes files |
| Accessibility | Keyboard navigable, visible focus, ≥4.5:1 text contrast, `prefers-reduced-motion` respected |
| Browser support | Chrome/Edge full; Firefox/Safari everything except tab capture and PiP overlay (graceful message) |
| Responsiveness | App usable from 1024px up; public site and share page fully responsive down to 360px |

---

## 9. Success criteria (demo checklist)

- [ ] New user completes onboarding in under 2 minutes.
- [ ] A real Google Meet is created from the app and the notetaker is admitted and records.
- [ ] Within minutes of ending, the call shows a summary, action items with assignees and timestamps, and a speaker-labelled transcript.
- [ ] Clicking any timestamp seeks the player.
- [ ] Ask Fathom answers a question about one call and across all calls, with citations.
- [ ] Share link opens in an incognito window.
- [ ] Tab capture and upload both produce a processed call.
- [ ] Public site matches the reference layout within the design constraints.
- [ ] Deployed on Vercel; README explains the architecture and the scope tiers from §5.

## 10. Risks

| Risk | Mitigation |
|---|---|
| Bot API quota or outage during the demo | Seed call + tab capture + upload paths |
| Webhooks can't reach localhost | Deploy to Vercel on hour 1; use a tunnel (ngrok / cloudflared) for local testing |
| Supabase free-plan per-file limit (50 MB) | Audio-only default for tab capture; low video bitrate; bot video streamed from the bot provider's media URL |
| Serverless time limits | All long work is async via webhooks; LLM step runs in a route with raised `maxDuration` |
| Tab audio doesn't include the user's own mic | Mix mic + tab audio with Web Audio API |
| Scope creep | The tier table in §5 is binding; Shell items are built last |
