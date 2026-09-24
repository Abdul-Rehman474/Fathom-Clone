/** Marketing site content + navigation (UI.md §1). Neutral placeholder brands. */

export const NAV_MENUS = {
  Solutions: [
    { label: 'For customer success', href: '/solutions/customer-success' },
    { label: 'For marketing', href: '/solutions/marketing' },
    { label: 'For sales', href: '/solutions/sales' },
    { label: 'For teams', href: '/solutions/teams' },
  ],
  Integrations: [
    { label: 'Asana', href: '/integrations/asana' },
    { label: 'ChatGPT', href: '/integrations/chatgpt' },
    { label: 'Claude', href: '/integrations/claude' },
    { label: 'HubSpot', href: '/integrations/hubspot' },
    { label: 'Salesforce', href: '/integrations/salesforce' },
    { label: 'Zapier', href: '/integrations/zapier' },
    { label: 'Public API & MCP', href: '/integrations/api' },
    { label: 'See all integrations →', href: '/integrations' },
  ],
  Resources: [
    { label: "What's New", href: '/resources/whats-new' },
    { label: 'Resource Hub', href: '/resources/whats-new' },
    { label: 'Partner with Fathom', href: '/help' },
    { label: 'Developer Hub', href: '/integrations/api' },
    { label: 'Help Center', href: '/help' },
  ],
} as const;

export const LOGO_WALL = ['Northwind', 'Acme', 'Globex', 'Initech', 'Umbrella', 'Hooli', 'Soylent', 'Stark'];

export interface Solution {
  slug: string;
  audience: string;
  headline: string;
  intro: string;
  rows: { title: string; body: string }[];
  lifecycle: { title: string; subtitle: string; bullets: string[] }[];
  features: { title: string; body: string }[];
}

export const SOLUTIONS: Record<string, Solution> = {
  'customer-success': {
    slug: 'customer-success',
    audience: 'customer success',
    headline: 'Customer success that actually scales',
    intro:
      'Stay present in every call while Fathom captures the notes, action items and follow-ups, so nothing falls through the cracks across renewals and handoffs.',
    rows: [
      { title: 'Stay present with customers', body: 'Let the notetaker handle the record while you focus on the relationship.' },
      { title: 'Keep the context through handoffs', body: 'Every account’s history is searchable and shareable with the next owner.' },
      { title: 'Turn insight into action', body: 'Auto-extracted action items and highlights keep the team moving.' },
    ],
    lifecycle: [
      { title: 'Onboarding', subtitle: 'Start strong', bullets: ['Capture kickoff goals', 'Share recap with the account', 'Track first-value milestones'] },
      { title: 'Adoption', subtitle: 'Drive usage', bullets: ['Spot blockers early', 'Surface feature requests', 'Coach with real calls'] },
      { title: 'Renewal', subtitle: 'Retain & expand', bullets: ['Review the full history', 'Flag risk signals', 'Build the expansion case'] },
    ],
    features: [
      { title: 'Searchable history', body: 'Find any moment across every account call.' },
      { title: 'Shared playlists', body: 'Assemble key moments for QBRs and handoffs.' },
      { title: 'Ask Fathom', body: 'Ask across accounts and get cited answers.' },
      { title: 'Team visibility', body: 'Workspace calls keep everyone aligned.' },
    ],
  },
  marketing: {
    slug: 'marketing',
    audience: 'marketing',
    headline: 'Turn customer conversations into your best campaigns',
    intro: 'Mine real calls for the language, objections and stories that make marketing resonate.',
    rows: [
      { title: 'Hear the voice of the customer', body: 'Pull exact phrasing from real conversations.' },
      { title: 'Build a testimonial library', body: 'Clip and share the best moments as playlists.' },
      { title: 'Align with sales', body: 'See what actually lands on calls.' },
    ],
    lifecycle: [
      { title: 'Research', subtitle: 'Listen', bullets: ['Tag insights', 'Cluster themes', 'Quote verbatim'] },
      { title: 'Create', subtitle: 'Produce', bullets: ['Source stories', 'Draft with real language', 'Cite the moment'] },
      { title: 'Measure', subtitle: 'Refine', bullets: ['Track messaging', 'Spot new objections', 'Iterate fast'] },
    ],
    features: [
      { title: 'Highlight reels', body: 'Turn calls into shareable clips.' },
      { title: 'Search everything', body: 'Find a phrase said once, months ago.' },
      { title: 'Ask Fathom', body: 'Summarize themes across many calls.' },
      { title: 'Exports', body: 'Copy summaries straight into your docs.' },
    ],
  },
  sales: {
    slug: 'sales',
    audience: 'sales',
    headline: 'Close more by staying in the conversation',
    intro: 'Fathom captures every call so reps can focus on the deal, not note taking, with summaries and next steps ready the moment you hang up.',
    rows: [
      { title: 'Be fully present', body: 'No more typing while you should be listening.' },
      { title: 'Never miss a next step', body: 'Action items with owners and timestamps, automatically.' },
      { title: 'Coach with real calls', body: 'Build playlists of great (and tough) moments.' },
    ],
    lifecycle: [
      { title: 'Discovery', subtitle: 'Qualify', bullets: ['Capture pain', 'Log objections', 'Score fit'] },
      { title: 'Demo', subtitle: 'Show value', bullets: ['Track reactions', 'Flag questions', 'Follow up fast'] },
      { title: 'Close', subtitle: 'Advance', bullets: ['Recap decisions', 'Assign next steps', 'Share internally'] },
    ],
    features: [
      { title: 'Sales template', body: 'Summaries tuned for pain, objections and next steps.' },
      { title: 'CRM-ready recaps', body: 'Copy a clean recap in one click.' },
      { title: 'Ask Fathom', body: '“What objections came up this week?”' },
      { title: 'Team coaching', body: 'Playlists of the moments that matter.' },
    ],
  },
  teams: {
    slug: 'teams',
    audience: 'teams',
    headline: 'Whether you’re a team of 1 or 1,000, Fathom has your back',
    intro: 'Shared workspaces, searchable history and playlists keep the whole team aligned on every conversation.',
    rows: [
      { title: 'One searchable place', body: 'Every team call, findable in seconds.' },
      { title: 'Share what matters', body: 'Workspace visibility and playlists built in.' },
      { title: 'Coach and improve', body: 'Learn from the best calls across the team.' },
    ],
    lifecycle: [
      { title: 'Capture', subtitle: 'Together', bullets: ['Bot, tab or upload', 'Consistent summaries', 'Shared tags'] },
      { title: 'Share', subtitle: 'Aligned', bullets: ['Workspace calls', 'Playlists', 'Ask across the team'] },
      { title: 'Improve', subtitle: 'Continuously', bullets: ['Coaching reels', 'Searchable insight', 'Repeatable wins'] },
    ],
    features: [
      { title: 'Workspaces', body: 'Private and shared, with invite links.' },
      { title: 'Team Calls', body: 'Everyone’s shared calls in one grid.' },
      { title: 'Ask Fathom', body: 'Answers across the whole team’s history.' },
      { title: 'Playlists', body: 'Training libraries of key moments.' },
    ],
  },
};

export interface Integration {
  slug: string;
  name: string;
  category: 'Meeting platforms' | 'AI' | 'CRM' | 'Productivity' | 'Developer';
  blurb: string;
  available: boolean;
}

export const INTEGRATIONS: Integration[] = [
  { slug: 'zoom', name: 'Zoom', category: 'Meeting platforms', blurb: 'Send a notetaker or create meetings.', available: true },
  { slug: 'google-meet', name: 'Google Meet', category: 'Meeting platforms', blurb: 'Create Meet links and record.', available: true },
  { slug: 'teams', name: 'Microsoft Teams', category: 'Meeting platforms', blurb: 'Paste a Teams link. No connection needed.', available: true },
  { slug: 'chatgpt', name: 'ChatGPT', category: 'AI', blurb: 'Bring your meeting context to ChatGPT.', available: false },
  { slug: 'claude', name: 'Claude', category: 'AI', blurb: 'Analyze meetings with Claude.', available: false },
  { slug: 'hubspot', name: 'HubSpot', category: 'CRM', blurb: 'Sync recaps to HubSpot.', available: false },
  { slug: 'salesforce', name: 'Salesforce', category: 'CRM', blurb: 'Log calls to Salesforce.', available: false },
  { slug: 'slack', name: 'Slack', category: 'Productivity', blurb: 'Share summaries to Slack.', available: false },
  { slug: 'zapier', name: 'Zapier', category: 'Productivity', blurb: 'Automate with 6,000+ apps.', available: false },
  { slug: 'asana', name: 'Asana', category: 'Productivity', blurb: 'Turn action items into tasks.', available: false },
  { slug: 'api', name: 'Public API & MCP', category: 'Developer', blurb: 'Build on Fathom’s API and MCP server.', available: false },
];

export const PRICING = [
  { name: 'Free', price: { monthly: 0, annual: 0 }, tagline: 'For individuals getting started', popular: false, features: ['Unlimited recordings', 'AI summaries & action items', 'Tab capture & upload', 'Ask Fathom'] },
  { name: 'Premium', price: { monthly: 19, annual: 15 }, tagline: 'For power users', popular: false, features: ['Everything in Free', 'All summary templates', 'Advanced search', 'Priority processing'] },
  { name: 'Team', price: { monthly: 29, annual: 24 }, tagline: 'For growing teams', popular: true, features: ['Everything in Premium', 'Shared workspace', 'Team Calls & playlists', 'Admin controls'] },
  { name: 'Business', price: { monthly: 49, annual: 39 }, tagline: 'For organizations', popular: false, features: ['Everything in Team', 'SSO / SCIM (sample)', 'Deal intelligence', 'Dedicated support'] },
];

export const WHATS_NEW = [
  { date: '2026-09-20', title: 'Ask Fathom across all your calls', tag: 'New', body: 'Ask questions across your whole meeting history and get answers with citations that jump to the moment.' },
  { date: '2026-09-10', title: 'Bot-free tab recording', tag: 'New', body: 'Record any meeting tab with your mic mixed in. No bot required.' },
  { date: '2026-08-28', title: 'Playlists of highlights', tag: 'Improved', body: 'Assemble key moments across calls into shareable playlists.' },
  { date: '2026-08-15', title: 'Six summary templates', tag: 'New', body: 'General, Sales, Customer Success, 1:1, Stand-up and Interview.' },
];

export const FOOTER_COLUMNS = [
  { title: 'Product', links: [{ label: 'Overview', href: '/overview' }, { label: 'Pricing', href: '/pricing' }, { label: "What's New", href: '/resources/whats-new' }] },
  { title: 'Company', links: [{ label: 'About Us', href: '/overview' }, { label: 'Careers', href: '/overview' }] },
  { title: 'Solutions', links: NAV_MENUS.Solutions.map((s) => ({ label: s.label.replace('For ', 'For '), href: s.href })) },
  { title: 'Integrations', links: NAV_MENUS.Integrations.map((s) => ({ label: s.label.replace(' →', ''), href: s.href })) },
  {
    title: 'Competitors',
    links: [
      'Fireflies', 'Granola', 'Gong', 'Otter', 'Read AI', 'Google Meet Gemini',
    ].map((c) => ({ label: `vs. ${c}`, href: `/compare/${c.toLowerCase().replace(/[^a-z]+/g, '-')}` })),
  },
  { title: 'Resources', links: [{ label: 'Resource Hub', href: '/resources/whats-new' }, { label: 'Help Center', href: '/help' }, { label: 'Partner Program', href: '/help' }] },
];
