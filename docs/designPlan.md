# Design Plan — Fathom Clone

> The visual system and design rules. Screen-by-screen specs live in `UI.md`.

---

## 1. Hard constraints (non-negotiable)

These override anything in the reference screenshots.

| ❌ Not allowed | ✅ Use instead |
|---|---|
| **Gradients** of any kind (backgrounds, text, borders, buttons, glows, the rainbow card borders, the purple→pink panels) | Solid fills from the token palette; a solid 1px border for emphasis |
| **Mesh gradients / blurred colour blobs** | Flat solid colour blocks |
| **Background grids, dot grids, star fields or noise patterns** | Solid `--bg` backgrounds |
| **Scroll-jacking:** hijacking the wheel, snapping the page to full-screen sections, delaying or blocking normal scrolling | The page always scrolls at the speed the user expects |
| Glassmorphism / backdrop blur | Opaque surfaces |
| **Infinite scroll** in the app's data lists (My Calls, Team Calls, search) | Pagination or a "Load more" button, so positions stay stable |

**Scrolling and scroll-driven motion are allowed** (see §7 for the exact list): section reveals, a sticky section, marquees, a sticky header, and the horizontal marquee on the logo row. Scrollable panes (transcript, Ask chat, menus) keep visible, styled scrollbars.

---

## 2. Design direction

Two surfaces, one brand:

| | Public site | Product app |
|---|---|---|
| Mood | Bold, playful, "space" theme | Dense, calm, dark SaaS tool |
| Background | `--bg-black` #000000 | `--bg-app` #1B1B1D |
| Type | Large display headlines (56–96px) | 13–16px UI text |
| Illustration | Flat, solid-colour SVG planets, rocket, astronaut (2–3 colours each, no shading gradients) | None; product imagery only |
| Buttons | Pill, uppercase, condensed font | Rounded rectangles (8px), sentence case |

The space theme stays **without gradients or star fields**. Planets are flat circles with a few solid-colour crater and stripe shapes. Sparkle stars (✦) are individual static SVG icons placed next to content, never a background pattern.

---

## 3. Colour tokens

Define once as CSS variables in `app/globals.css` and map them into Tailwind (`theme.extend.colors`).

```css
:root {
  /* surfaces */
  --bg-black:      #000000;  /* marketing background */
  --bg-app:        #1B1B1D;  /* app background */
  --surface-1:     #232326;  /* cards, settings rows */
  --surface-2:     #2C2C30;  /* inputs, dropdown triggers, hover */
  --surface-3:     #36363B;  /* pressed / selected */
  --border:        #34343A;
  --border-strong: #4A4A52;

  /* text */
  --text-1: #FFFFFF;
  --text-2: #B4B4BC;         /* secondary */
  --text-3: #7C7C86;         /* muted, section labels */

  /* brand */
  --cyan:        #00B8F5;    /* primary: CTAs, active tab, links */
  --cyan-press:  #0098CC;
  --cyan-tint:   #0F2A36;    /* "Connect" button bg in settings */
  --yellow:      #FFF38A;    /* secondary pill CTA (marketing) */
  --orange:      #FF7A1A;    /* accent headline words, "took it personally" */
  --gold:        #FFC21A;    /* credits star, upsell bullet text, "Coming soon" */
  --purple:      #9B1CFF;    /* solid panel colour: CTA blocks, feature panels */
  --pink:        #FF9EC7;    /* planet / illustration accent */

  /* status */
  --success: #22C55E;        /* "Fully Enabled", toggles on */
  --warning: #FACC15;        /* "Partially Enabled" */
  --danger:  #EF4444;        /* Disconnect, Delete account, End */
  --danger-tint: #3A1518;

  /* highlight tags (defaults, user-editable) */
  --tag-highlight: #00B8F5;
  --tag-positive:  #22C55E;
  --tag-review:    #FACC15;
  --tag-feedback:  #FF7A1A;
}
```

**Rules**
- One accent per component. Cyan means "primary action / active". Orange and gold are for emphasis text only.
- Text on `--cyan` buttons is **black** (#000) for contrast, as in the original.
- Contrast: body text ≥ 4.5:1, large text ≥ 3:1. `--text-3` is only for labels ≥ 12px bold/uppercase.
- The site is dark only (like Fathom). Set `color-scheme: dark` and explicit backgrounds on `html`/`body`.

---

## 4. Typography

| Role | Font | Size / weight | Used for |
|---|---|---|---|
| Display | **Sora** (Google Fonts) | 56 / 72 / 96px, weight 300–400, tight tracking (-0.02em) | Marketing hero and section titles |
| Display bold word | Sora | same size, weight 600 | "built **around you**", "what **matters**" |
| Pill button | **Barlow Semi Condensed** | 18–20px, 500, uppercase | "GET STARTED. IT'S FREE.", "SIGN UP FREE" |
| UI | **Inter** | 13 / 14 / 16px, 400–600 | Entire app, onboarding, settings |
| UI heading | Inter | 20 / 24 / 28px, 600 | Page and card titles |
| Section label | Inter | 13px, 600, uppercase, letter-spacing .06em, `--text-3` | "VIDEO CONFERENCING", "SET UP YOUR PREFERENCES" |
| Mono (timestamps) | **JetBrains Mono** or Inter tabular-nums | 12–13px | `@ 4:38`, transcript times, timers |

Load with `next/font/google` (no layout shift). Use `font-variant-numeric: tabular-nums` on every timer, duration and count.

---

## 5. Spacing, radius, elevation

- **Spacing scale (px):** 4, 8, 12, 16, 20, 24, 32, 40, 56, 80, 120. Marketing sections are separated by 120px (desktop) and 72px (mobile).
- **Radius:** 6 (tags, chips), 8 (buttons, inputs), 12 (cards, settings rows), 20 (marketing product frames, onboarding choice cards), 999 (pills, avatars).
- **Elevation:** no shadows on dark surfaces. Separation comes from surface steps (`--surface-1/2/3`) and 1px `--border`. Popovers and menus get `--surface-2` plus a `--border-strong` border.
- **Layout widths:** marketing container 1200px (max 1280). App content is full width with 32px gutters. Settings column 900px centred. Onboarding content 900px centred.

---

## 6. Components (design specs)

| Component | Spec |
|---|---|
| **Pill CTA (marketing)** | h 56, px 40, radius 999, Barlow Semi Condensed uppercase 20px. Primary = `--cyan` bg, black text. Secondary = `--yellow` bg, black text. Outline = 1.5px `--cyan` border, cyan text (header "SIGN UP FREE"). Hover: bg shifts to the `-press` shade; no glow. |
| **Button (app)** | h 36/40, radius 8, Inter 14/600. Variants: primary (cyan/black), secondary (`--surface-2`/white), tint (`--cyan-tint`/cyan text, as the Settings "Connect ⛓" buttons), danger (`--danger-tint`/red text), ghost. |
| **Sentence select** (onboarding and settings) | Inline dropdown trigger inside a sentence: `--surface-2` bg, radius 6, 16–20px, chevron ⌄. Example: "Take notes on [All meetings in my calendar ⌄] and share with [All attendees ⌄]". |
| **Choice card** | 320×200, `--surface-1`, radius 12, icon + label. Selected: 1.5px `--cyan` border. |
| **Settings row** | `--surface-1`, radius 12, padding 24; left icon 40px (white rounded tile for brand logos); title 18/600 + description 14 `--text-2`; right control (toggle / button / select). |
| **Toggle** | 44×24. Off: `--surface-3` with ⊗ knob. On: `--cyan` with ✓ knob (as in the original). |
| **Tabs (app top nav)** | 20px Inter 500 text tabs; active = cyan text + 2px cyan underline. |
| **Call card** | 16:9 thumbnail radius 8, duration badge bottom-right (black 70% solid → use `#000000CC`, a flat translucent colour, not a gradient), title 16/600, date 13 `--text-2`, counts row (▣ highlights in cyan, ✓ actions in gold). |
| **Status badge** | Pill 12px: Joining (surface), Waiting to be admitted (warning), Recording (danger dot), Processing (cyan, animated dots), Failed (danger). |
| **Timestamp chip** | Mono 12px, `@ 4:38`, cyan text, underline on hover, click = seek. |
| **Assignee chip** | 12px, gold text on `#3A3316`, person icon. |
| **Tag pill** | Colour square 16px + uppercase tag name in the tag colour (Settings "Highlight options"). |
| **Popover / menu** | `--surface-2`, radius 10, border `--border-strong`, 8px padding, items h 36, dividers. |
| **Ask panel** | Width 360, `--bg-app` with left border. Header "✧ ASK FATHOM". Suggestion chips right-aligned (outline pills). Input with scope select (My Calls ⌄) and circular send button. |
| **Onboarding shell** | Centred logo top (h 32), 2px cyan progress bar at top edge (solid), footer "Signing up as …". |
| **Planet / illustrations** | Flat SVG, max 3 solid colours, no gradient defs, no filters or blur. Static. |

---

## 7. Motion rules (Motion library)

### 7.1 Interaction motion (≤ 200ms, `ease-out`)
- Hover/press on buttons and cards (colour change; scale 0.98 on press).
- Dropdown, popover and modal open/close (fade + 4px translate).
- Tab underline sliding between tabs (`layoutId`).
- Carousel slide change (crossfade), on click **or** on a slow autoplay (see below).
- Status indicators: recording dot pulse, "Processing…" dots, "Listening…" dots.
- Toasts in/out.

### 7.2 Scroll-driven motion — marketing pages only
| Effect | Where | Spec |
|---|---|---|
| **Section reveal** | Every marketing section | `whileInView` with `once: true`, `margin: '-80px'`: opacity 0→1, y 16→0, 320ms `ease-out`. Children stagger 60ms, max 6 children. Never on text the user is already reading. |
| **Sticky header** | Marketing header | Becomes `position: sticky` after 80px, with a solid `--bg-app` background and a bottom border. Height stays the same (no shrink animation). |
| **Marquee** | "Move work forward faster" banner, logo row | Continuous horizontal loop, ~40s per cycle, CSS `transform` only. **Pauses on hover and on focus within**, and is duplicated for a seamless loop. Purely decorative → `aria-hidden` with the text also present in a static, accessible form. |
| **Sticky feature section** | The Clarity / Momentum / Ease section | The word list sticks while the panel beside it changes as you scroll (one section, max 3 steps, total height ≤ 300vh). The words stay clickable; scroll only mirrors what a click does. |
| **Scroll progress** | Long pages (Solutions, Pricing) | Optional 2px solid cyan bar under the header. |
| **Carousel autoplay** | Home feature showcase | Advances every 7s, **stops permanently** on any user interaction; arrows and dots remain the primary control. |
| **Count-up numbers** | "300,000 companies" | Counts up once when it enters view, 600ms. |

Rules for all of the above:
- Use `transform` and `opacity` only, never animate layout properties; add `will-change` sparingly.
- Everything in this table is **disabled under `prefers-reduced-motion: reduce`**: content renders in its final state, marquees are static, the sticky section becomes three stacked blocks.
- **No parallax on text**, no effects that move content away from the pointer, nothing that delays the page becoming readable.
- **Product app pages have no scroll-driven motion.** They are tools; keep them still.

---

## 8. Imagery and content

- **No Fathom logo files and no real customer logos.** Recreate the wordmark as text ("FATHOM" + a simple 3-bar SVG mark in cyan) and use neutral placeholder company names for the logo wall (e.g. "Northwind", "Acme", "Globex"). Keep `BRAND_NAME` in one config constant.
- **Product frames** on the marketing site are **real screenshots of our own app** (taken on Day 3), placed in `--surface-1` frames with 20px radius, or live React components with seed data.
- **People photos:** avoid stock faces. Use initials avatars (solid colour circles) in mock meeting tiles.
- **Integration icons:** simple monochrome icons or first-letter tiles in white rounded squares. No third-party brand logos in the product UI.
- **Testimonials / ratings:** mark as sample content; no real names or review counts.

---

## 9. Responsive rules

| Breakpoint | Public site | App |
|---|---|---|
| ≥1280 | Full layout, 2-column heroes | Content + Ask panel side by side |
| 1024–1279 | Tighter gutters | Ask panel collapses to a toggle button |
| 768–1023 | Heroes stack; menus become a full-screen sheet (opened by click) | Tabs stay; call page stacks (player, then side column) |
| < 768 | Single column; 40px display type | "Best on desktop" note; lists and call page readable; capture disabled with an explanation |

Reflow is purely width-based. Below 768px, drop the sticky feature section to stacked blocks and keep marquees at a slower speed.

---

## 10. Accessibility

- All interactive elements reachable by keyboard; visible 2px cyan focus ring (offset 2px).
- Dropdowns, menus, dialogs and tabs use Radix primitives (correct ARIA).
- Transcript: `aria-live="off"`; the current-segment highlight is not announced. Status changes announce once via a polite live region.
- Timestamps are real `<button>`s with labels like "Jump to 4 minutes 38 seconds".
- Colour is never the only signal (tags also have names; statuses have text).

---

## 11. Design QA checklist

- [ ] `grep -ri "gradient" app components` returns nothing (no `bg-gradient-*`, no `linear-gradient`, no `radial-gradient`).
- [ ] Scroll effects appear only on marketing pages, and only the ones listed in §7.2; `grep -r "whileInView\|useScroll" app/\(app\)` returns nothing.
- [ ] Reveals use `once: true` (content never re-hides), and every scroll effect is off under `prefers-reduced-motion`.
- [ ] No `scroll-snap` on the page container and no wheel/scroll event handlers that block scrolling.
- [ ] Marquees pause on hover/focus and are `aria-hidden` with accessible text elsewhere.
- [ ] No background images or patterns on `body`/sections except solid colours.
- [ ] Every page checked at 360, 768, 1280, 1440 widths; no horizontal page scroll.
- [ ] Focus visible on every control; reduced-motion respected.
- [ ] Timers and durations use tabular numbers.
