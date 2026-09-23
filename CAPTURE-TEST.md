# CAPTURE-TEST

Proof that automatic prompt/response capture is installed and firing.

## Setup

| | |
|---|---|
| **Tool** | Claude Code (desktop app, Code tab) |
| **Model** | `claude-opus-5` — the same model plans and executes; no separate planner model. Any mid-build model switch is recorded per entry, since the model name is read from the session transcript on every write. |
| **Automatic mechanism?** | Yes. Claude Code has a hooks system: shell commands bound to lifecycle events, configured in `.claude/settings.json` and run by the harness, not by me. |

## Mechanism used

Two hooks in **`.claude/settings.json`** (committed, repo-scoped, so it applies to every session started in this repo):

| Event | Fires | Command |
|---|---|---|
| `UserPromptSubmit` | Every time a prompt is submitted | `node "$CLAUDE_PROJECT_DIR/.claude/hooks/capture.mjs" prompt` |
| `Stop` | End of every assistant turn | `node "$CLAUDE_PROJECT_DIR/.claude/hooks/capture.mjs" response` |

Both hooks receive a JSON payload on stdin containing `session_id`, `cwd` and `transcript_path`.

- **Prompt capture** takes the `prompt` field straight from the `UserPromptSubmit` payload, so it is verbatim and untouched.
- **Response capture** reads the session transcript (JSONL) named by `transcript_path`, finds the last real user message, and concatenates only the `text` blocks of the assistant messages after it. `thinking` blocks, `tool_use` blocks, `tool_result` messages and any `isSidechain` (subagent) turns are filtered out, so the log holds the prompt and the final answer and nothing in between.
- The `Stop` event can fire more than once for a turn, so a repeated response is detected and skipped.

**Script:** `.claude/hooks/capture.mjs`
**Log destination:** `.agent-logs/YYYY-MM-DD_HH-MM-SS_<session-id>.md`, one file per session, appended to as the session runs.

`.agent-logs/` is explicitly **not** in `.gitignore` — there is a comment in `.gitignore` saying so, to stop anyone adding it later.

## Canary verification

- [ ] **Canary 1** — session A
- [ ] **Canary 2** — a second, separate session

> Pending: both canaries have to be sent from sessions started *after* the hooks were written, because Claude Code reads hook configuration when a session starts. The raw entries are pasted below once they land.

### Canary 1 (raw)

```
(pending)
```

### Canary 2 (raw)

```
(pending)
```

## What was tried first / notes

- **Mid-session hook installation does not apply retroactively.** The hooks were written during a session that was already running, so that session does not have them loaded. This is why both canaries are sent from fresh sessions rather than one of them being sent in the session that did the setup.
- **`$CLAUDE_PROJECT_DIR` in the hook command.** Used because the repo path should not be hard-coded. If a Windows shell fails to expand it, the fallback is an absolute path in `.claude/settings.json`; the script itself also falls back to the `cwd` field from the hook payload, so it can locate the repo without the variable.
- **Dry run before trusting the hooks.** The script was executed directly, with a synthetic payload pointing at a real session transcript, writing into a scratch directory rather than `.agent-logs/`. That confirmed the output format, the verbatim prompt, the text-only response extraction, the model name and the UTC timestamps before any hook fired. The scratch output was not kept; the real log files come only from real hook runs.
- **Nested repository.** `ponytail/` in this folder is an unrelated checkout with its own `.git`, and is ignored here so it does not end up inside this submission.
- **Work that predates capture.** The planning documents in `docs/` were written in a session that ran before this capture setup existed, so there are no log entries for them. Everything from the canaries onward is captured automatically.
