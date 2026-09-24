/**
 * Offline checks for the notetaker path: meeting-link validation, Recall
 * webhook signatures and lifecycle mapping. Run: npm run check:notetaker
 */
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { parseMeetingUrl } from '../lib/meeting-url';
import { verifyRecallWebhook, mapBotCode, failureReason } from '../lib/providers/recall';

let n = 0;
const ok = (name: string, fn: () => void) => {
  fn();
  n++;
  console.log('  ok', name);
};

ok('Meet links', () => {
  assert.equal(parseMeetingUrl('https://meet.google.com/abc-defg-hij')?.platform, 'meet');
  assert.equal(parseMeetingUrl('  https://meet.google.com/abc-defg-hij?authuser=0 ')?.platform, 'meet');
  assert.equal(parseMeetingUrl('https://meet.google.com/landing'), null);
  assert.equal(parseMeetingUrl('http://meet.google.com/abc-defg-hij'), null);
  assert.equal(parseMeetingUrl('https://meet.google.com.evil.com/abc-defg-hij'), null);
});
ok('Zoom links', () => {
  assert.equal(parseMeetingUrl('https://zoom.us/j/1234567890')?.platform, 'zoom');
  assert.equal(parseMeetingUrl('https://us06web.zoom.us/j/85012345678?pwd=abc.1')?.platform, 'zoom');
  assert.equal(parseMeetingUrl('https://zoom.us/my/jane.doe')?.platform, 'zoom');
  assert.equal(parseMeetingUrl('https://zoom.us/pricing'), null);
  assert.equal(parseMeetingUrl('https://notzoom.us.example.com/j/1234567890'), null);
});
ok('Teams links', () => {
  assert.equal(
    parseMeetingUrl('https://teams.microsoft.com/l/meetup-join/19%3ameeting_abc%40thread.v2/0?context=%7b%7d')?.platform,
    'teams',
  );
  assert.equal(parseMeetingUrl('https://teams.live.com/meet/9876543210123?p=abc')?.platform, 'teams');
  assert.equal(parseMeetingUrl('https://teams.microsoft.com/'), null);
  assert.equal(parseMeetingUrl('not a url'), null);
});

ok('Webhook signature', () => {
  const secret = 'whsec_' + Buffer.from('test-secret-key-0123456789').toString('base64');
  const body = JSON.stringify({ event: 'bot.done', data: { bot: { id: 'b1' }, data: { code: 'done' } } });
  const id = 'msg_1';
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = createHmac('sha256', Buffer.from(secret.slice(6), 'base64')).update(`${id}.${ts}.${body}`).digest('base64');
  const h = (s: string, t = ts) => new Headers({ 'webhook-id': id, 'webhook-timestamp': t, 'webhook-signature': s });
  assert.equal(verifyRecallWebhook(h(`v1,${sig}`), body, secret), true);
  assert.equal(verifyRecallWebhook(h(`v1,bogus v1,${sig}`), body, secret), true, 'rotated secrets');
  assert.equal(verifyRecallWebhook(h(`v1,${sig}`), body + ' ', secret), false, 'tampered body');
  assert.equal(verifyRecallWebhook(h('v1,AAAA'), body, secret), false, 'wrong sig');
  assert.equal(verifyRecallWebhook(h(`v1,${sig}`, String(Number(ts) - 3600)), body, secret), false, 'replay');
  assert.equal(verifyRecallWebhook(h(`v1,${sig}`), body, undefined), false, 'no secret configured');
});

ok('Lifecycle mapping', () => {
  const at = '2026-09-24T10:00:00Z';
  assert.deepEqual(mapBotCode('bot.joining_call', null, at), { kind: 'status', status: 'joining' });
  assert.deepEqual(mapBotCode('in_waiting_room', null, at), { kind: 'status', status: 'waiting_admit' });
  assert.deepEqual(mapBotCode('in_call_recording', null, at), { kind: 'status', status: 'recording', recordingStartedAt: at });
  assert.equal(mapBotCode('done', null, at)?.kind, 'done');
  const kicked = mapBotCode('call_ended', 'bot_kicked_from_waiting_room', at);
  assert.equal(kicked?.kind, 'ended');
  assert.match((kicked as { reason: string }).reason, /declined the notetaker/);
  const timeout = mapBotCode('call_ended', 'timeout_exceeded_waiting_room', at) as { reason: string };
  assert.match(timeout.reason, /not admitted/);
  const fatal = mapBotCode('fatal', 'meeting_not_found', at) as { kind: string; reason: string };
  assert.equal(fatal.kind, 'fatal');
  assert.match(fatal.reason, /No meeting was found/);
  assert.equal(mapBotCode('bot.breakout_room_opened', null, at), null);
  assert.match(failureReason('unknown_code'), /could not record/);
});

console.log(`\n${n} checks passed`);
