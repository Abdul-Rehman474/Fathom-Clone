# UI Specification — Fathom Clone

> Screen-by-screen specs. Visual rules (tokens, fonts, **no gradients / grids**; allowed scroll motion) are in `designPlan.md`. Requirement IDs refer to `PRD.md`.
> Each screen lists: **layout → elements → interactions → states**.

---

## 0. Global conventions

- **Every data screen has 4 states:** loading (skeleton blocks in `--surface-1`, static, no shimmer gradient), empty, error (message + Retry), ready.
- **Toasts** appear bottom-right: success (green check), error (red), info.
- **Confirm dialogs** for destructive actions: Delete call, Delete playlist, Delete tag, Delete account, Remove bot.
- **Time format:** timestamps `m:ss` / `h:mm:ss`; dates "Sep 16, 2026"; month groups "September 2026".
- **Brand text** comes from `BRAND_NAME` (default "FATHOM").

---

## 1. Public website

> Marketing sections use the scroll reveal from `designPlan.md §7.2` (fade + 16px rise, once, staggered children). The product app (§4 onward) has no scroll-driven motion.

### 1.1 Header (all marketing pages)
```
[FATHOM ≡]   ( Overview   Solutions ⌄   Integrations ⌄   Resources ⌄   Pricing )    Book a Demo   Log In   (SIGN UP FREE)
```
- Nav links sit inside a rounded (radius 999) outlined container with a 1px `--border` border.
- **Dropdowns open on click and on hover-intent** (150ms delay), close on Escape or outside click. Panel: `--surface-2`, radius 16, items 18px.
  - Solutions: For customer success · For marketing · For sales · For teams
  - Integrations: Asana · ChatGPT · Claude · HubSpot · Salesforce · Zapier · Public API & MCP · See All Integrations →
  - Resources: What's New · Resource Hub · Partner with Fathom · Developer Hub · Help Center
- The active page link is cyan.
- Optional dismissible top announcement bar: solid `--surface-2`, text + "Learn more →", × closes (remembered in localStorage).
- Mobile: logo + "Menu" button → full-screen sheet with accordion sections.
- The header becomes **sticky after 80px** of scrolling, on a solid `--bg-app` background with a bottom border (same height, no shrink animation).

### 1.2 Home `/`
Sections in order:
1. **Hero (2 columns).** Left: headline "AI notetaking that is out of this world" (Sora 96/300); sub "{Brand} summarizes your meetings so you can focus on the conversation. **Now available bot-free.**"; cyan pill "GET STARTED – FREE FOREVER"; small line "🔒 SOC 2 Type II | GDPR | HIPAA Compliant | SSO / SCIM" (marked sample). Right: a static collage of rounded tiles (radius 999 capsules): capture-mode menu (Audio & video / Audio / Transcript only / Capture off), "✧ ASK FATHOM" tile, a flat-SVG astronaut with laptop, an Ask input tile ("Fathom, what follow-ups did I commit to in my meetings this week?"), a "Project check-in" Summary/Scratchpad tile, a flat moon. Tiles have 1px solid borders in different accent colours (cyan / orange / purple), no gradient borders.
2. **Proof row.** G2-style rating block ("5.0/5.0 · #1 rated", sample) + "Used at 300K+ companies" + 6 placeholder logo tiles (`--surface-1`, radius 12). The logo tiles run as a slow horizontal **marquee** (~40s loop) that pauses on hover/focus; the rating block stays static. Under reduced motion the tiles simply wrap.
3. **Feature showcase (carousel).** Two headline captions ("Capture notes your way – bot or no bot – so you can stay focused on the meeting" / "AI summaries instantly available after your call"). One slide visible at a time, showing a product frame. Yellow circular ← → buttons + 4 dots. Crossfade 200ms; arrows and dots are the main control, with a slow 7s autoplay that stops for good on any interaction.
4. **Marquee statement banner.** Large Sora headline "Move work forward faster" with a flat rocket SVG, looping horizontally (~40s), paused on hover/focus, `aria-hidden` with the same sentence present as static text for screen readers and reduced motion.
5. **Teams vs individuals.** Headline "Whether you're a team of 1 or 1,000, {Brand}'s got your back"; flat planet SVG on the left edge; bordered card with tabs **Fathom for teams | Fathom for individuals** (active = yellow text + yellow underline). Content: title, 2 paragraphs, "SEE OUR PRICING" pill, 4 icon + text features in a 2×2 layout.
6. **Clarity / Momentum / Ease.** A left list of three large words acting as **tabs** (the active one is white, the others `--text-3`). The section is **sticky**: scrolling through it advances the active word, and clicking a word does the same thing. Under reduced motion or below 768px it becomes three stacked blocks. Active content: tag line in cyan ("✦ Unforgettable meetings…quite literally"), paragraph, "GET STARTED. IT'S FREE." pill. Right: a product frame (summary card) on a **solid cyan circle** backdrop. Switching happens on click or as the sticky section advances.
7. **CTA block.** Solid `--purple` panel, radius 24, headline + two pills (TALK TO SALES cyan, VIEW PRICING yellow). Decorative concentric circles as solid 2px strokes are allowed; no gradient fill.
8. **Footer** (§1.8).

### 1.3 Overview `/overview`
1. Hero, centred: "Meeting intelligence **built around you**", sub text, yellow pill "GET STARTED. IT'S FREE."; flat purple moon SVG at the bottom-left; below it, a **mock meeting frame**: 2×3 grid of participant tiles (initials avatars), the active speaker with a cyan border, plus a docked side card "Project check-in" (Summary | Scratchpad tabs, bullets, "@Jordan to follow up with security", "Listening…", waveform icon, "End" button).
2. Badge row: rating pill + compliance pill (sample).
3. "Used and loved by more than **300,000 companies** world-wide" + 8 logo tiles (wrap).
4. "Never miss **what matters**" section on `--bg-app`: left text "Instant AI summaries in your favorite meeting platform" + paragraph; right, a product card on a **solid purple** panel with Zoom / Meet / Slack icon tiles.
5. Further feature rows (alternating left/right text + product frame), CTA, footer.

### 1.4 Solutions template `/solutions/[slug]`
Content comes from `content/solutions.ts` (customer-success, marketing, sales, teams). Layout (from the Customer Success screenshots):
1. Hero: left huge headline ("Customer success that actually scales"), paragraph, pills "GET STARTED. IT'S FREE" (cyan) + "TALK TO SALES" (yellow). Right: product frame (My Calls / Team calls + Fathom AI chat card) on a **solid orange** block with a flat astronaut SVG peeking over.
2. "Why {audience} teams choose {Brand}": 3 alternating rows (headline + paragraph | product frame on a solid purple / orange / pink panel): "Stay present with customers", "Never lose context – even across handoffs", "Turn insight into action".
3. "Built for the **{audience} lifecycle**": 3 cards with a **solid 1px border** (cyan / pink / yellow), title, subtitle, bullet list, and a small ✦ icon at the bottom-left.
4. "Powering customer-facing **teams at scale**": left title; right 2×2 features (icon, title, text).
5. Two cards: "Real impact for {audience} teams" (bullets) and "Built for trust" (bullets + note + Trust Center link), each with a flat round badge illustration.
6. CTA: solid `--purple` panel, concentric solid circle strokes, small line, headline "Turn customer conversations into momentum", pills TALK TO SALES + VIEW PRICING.

### 1.5 Integrations `/integrations` and `/integrations/[slug]`
- Index: title, category filter chips (All, Meeting platforms, AI, CRM, Productivity, Developer); grid of integration cards (icon tile, name, one line, "Learn more"). Categories: Zoom, Google Meet, Teams (Meeting platforms); ChatGPT, Claude (AI); HubSpot, Salesforce (CRM); Slack, Zapier, Asana (Productivity); Public API & MCP (Developer).
- Detail: hero (icon + name + description + "Get started" pill), "What you can do" 3 feature cards, "How it works" 3 numbered steps, CTA. Meeting platforms say "Available"; others say "Coming soon in this demo".

### 1.6 Pricing `/pricing`
- Toggle Monthly / Annual (a segmented control, not a gradient switch).
- 4 plan cards: Free, Premium, Team, Business. Each: name, price, one line, CTA, feature list with ✓. "Most popular" chip on Team (solid yellow chip).
- Feature comparison table below, with a sticky header row while the table is in view.
- FAQ accordion.
- All CTAs → `/signup`.

### 1.7 Other public pages
- `/resources/whats-new`: changelog list (date, title, tag, paragraph), newest first, pagination.
- `/help`: search box + category cards + FAQ accordion (the same FAQ feeds the Help bot).
- `/legal/terms`, `/legal/privacy`, `/security`, `/status` (static status list: Web app, Recording, Transcription, AI summaries, each "Operational" with a green dot).

### 1.8 Footer
`--bg-app` background. Logo at the top-left. Columns: **Product** (Overview, Pricing, What's New) + **Company** (About Us, Careers); **Solutions** (For Sales, For Marketing, For Customer Success, For Teams); **Integrations** (Asana, ChatGPT, Claude, HubSpot, Salesforce, Zapier, Public API & MCP, All Integrations); **Competitors** (Competitor Overview, vs. Fireflies, vs. Granola, vs. Gong, vs. Otter, vs. Read AI, vs. ZoomMate, vs. Google Meet's Gemini, vs. Built-in Solutions → all link to one "Comparison" template page); **Resources** (Resource Hub, Help Center, Partner Program). Right: cyan pill "TRY FATHOM TODAY". Bottom row: Terms of Service · Privacy Policy · Security & Compliance · Status, and "© {year} All Rights Reserved".

---

## 2. Auth

### 2.1 Sign up `/signup` (and Log in `/login`)
Two columns on `--bg-black`, logo centred at the top.
- **Left card** (`--surface-1`, radius 24, border): 🚀 emoji, "Sign up for {Brand}", "Connect your work email to get started in minutes", white buttons **[G] Continue with Google** and **[⊞] Continue with Microsoft** (h 64, radius 8, black text), "Already have a {Brand} account? **Sign in**", small legal line with Terms / Privacy links.
- **Right:** big quote marks (solid `--surface-3` glyphs), quote "'Work smarter, not harder,' they said." + orange bold line "{Brand} took it personally.", author and role.
- `/login` is identical with the title "Welcome back" and the link reversed.
- States: button loading spinner; OAuth error toast; Microsoft disabled with a tooltip if not configured.

---

## 3. Onboarding `/onboarding/[step]`

Shared shell: `--bg-app`, logo top-centre, 2px solid cyan progress bar at the top edge (width = step / 6), small uppercase step label, content centred, footer "👤 Signing up as **{email}**. Wrong account? **Sign out**". Continue buttons are 450px wide, outline cyan when enabled, `--surface-2` greyed when disabled.

| Step | Screen |
|---|---|
| **1. account-type** | Headline in two lines: orange "Are your meetings on your company calendar?" + white "We recommend using your work email." Line: "**{email}** looks like a personal email" (only if the domain is personal). Two cards: **Personal use only** ("Suited for one-off calls"; ○ View only your own meetings, ○ No shared workspace, ○ Cannot convert to a team plan later; button "Continue with Personal Email" grey) and **Individual or Team use** ("RECOMMENDED" chip; orange ✓ Set individual and team preferences, ✓ Create private and shared workspaces, ✓ Add teammates anytime; button "Continue with Work Email" cyan). In this clone both continue with the same account; the choice sets `account_type`. |
| **2. preferences** | Label "SET UP YOUR PREFERENCES". Sentence: "Take notes on [All meetings in my calendar ⌄] and share with [All attendees ⌄]". Checkbox: "I understand I'm responsible for collecting attendee consent for the recording and transcription, in accordance with applicable laws." Continue is disabled until ticked. |
| **3. about-you** | "TELL US ABOUT YOURSELF". Sentence: "I work in [Select Department ⌄] as [Select Your Role ⌄]". Department: Sales, Customer Success, Marketing, Product, Engineering, Design, Operations, HR, Finance, Leadership, Other. Role: Individual Contributor, Manager, Director, VP, C-Level/Founder, Consultant, Student. |
| **4. usage** | "PERSONALIZE YOUR ACCOUNT" / "How are you planning to use {Brand}?" Two choice cards **By Myself** / **With My Team** (selected = cyan border). Team → creates a workspace named "{First name}'s Team". |
| **5. connect** | "CONNECT YOUR MEETING PLATFORMS" / "Connect a platform so {Brand} can create meetings and send your notetaker". Rows: Google Meet [Connect] · Zoom [Connect] · Microsoft Teams ("Paste any Teams link – no connection needed" ✓). Connected rows show "✓ Connected as {email}". Link "Skip this step". Bottom note: "👍 Don't worry, {Brand} will only join the meetings that you ask it to. You're in control here." |
| **6. first-call** | "YOU'RE ALL SET" / "Capture your first meeting". Three cards: **Send notetaker to a meeting** (paste link), **Record a browser tab** (Chrome/Edge badge), **Upload a recording**. Plus "Go to My Calls →" and the note "{Brand} runs fully in your browser – nothing to install." |

---

## 4. App shell `(app)/layout.tsx`

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ FATHOM≡   [🔍 Search Call Recordings        ]      [+ New Meeting]  🎁 Refer  ⚙ Settings  ⛑ Help & Feedback  ★25  (M) │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  My Calls   Team Calls   Playlists   Alerts   Deals                                            │
├───────────────────────────────────────────────────────────────────────┬──────────────────────┤
│                                                                       │ ✧ ASK FATHOM     [⇥] │
│                         page content                                  │ (notice banner)      │
│                                                                       │                      │
│                                                                       │   suggestion chips   │
│                                                                       │ [Ask anything…     ] │
│                                                                       │ [My Calls ⌄]     (↑) │
└───────────────────────────────────────────────────────────────────────┴──────────────────────┘
(onboarding avatar bubble bottom-left: "Start your onboarding here!" → opens Tutorial modal; dismissible)
```
- **Top bar** h 64, `--bg-app`, bottom border. Search 400px wide: press Enter → `/calls?q=…`; `/` focuses it.
- **+ New Meeting** (primary cyan): the entry point for all three capture paths (§4.1).
- **Refer** → popover (§4.3). **Settings** → `/settings`. **Help & Feedback** → widget (§4.4). **★ 25** → tooltip "Credits earned from referrals". **Avatar** → menu (§4.2).
- **Tabs** row h 56; active = cyan + underline.
- **Ask panel** (360px) is visible on My Calls and Team Calls, toggled with ⇥. Its open state is remembered.
- **Recording bar:** while any capture is active, a solid `--danger-tint` bar appears under the tabs: "● Recording · Product Strategy · 12:47 · [Open overlay] [End]".

### 4.1 New Meeting dialog
Modal 640px, three tabs:
1. **Create meeting:** Title input · Platform segmented control [Google Meet | Zoom] (disconnected ones show "Connect" inline) · checkbox "Send notetaker automatically" (default on) · [Create & open]. Result screen: "Your meeting is ready", link with a copy button, [Join meeting ↗] (opens a new tab), notetaker status line, [Open overlay].
2. **Join with notetaker:** Meeting link input (validates meet.google.com / zoom.us / teams.microsoft.com / teams.live.com) · Title (optional) · [Send Notetaker]. Result: status stepper **Joining → Waiting to be admitted → Recording** with the text "Admit '{Bot name}' when it asks to join."
3. **Record or upload:** two sub-cards.
   - **Record this tab:** capture mode radio (● Audio only (recommended) / ○ Audio + video), consent reminder, [Start recording]. Firefox/Safari: disabled card with "Use Chrome or Edge".
   - **Upload:** drag-and-drop zone, formats "MP3 · WAV · M4A · WEBM · MP4", size limit note, progress bar (solid cyan fill), then "Processing…".

### 4.2 Avatar menu
Items: Start Test Call (opens New Meeting → Record tab) · Tutorial · FAQs · Developers │ Privacy Policy · Terms of Service · Security & Compliance · System Status │ Download App (→ modal "{Brand} is web-only in this build") · Logout │ "Logged in as {email}".

### 4.3 Refer popover (360px)
"🎁 REFERRAL CODE" (cyan), text "Give and get a month of Premium for free when people sign up with your link.", read-only input `https://{domain}/invite/{code}` + cyan [Copy] (→ "Copied!"), outline buttons [Tweet 🐦] [LinkedIn in] (open share intents in a new tab), gold note about the partner program with a link.

### 4.4 Help & Feedback widget
White card (the only light surface in the app, as in the original) 400×640, anchored top-right. Header: logo, "{Brand} Support", "We're here to help!", icons ✎ new conversation, ⤢ expand, ⌄ close. Bot bubble "Hey there 👋 How can we help you today?" + quick replies: 🤖 Ask AI – INSTANT, ✉ Open a Ticket – <1 biz day, 💡 Share Feedback.
- Ask AI → chat grounded on the FAQ.
- Ticket / Feedback → a small form (subject, message) → saved → confirmation bubble.
- Bottom tabs: **Conversation | Help center** (Help center = FAQ search list).

---

## 5. In-meeting overlay (PiP window 340×520)

```
┌───────────────────────────────┐
│ FATHOM≡      ● REC  12:47   ⤢ │  header: status dot (red when recording), timer, "back to app"
│ Product Strategy · Google Meet│
├───────────────────────────────┤
│ Notetaker: Recording ✓        │  bot status line (bot path) / "Capturing this tab" (tab path)
├───────────────────────────────┤
│ [■ HIGHLIGHT] [■ POSITIVE]    │  one button per tag, tag colour square + name
│ [■ NEEDS REVIEW] [■ FEEDBACK] │  click → toast "Highlighted at 12:47"
├───────────────────────────────┤
│  Summary │ Scratchpad         │
│  ───────                      │
│  Listening…                   │  Summary tab: stretch goal live notes; otherwise the text
│                               │  "Your summary will be ready right after the call"
│  (Scratchpad: textarea, autosave)
├───────────────────────────────┤
│ ≋≋ mic level      [ ◉ End ]   │  simple level meter (solid bars), End = danger outline
└───────────────────────────────┘
```
- States: *Waiting to be admitted* (yellow line + "Admit '{Bot name}' in your meeting"), *Recording*, *Ending…*, *Uploading 64%*, *Done → "View call" button*.
- If PiP is unsupported: the same component renders as a docked 340px panel at the bottom-right of the app.

---

## 6. My Calls `/calls`

- Page header row: "My Calls" is implied by the tab; right side has filters [Platform ⌄] [Any date ⌄] [☐ Has action items] and a sort (Newest / Oldest).
- **Month groups:** heading "September 2026" (16/600), then a grid of call cards (4 columns at ≥1440, 3 at ≥1024, 2 at ≥768).
- **Call card:** thumbnail (video frame, or a platform tile with a big solid platform-colour icon for audio-only), duration badge "42 mins", title, date "Sep 21, 2026", counts "▣ 3  ✓ 5". While processing: thumbnail covered by a solid `#000000CC` overlay with a status badge + small progress text ("Transcribing…"). Failed: red badge + [Retry].
- Hover: card surface lightens one step, and a ⋮ menu appears (Rename, Share, Add to playlist, Delete).
- **Search results mode** (`?q=`): "12 results for 'pricing'" + result rows (card thumbnail left; title/date; 1–3 snippet lines with the match bolded and a timestamp chip that opens the call at that moment). [Clear search].
- **Empty:** centred ⊘ "No call recordings" + [+ New Meeting] + secondary link "Try the demo call".
- **Pagination:** 24 calls per page with a "Load more" button (no infinite scroll).

## 7. Call page `/calls/[id]`

```
┌──────────────────────────────────────────────────┬─────────────────────────────────────┐
│ ┌──────────────── PLAYER 16:9 ────────────────┐  │ Product Strategy ✎                   │
│ │                                              │  │ Sep 21, 2026 · 42 min · Google Meet │
│ │  🔊 2:38 ───────●──────────────  1x  ⛶       │  │ [ Share ⛓ ]                    [ ⋮ ]│
│ └──────────────────────────────────────────────┘  │                                     │
│  markers on the timeline = highlights (tag colour)│ ATTENDEES                            │
│  [+ Highlight at 2:38]                            │ (A) Abdul (Speaker A) ✎             │
│                                                  │ (S) Sara  (Speaker B) ✎             │
│  SUMMARY   TRANSCRIPT   ASK FATHOM               │                                     │
│  ───────                                         │ ACTION ITEMS                    3/5 │
│  [General ⌄] [By topic ⌄]   [Copy] [↻ Regenerate]│ ☐ Prepare beta checklist            │
│                                                  │   @ 4:38  👤 Abdul                   │
│  Meeting purpose                                 │ ☑ Contact agency  @ 9:15  👤 Sara    │
│  • …                                             │ [+ Add action item]                 │
│  Key takeaways                                   │ (auto off → [Extract Action Items   │
│  • … @1:12                                       │   from Transcript])                 │
│  Topics                                          │                                     │
│  ▸ Beta launch                                   │ HIGHLIGHTS  🔒 INTERNAL TEAM ONLY    │
│     • … @2:04                                    │ ■ Demo: using it on Zoom  @ 0:41    │
│  Decisions · Next steps · Questions              │ ■ Pricing objection       @ 2:37    │
└──────────────────────────────────────────────────┴─────────────────────────────────────┘
```
- **Player:** HTML5 `<video>`/`<audio>` with custom controls (play/pause, time, seek bar with highlight markers, playback speed 1x/1.5x/2x, volume, fullscreen). Keyboard: Space, ←/→ 5s.
- **Summary tab:** template dropdown (General, Sales, Customer Success, 1:1, Stand-up, Interview → confirm "Regenerate summary?"); order dropdown (By topic / Chronological); Copy (Markdown to the clipboard); Regenerate. Sections render only if non-empty. Every `@ m:ss` chip seeks the player.
- **Transcript tab:** search input with match count and ↑↓; rows of `[avatar] Speaker name · 2:04` + text. The current row is highlighted with `--surface-2` during playback, and auto-follow keeps it in view unless the user has manually scrolled the pane (in which case a "Resume follow" button appears). Click a row to seek. [Download .txt].
- **Ask Fathom tab:** chat; empty state with chips "What were the decisions?", "List action items by person", "What objections came up?". Answers stream; `[m:ss]` citations are chips.
- **Right column:** title inline-edit (Enter saves). **Share** popover: access select (Anyone with the link can view / Workspace members / Only me), link + Copy, [Regenerate link]. **⋮**: Rename, Add to playlist, Change visibility (Private / Workspace), Download transcript, Delete call.
- **Attendees:** speaker label → name mapping (edit renames that speaker everywhere).
- **Action items:** checkbox toggles `done` (optimistic); inline edit text/assignee; add; delete on hover.
- **Highlights:** tag square + note + time; click seeks; ⋮ edit/delete/add to playlist.
- **Processing states:** the whole left column shows a status card (stepper: Recorded ✓ → Transcribing ● → Summarizing ○) and the right column shows skeletons; the page polls every 4s until ready. Failed: message + [Retry].

## 8. Team Calls `/team`
- **Personal account / no workspace:** upsell page, as in the screenshot: left "FATHOM TEAM EDITION", headline "Bring the productivity boost of {Brand} to your entire team", 3 gold ✓ bullets, outline cyan [Start 14-Day Trial] (→ converts to a team account and creates a workspace), link line; right a product frame (screenshot of our own Team Calls).
- **Team account:** header row with the workspace name, members count, [Invite teammates] (dialog with an invite link + Copy), filter [All members ⌄]. Grid identical to My Calls, with the owner avatar on each card. A **Members** side card lists members (name, role, calls count).

## 9. Playlists `/playlists`, `/playlists/[id]`
- **Empty:** explainer from the screenshot: "PLAYLISTS" label, "Create shareable playlists of highlights", text, 3 gold bullets (Organize feedback across multiple meetings · Create training libraries of key moments · Share customer testimonials), [+ New playlist].
- **List:** each playlist is a row: title, "3 Highlights (18 min) · Last updated Nov 25", then a row of up to 4 highlight cards (thumbnail with a tag-colour top border, call title, date, a one-line note). "+N more" links to the detail page.
- **Detail:** title/description inline-edit, [Share], [⋮ Delete]. Left: player playing the selected clip (start → end). Right: ordered list of highlights with ↑ ↓ move buttons and remove ×. "Play all" advances to the next clip automatically when one ends. That's clip playback, not scrolling, so it's allowed.
- **Add to playlist** dialog (from call page / highlight): list of playlists with checkboxes + "New playlist" input.

## 10. Alerts `/alerts`
- **Stretch (functional):** "Keyword alerts": input + [Add alert]; list of keywords; below, "Recent matches" (call, snippet, timestamp chip).
- **Fallback (shell):** redirects to My Calls, as in the real product, with a toast "Alerts are coming soon".

## 11. Deals `/deals` (shell)
- An upsell card at the top ("Deal intelligence is available on Business – Start trial"), plus a **sample table** (clearly labelled "Sample data"): Deal, Company, Stage, Amount, Calls, Close Date ⇅, with a filter row [All Deals ⌄] [Any Close Date ⌄]. Buttons open a "Coming soon" modal.

## 12. Settings `/settings`
A single centred column (900px), sections separated by 64px, section labels uppercase `--text-3` 20/700.

1. **Top sentence:** "Auto-record [All meetings ⌄] and auto-share [Summary & recording ⌄] with attendees".
2. **VIDEO CONFERENCING**
   - **Zoom:** "Zoom: **Fully Enabled**" (green) when connected, else "Not connected" + [Connect]. Rows: Enhanced Recording (toggle, ⓘ tooltip), Auto-capture unscheduled Zoom meetings (toggle), Disable "Recording in progress" audio notification ([Update in Zoom Settings ↗] outline).
   - **Google Meet:** "Google Meet: **Fully Enabled**" or "**Partially Enabled**" (yellow) with "Usage limited to scheduled calls…" text; in this clone: "Connected — create meetings & send notetaker" or [Connect]. Row: Auto-capture unscheduled Google Meet meetings (toggle).
   - **Microsoft Teams:** "Microsoft Teams: **Enabled via meeting link**" (green) + description.
3. **PREMIUM FEATURES** with a right-aligned gold "🎁 30 DAYS LEFT IN FREE PREVIEW: UPGRADE NOW – LEARN MORE" (links to pricing).
   - 🤖 **Bot Name:** "{First}'s {Brand} Notetaker" + [Edit ✎] → inline input + Save.
   - ✦ **Auto-Generate Action Items** (RECOMMENDED chip) – toggle.
   - ✦ **Default Meeting Summary Template** – [▤ Enhanced ⌄] select (General/Enhanced, Sales, CS, 1:1, Stand-up, Interview).
   - 🖼 **Recording Notification Banner** (PREVIEW chip, opens a preview modal of the bot tile / overlay banner) – toggle, with the warning text.
4. **INTEGRATIONS:** rows for Claude, ChatGPT, Zapier, Slack, Salesforce ("Learn More" link), HubSpot, Task Manager (with a row of small app icons) → each [Connect ⛓] opens "Coming soon in this demo". Link "See all our integrations ↗".
5. **API ACCESS:** API Access ([Add +] → modal "Coming soon") · MCP Server ([Set Up ↗] → modal).
6. **OPTIONS:** Auto Request Recording Consent (RECOMMENDED, toggle) · Default Share Link Access ([🌐 Anyone with the link can view ⌄]) · In-meeting Chat Interface (toggle) · Use my anonymized data to improve AI (toggle, Learn More).
7. **{BRAND} APPS:** Desktop App (RECOMMENDED chip, [Configure ⚙] → web-only modal) · Chrome Extension ([Install ⓘ] → web-only modal) · Zoom App ([Connect]/[Disconnect] mirrors the Zoom connection).
8. **HIGHLIGHT OPTIONS:** list of tags: colour square + UPPERCASE name in the tag colour; left ↑↓ reorder buttons (the first tag "HIGHLIGHT" is fixed); right 🗑 delete (confirm). Click a name to rename; click the colour square to open an 8-colour swatch picker. "+ ADD MORE" adds a row.
9. **DELETE ACCOUNT:** red text "Deleting your account is permanent. All recordings and data will be deleted." + [Delete Account 🗑] (danger tint) → confirm dialog requiring the user to type "DELETE".

All toggles and selects save instantly (optimistic) with a small "Saved" toast; failures revert with an error toast.

## 13. Public share page `/share/[token]`
- A minimal top bar: logo, call title, "Shared by {name}", [Sign up free] pill.
- Same two-column layout as the call page, **read-only**: player, Summary and Transcript tabs (no Ask, no edit, no internal highlights). Action items shown read-only.
- Invalid or revoked token: centred message "This link is no longer available" + button home.
- Playlist share page: player + ordered clip list, read-only.

## 14. Seed / demo content
- One demo call "Welcome to {Brand} – Product Strategy (demo)": ~6 min audio, 3 speakers, full transcript, summary, 5 action items, 4 highlights across all tag colours, one playlist "Best moments". Created for every new user on onboarding completion (copied rows, not shared), so the first screen is never empty.

## 15. Screen inventory (for tracking)

| # | Route / surface | Tier |
|---|---|---|
| 1 | `/` Home | Static UI |
| 2 | `/overview` | Static UI |
| 3 | `/solutions/[slug]` ×4 | Static UI (template) |
| 4 | `/integrations`, `/integrations/[slug]` | Static UI (template) |
| 5 | `/pricing` | Static UI |
| 6 | `/resources/whats-new`, `/help`, legal, `/security`, `/status`, comparison template | Static UI |
| 7 | `/signup`, `/login` | Real |
| 8 | `/onboarding/*` ×6 | Real |
| 9 | App shell + Ask panel + New Meeting + menus + Refer + Help widget | Real |
| 10 | PiP overlay | Real |
| 11 | `/calls` | Real |
| 12 | `/calls/[id]` | Real |
| 13 | `/team` | Functional |
| 14 | `/playlists`, `/playlists/[id]` | Functional |
| 15 | `/alerts` | Functional (stretch) / Shell |
| 16 | `/deals` | Shell |
| 17 | `/settings` | Functional |
| 18 | `/share/[token]`, `/share/playlist/[token]` | Real |
