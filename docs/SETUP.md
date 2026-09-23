# Setup & Security — what you need to plug in

This app is built to **run end-to-end with only Supabase configured**, because
all the paid AI/meeting providers run in mock mode (`MOCK_PROVIDERS=true`). You
add real keys only when you want live transcription, live AI, or real bots.

---

## Tier 1 — required to run and test at all (just Supabase)

| Key | Where to get it | Used for |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | DB, auth, storage |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same page | Client/server RLS access |
| `SUPABASE_SERVICE_ROLE_KEY` | same page (**secret**) | Webhooks, share pages, delete-account |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally | Redirects, webhook callback URLs |
| `MOCK_PROVIDERS` | set to `true` | Fixture transcript/summary/bot data |

**Steps**
1. Create a Supabase project.
2. In the SQL editor, run `supabase/migrations/0001_init.sql` → `0002` → `0003`
   → `0004`, in order.
3. Auth → Providers → enable **Google**. Add redirect URLs:
   `http://localhost:3000/auth/callback` and your prod URL.
   (Google sign-in also needs a Google OAuth client ID/secret entered *in the
   Supabase dashboard* — this is separate from the Meet API below.)
4. Copy `.env.example` → `.env.local`, fill the five keys above, keep
   `MOCK_PROVIDERS=true`.
5. `npm install && npm run dev` → sign in → onboarding → the seeded demo call is
   already there to explore. Upload/record/pipeline all work on fixture data.

That is enough to test the whole product: onboarding, capture, the pipeline,
the call page, Ask, search, highlights, playlists, sharing, settings.

---

## Tier 2 — real AI (optional; set `MOCK_PROVIDERS=false`)

| Key | Provider | Notes |
|---|---|---|
| `GROQ_API_KEY` | console.groq.com/keys | Summaries + Ask + help bot (Groq, OpenAI-compatible) |
| `GROQ_MODEL` | default `llama-3.3-70b-versatile` | Summaries + Ask |
| `GROQ_FAST_MODEL` | default `llama-3.1-8b-instant` | Titles + FAQ bot |
| `DEEPGRAM_API_KEY` | console.deepgram.com | Transcription (nova-3) |
| `DEEPGRAM_WEBHOOK_SECRET` | you choose a random string | Verifies the async callback |

The LLM is **Groq**, not Claude — summaries use Groq JSON mode (validated with
Zod, one retry) and Ask streams from Groq. LLM and transcription are gated
independently: with only a Deepgram key set and no Groq key, transcription is
live and summaries fall back to the deterministic mock.

**Deepgram locally:** its callback is async, so it must reach a public URL. On
localhost run a tunnel (`cloudflared tunnel --url http://localhost:3000` or
`ngrok http 3000`), set `NEXT_PUBLIC_SITE_URL` to the tunnel URL, and set
`MOCK_PROVIDERS=false`. Without a tunnel, keep `MOCK_PROVIDERS=true` — the
pipeline still runs end-to-end on fixtures. On Vercel the deployed URL works
directly.

---

## Tier 3 — real meetings (deferred to Prompts 3–5; seams already in place)

| Key | Provider |
|---|---|
| `RECALL_API_KEY`, `RECALL_REGION_BASE_URL`, `RECALL_WEBHOOK_SECRET` | Recall.ai bot |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google Meet REST API (create links) |
| `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` | Zoom API (create links) |
| `TOKEN_ENC_KEY` | 32-byte base64, `openssl rand -base64 32` — encrypts stored OAuth tokens |

The "Create meeting", "Send notetaker", and PiP overlay UIs are built and call
typed service seams that return a `not_configured` result until these land.

---

## Security posture (architecture.md §11, PRD §8)

**Handled in the build:**
- **RLS on every table.** Access to child rows (transcript, summary, action
  items, highlights, attendees) flows through `can_view_call()`; writes require
  `owns_call()`. Two accounts cannot see each other's private calls.
- **Service-role key is server-only.** `lib/supabase/admin.ts` imports
  `server-only`, so importing it into a client bundle is a build error. It is
  used only for webhooks, public share reads, and account deletion.
- **Share tokens** are 128-bit (`randomBytes(16).base64url`) and revocable.
- **Webhooks** verify a secret/signature and de-dupe via `webhook_events`;
  calls are looked up by stored `bot_id`/`transcript_job_id`, never a
  client-supplied id.
- **Prompt-injection hygiene:** transcripts are wrapped as `<transcript>` data
  with an instruction to ignore embedded commands before going to the LLM.
- **OAuth tokens** are stored AES-GCM-encrypted (`TOKEN_ENC_KEY`) — lands with
  the connectors in Prompt 3.
- **Rate limiting** on the Ask endpoints (per-user DB counter).

**Your responsibilities when going live:**
- Keep `SUPABASE_SERVICE_ROLE_KEY` and all Tier-2/3 secrets out of any
  `NEXT_PUBLIC_*` var and out of client code. Only `.env.local` / Vercel env.
- Google Cloud OAuth consent screen stays in **Testing**; add evaluator emails
  as test users.
- Never commit `.env.local` (already gitignored).
- The reference `FATHOM_CLONE.docx` is gitignored and purged from history — keep
  screenshots out of the repo.
