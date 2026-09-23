# MVP Audit — Prompt 1

Living status of the build against Prompt 1's scope and self-verification loop.
Updated as slices land. **This build is in progress** (the docs structure it as a
loop; Prompt 2 continues from here).

## How to run it

The AI/meeting providers run in mock mode (`MOCK_PROVIDERS=true`), so no
Deepgram/Anthropic/Recall/Google/Zoom keys are needed. Supabase (auth, DB,
storage) is the one backbone that needs a real project:

1. Create a Supabase project; run `supabase/migrations/0001..0004` in order.
2. Enable the Google auth provider; add `http://localhost:3000/auth/callback`
   (and the prod URL) to the redirect list.
3. Copy `.env.example` → `.env.local` and fill the `NEXT_PUBLIC_SUPABASE_*` and
   `SUPABASE_SERVICE_ROLE_KEY` values. Leave `MOCK_PROVIDERS=true`.
4. `npm install && npm run dev`.

## Scope status

| # | Scope item (Prompt 1) | Status |
|---|---|---|
| — | Project foundation (Next.js, TS, Tailwind, tokens, fonts, UI kit) | ✅ Done |
| 2 | DB schema + RLS + search + storage + first-sign-in trigger | ✅ Migrations written (need a Supabase project to apply) |
| 3 | Auth (Google sign-in, Microsoft disabled w/ tooltip, callback, route protection) | ✅ Done |
| 3 | Onboarding (6 steps, resumable, seed demo call on finish) | ✅ Done (verified against screenshots) |
| 4 | App shell (top bar, tabs, Ask panel, avatar menu, Refer, Help) | ✅ Done (recording bar pending) |
| 5 | Capture: tab recording + upload | ✅ Done (Create/notetaker are seams) |
| 6 | Pipeline: Deepgram → Claude, status machine, retry (mockable) | ✅ Done |
| 7 | My Calls + search | ✅ Done |
| 8 | Call page (player, summary/transcript/ask, action items, highlights, share) | ✅ Done |
| 9 | Sharing, playlists, team | 🟡 Partial — share popover + token + team upsell + playlists list done; public /share pages + playlist detail + reorder pending |
| 10 | Settings + secondary pages | 🟡 Partial — behavioural settings (premium + options) wired; video-conf/integrations/highlight-tags CRUD/delete-account pending; deals/alerts/team/playlists pages exist |
| 11 | Public website | ⬜ Not started |

## Self-verification sweeps

| # | Sweep | Status |
|---|---|---|
| 1 | `tsc --noEmit` zero errors | ✅ Passing |
| 2 | `npm run build` succeeds | ✅ Passing |
| 3 | `npm run lint` clean (app code) | ✅ Passing (ponytail/ excluded) |
| 4–11 | Route/link/screen/requirement/flow/security/design/responsive sweeps | ⬜ Pending feature completion |

## Notes / decisions

- **shadcn init skipped**; primitives hand-built on Radix + cva (same output, no
  interactive CLI on Tailwind v4 + React 19). Closest to the documented pattern.
- **Stack pinned to current majors**: Next 16, React 19, Tailwind v4, Deepgram
  SDK v5, Anthropic SDK 0.128. Deepgram submit uses a raw `fetch` per
  architecture §4.0, so the SDK major does not affect the pipeline.
- Deferred by design (Prompt 1 says leave seams): Meet/Zoom OAuth, Recall bot,
  PiP overlay provider calls.
