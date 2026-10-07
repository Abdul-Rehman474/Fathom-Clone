import { createClient } from '@/lib/supabase/server';
import { connectedIntegrations } from '@/lib/providers/integrations';
import { getProfileAndSettings } from '@/lib/queries';
import { SettingsForm } from '@/components/app/settings-form';
import { VideoConferencing } from '@/components/app/video-conferencing';
import { HighlightTagsManager } from '@/components/app/highlight-tags-manager';
import { IntegrationsSection, DangerZone } from '@/components/app/settings-extras';
import { PageHeading } from '@/components/ui/page-heading';
import type { UserSettings, HighlightTag } from '@/lib/types';

export const metadata = { title: 'Settings' };

const DEFAULTS: UserSettings = {
  user_id: '',
  bot_name: 'Notetaker',
  auto_record: 'all',
  auto_share: 'summary_recording',
  notes_on: 'all',
  share_with: 'all',
  auto_action_items: true,
  default_template: 'general',
  recording_banner: true,
  auto_consent: false,
  default_share_access: 'link',
  in_meeting_chat: true,
  anonymized_data: true,
  zoom_auto_unscheduled: false,
  meet_auto_unscheduled: false,
  enhanced_recording: false,
};

const SECTIONS = [
  ['video', 'Video conferencing'],
  ['premium', 'Capture & AI'],
  ['options', 'Privacy & sharing'],
  ['tags', 'Highlights'],
  ['integrations', 'Integrations'],
  ['account', 'Account'],
] as const;

export default async function SettingsPage() {
  const { user, settings } = await getProfileAndSettings();
  const supabase = await createClient();
  const [{ data: tags }, { data: integrations }] = await Promise.all([
    supabase
      .from('highlight_tags')
      .select('*')
      .eq('user_id', user?.id ?? '')
      .order('position'),
    connectedIntegrations(supabase, user?.id ?? ''),
  ]);

  const initial = { ...DEFAULTS, ...(settings ?? {}) } as UserSettings;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeading
        eyebrow="Manage"
        title="Settings"
        description="Configure capture, AI summaries, sharing and connections."
      />

      <div className="grid gap-12 lg:grid-cols-[180px_1fr]">
        <nav className="hidden lg:block" aria-label="Settings sections">
          <ul className="sticky top-24 space-y-1 border-l border-border">
            {SECTIONS.map(([id, label]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="-ml-px block border-l border-transparent py-1.5 pl-4 text-sm text-text-3 transition-colors hover:border-lime hover:text-off-white"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-14">
          <VideoConferencing integrations={(integrations ?? []) as never} />
          <SettingsForm initial={initial} />
          <HighlightTagsManager tags={(tags ?? []) as HighlightTag[]} />
          <IntegrationsSection />
          <DangerZone />
        </div>
      </div>
    </div>
  );
}
