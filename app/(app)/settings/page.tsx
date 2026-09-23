import { getProfileAndSettings } from '@/lib/queries';
import { SettingsForm } from '@/components/app/settings-form';
import type { UserSettings } from '@/lib/types';

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
  const { settings } = await getProfileAndSettings();
  const initial = { ...DEFAULTS, ...(settings ?? {}) } as UserSettings;

  return (
    <div className="mx-auto max-w-[900px]">
      <h1 className="mb-8 text-2xl font-semibold">Settings</h1>
      <SettingsForm initial={initial} />
    </div>
  );
}
