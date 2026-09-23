/** Small FAQ that grounds the Help bot (UI.md §4.4). */
export const FAQ: { q: string; a: string }[] = [
  {
    q: 'How does Fathom record my meetings?',
    a: 'Three ways: send a notetaker bot to a Meet/Zoom/Teams link, record the current browser tab, or upload an existing audio/video file. All three produce a transcript, summary and action items.',
  },
  {
    q: 'Do I need to install anything?',
    a: 'No — this build runs entirely in your browser. Tab recording works in Chrome and Edge.',
  },
  {
    q: 'How do highlights work?',
    a: 'During a call you can tag moments with one click; each highlight is stored with its timestamp and appears on the call page as a clickable marker you can jump to.',
  },
  {
    q: 'Can I share a call?',
    a: 'Yes. Open a call, click Share, and choose “Anyone with the link”, “Workspace members”, or “Only me”. Share links open a read-only page without login and can be revoked.',
  },
  {
    q: 'What is Ask Fathom?',
    a: 'A chat over your meetings. Ask about one call or across all your calls; answers cite the exact [m:ss] moments and link back into the recording.',
  },
  {
    q: 'How do I change the summary template?',
    a: 'On the call page, use the template dropdown (General, Sales, Customer Success, 1:1, Stand-up, Interview) and click Regenerate.',
  },
];

export function faqContext(): string {
  return FAQ.map((f) => `Q: ${f.q}\nA: ${f.a}`).join('\n\n');
}
