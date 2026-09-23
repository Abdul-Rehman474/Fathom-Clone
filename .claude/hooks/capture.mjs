#!/usr/bin/env node
/**
 * Agent capture hook for Claude Code.
 *
 *   node capture.mjs prompt     <- wired to the UserPromptSubmit event
 *   node capture.mjs response   <- wired to the Stop event
 *
 * Appends one PROMPT entry and one RESPONSE entry per turn to
 * <project>/.agent-logs/YYYY-MM-DD_HH-MM-SS_<session-id>.md
 *
 * Only the verbatim prompt and the final assistant text are written.
 * Thinking blocks, tool calls, tool results and subagent (sidechain)
 * turns are skipped by design.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const TOOL = 'claude-code';

main().catch((err) => {
  // Never block or fail a turn because of logging.
  process.stderr.write(`[capture] ${err?.stack || err}\n`);
  process.exit(0);
});

async function main() {
  const mode = process.argv[2] === 'response' ? 'response' : 'prompt';
  const payload = safeJson(await readStdin());

  const projectDir =
    process.env.CLAUDE_PROJECT_DIR || payload.cwd || process.cwd();
  const logDir = path.join(projectDir, '.agent-logs');
  fs.mkdirSync(logDir, { recursive: true });

  const sessionId = payload.session_id || 'unknown-session';
  const transcriptPath = payload.transcript_path || '';
  const now = new Date();

  if (mode === 'prompt') {
    const prompt = typeof payload.prompt === 'string' ? payload.prompt : '';
    if (!prompt.trim()) return;
    writeEntry({
      logDir,
      sessionId,
      projectDir,
      type: 'PROMPT',
      timestamp: now.toISOString(),
      model: readModel(transcriptPath) || process.env.CLAUDE_MODEL || 'unknown',
      body: prompt,
    });
    return;
  }

  const { text, model } = readFinalResponse(transcriptPath);
  // On a session's first prompt the transcript holds no assistant message yet,
  // so UserPromptSubmit cannot know the model. Fill that one field in now.
  if (model) backfillPromptModel(logDir, sessionId, model);
  writeEntry({
    logDir,
    sessionId,
    projectDir,
    type: 'RESPONSE',
    timestamp: now.toISOString(),
    model: model || 'unknown',
    body: text || '(no text in final response for this turn)',
  });
}

/* ------------------------------------------------------------------ */

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    if (process.stdin.isTTY) return resolve('');
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (data += c));
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(data));
  });
}

function safeJson(raw) {
  try {
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

function readTranscript(transcriptPath) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return [];
  return fs
    .readFileSync(transcriptPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .filter((e) => !e.isSidechain); // main thread only, no subagents
}

function readModel(transcriptPath) {
  const entries = readTranscript(transcriptPath);
  for (let i = entries.length - 1; i >= 0; i--) {
    const m = entries[i]?.message?.model;
    if (m) return m;
  }
  return '';
}

/** Text of the assistant turn that answered the most recent real user prompt. */
function readFinalResponse(transcriptPath) {
  const entries = readTranscript(transcriptPath);
  let lastUserIdx = -1;

  entries.forEach((e, i) => {
    if (e.type !== 'user' || !e.message) return;
    const content = e.message.content;
    if (Array.isArray(content)) {
      // skip tool results fed back to the model
      if (content.some((c) => c.type === 'tool_result')) return;
      if (!content.some((c) => c.type === 'text' && c.text?.trim())) return;
    } else if (typeof content !== 'string' || !content.trim()) {
      return;
    }
    lastUserIdx = i;
  });

  const texts = [];
  let model = '';
  for (let i = lastUserIdx + 1; i < entries.length; i++) {
    const e = entries[i];
    if (e.type !== 'assistant' || !e.message) continue;
    if (e.message.model) model = e.message.model;
    const content = e.message.content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      // text only: no thinking, no tool_use
      if (block.type === 'text' && block.text?.trim()) texts.push(block.text.trim());
    }
  }
  return { text: texts.join('\n\n'), model };
}

/* ------------------------------------------------------------------ */

function sessionFile(logDir, sessionId, timestamp) {
  const existing = fs
    .readdirSync(logDir)
    .find((f) => f.endsWith(`_${sessionId}.md`));
  if (existing) return path.join(logDir, existing);

  const stamp = timestamp.replace('T', '_').replace(/\..+$/, '').replace(/:/g, '-');
  return path.join(logDir, `${stamp}_${sessionId}.md`);
}

function author() {
  if (process.env.AGENT_LOG_AUTHOR) return process.env.AGENT_LOG_AUTHOR;
  try {
    return execFileSync('git', ['config', '--get', 'user.name'], {
      encoding: 'utf8',
    }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Replace `model: unknown` with the real model on already-written entries and
 * in the frontmatter. Only ever touches that field — never prompt or response text.
 */
function backfillPromptModel(logDir, sessionId, model) {
  const existing = fs.readdirSync(logDir).find((f) => f.endsWith(`_${sessionId}.md`));
  if (!existing) return;
  const file = path.join(logDir, existing);
  const content = fs.readFileSync(file, 'utf8');
  const patched = content.replace(/^model: unknown$/gm, `model: ${model}`);
  if (patched === content) return;
  fs.writeFileSync(file, patched, 'utf8');
}

function writeEntry({ logDir, sessionId, projectDir, type, timestamp, model, body }) {
  const file = sessionFile(logDir, sessionId, timestamp);
  const short = sessionId.slice(0, 8);
  const project = path.basename(projectDir);
  const exists = fs.existsSync(file);
  let content = exists ? fs.readFileSync(file, 'utf8') : '';

  if (!exists) {
    content =
      `---\n` +
      `session_id: ${sessionId}\n` +
      `date: ${timestamp.slice(0, 10)}\n` +
      `author: ${author()}\n` +
      `model: ${model}\n` +
      `tool: ${TOOL}\n` +
      `project: ${project}\n` +
      `total_exchanges: 0\n` +
      `first_prompt_time: ${timestamp}\n` +
      `last_prompt_time: ${timestamp}\n` +
      `---\n\n` +
      `# Session Log - ${timestamp.slice(0, 10)}\n\n` +
      `Session: \`${short}\` | Project: \`${project}\` | Author: \`${author()}\`\n\n` +
      `---\n\n`;
  }

  const num =
    (content.match(/\[LOG_ENTRY type=PROMPT /g) || []).length + (type === 'PROMPT' ? 1 : 0);

  // A Stop event can fire more than once for one turn; don't write the same response twice.
  if (type === 'RESPONSE') {
    const lastResponse = content.lastIndexOf('[LOG_ENTRY type=RESPONSE ');
    const lastPrompt = content.lastIndexOf('[LOG_ENTRY type=PROMPT ');
    if (lastResponse > lastPrompt && content.slice(lastResponse).includes(body.slice(0, 200))) {
      return;
    }
  }

  content +=
    `[LOG_ENTRY type=${type} num=${num} session=${short}]\n` +
    `timestamp: ${timestamp}\n` +
    `model: ${model}\n\n` +
    `${body}\n\n\n`;

  content = content
    .replace(/^total_exchanges: .*$/m, `total_exchanges: ${num}`)
    .replace(/^last_prompt_time: .*$/m, `last_prompt_time: ${timestamp}`)
    .replace(/^model: .*$/m, `model: ${model}`);

  fs.writeFileSync(file, content, 'utf8');
}
