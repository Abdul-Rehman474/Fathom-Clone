/**
 * Meeting-link validation for the notetaker (PRD FR-3.2). Shared by the
 * New Meeting dialog and the server route so both reject the same links.
 */
export type MeetingPlatform = 'meet' | 'zoom' | 'teams';

const PATTERNS: { platform: MeetingPlatform; host: RegExp; path: RegExp }[] = [
  // https://meet.google.com/abc-defg-hij
  { platform: 'meet', host: /^meet\.google\.com$/, path: /^\/[a-z]{3}-[a-z]{4}-[a-z]{3}\/?$/i },
  // https://zoom.us/j/123…, https://us06web.zoom.us/j/123…?pwd=…, /my/name, /w/123
  { platform: 'zoom', host: /^([a-z0-9-]+\.)*zoom\.(us|com)$/, path: /^\/(j|w|s)\/\d{9,12}\/?$|^\/my\/[\w.-]+\/?$/i },
  // https://teams.microsoft.com/l/meetup-join/…, https://teams.live.com/meet/123…
  {
    platform: 'teams',
    host: /^teams\.(microsoft|live)\.com$/,
    path: /^\/l\/meetup-join\/.+|^\/meet\/\d+\/?$|^\/v2\/.+/i,
  },
];

export function parseMeetingUrl(input: string): { platform: MeetingPlatform; url: string } | null {
  let u: URL;
  try {
    u = new URL(input.trim());
  } catch {
    return null;
  }
  if (u.protocol !== 'https:') return null;
  const host = u.hostname.toLowerCase();
  for (const p of PATTERNS) {
    if (p.host.test(host) && p.path.test(u.pathname)) return { platform: p.platform, url: u.toString() };
  }
  return null;
}

export const PLATFORM_NAME: Record<MeetingPlatform, string> = {
  meet: 'Google Meet',
  zoom: 'Zoom',
  teams: 'Microsoft Teams',
};
