import { createClient } from '@/lib/supabase/server';
import { getProfileAndSettings } from '@/lib/queries';
import { SettingsForm } from '@/components/app/settings-form';
import { VideoConferencing } from '@/components/app/video-conferencing';
import { HighlightTagsManager } from '@/components/app/highlight-tags-manager';
import { IntegrationsSection, DangerZone } from '@/components/app/settings-extras';
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

export default async function SettingsPage() {
  const { user, settings } = await getProfileAndSettings();
  const supabase = await createClient();
  const [{ data: tags }, { data: integrations }] = await Promise.all([
    supabase.from('highlight_tags').select('*').eq('user_id', user?.id ?? '').order('position'),
    supabase.from('integrations').select('provider, account_email').eq('user_id', user?.id ?? ''),
  ]);

  const initial = { ...DEFAULTS, ...(settings ?? {}) } as UserSettings;

  return (
    <div className="mx-auto max-w-[900px] space-y-10">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <VideoConferencing integrations={(integrations ?? []) as never} />
      <SettingsForm initial={initial} />
      <HighlightTagsManager tags={(tags ?? []) as HighlightTag[]} />
      <IntegrationsSection />
      <DangerZone />
    </div>
  );
}
