'use client';

import { useState } from 'react';
import { Bot, Sparkles, Image as ImageIcon, Share2, ShieldCheck, Pencil } from 'lucide-react';
import { SettingsRow } from '@/components/ui/settings-row';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/toaster';
import { updateSettings } from '@/app/(app)/settings/actions';
import { SUMMARY_TEMPLATES, TEMPLATE_LABELS } from '@/lib/config';
import type { UserSettings } from '@/lib/types';

export function SettingsForm({ initial }: { initial: UserSettings }) {
  const [s, setS] = useState(initial);
  const [editingBot, setEditingBot] = useState(false);
  const [botName, setBotName] = useState(initial.bot_name ?? '');

  async function save(patch: Partial<UserSettings>) {
    setS((prev) => ({ ...prev, ...patch }));
    const res = await updateSettings(patch as never);
    if (res.ok) toast.success('Saved');
    else {
      toast.error('Could not save');
      setS(initial);
    }
  }

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-text-3">Premium features</h2>
        <SettingsRow
          icon={<Bot />}
          title={
            editingBot ? (
              <div className="flex items-center gap-2">
                <Input value={botName} onChange={(e) => setBotName(e.target.value)} className="h-8 w-64" />
                <Button
                  size="sm"
                  onClick={async () => {
                    await save({ bot_name: botName });
                    setEditingBot(false);
                  }}
                >
                  Save
                </Button>
              </div>
            ) : (
              <>Bot Name: {s.bot_name}</>
            )
          }
          description="The name your notetaker will go by when it joins meetings."
          control={
            !editingBot && (
              <Button size="sm" variant="ghost" onClick={() => setEditingBot(true)}>
                <Pencil /> Edit
              </Button>
            )
          }
        />
        <SettingsRow
          icon={<Sparkles />}
          title="Auto-Generate Action Items"
          description="Automatically extract action items discussed in your meetings."
          control={<Switch checked={s.auto_action_items} onCheckedChange={(v) => save({ auto_action_items: v })} />}
        />
        <SettingsRow
          icon={<Sparkles />}
          title="Default Meeting Summary Template"
          description="Used for new summaries unless changed on a call."
          control={
            <Select value={s.default_template} onValueChange={(v) => save({ default_template: v })}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUMMARY_TEMPLATES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TEMPLATE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
        <SettingsRow
          icon={<ImageIcon />}
          title="Recording Notification Banner"
          description="Shows a recording notice in the bot tile and overlay. Disabling shifts consent responsibility to you."
          control={<Switch checked={s.recording_banner} onCheckedChange={(v) => save({ recording_banner: v })} />}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-text-3">Options</h2>
        <SettingsRow
          icon={<ShieldCheck />}
          title="Auto Request Recording Consent"
          control={<Switch checked={s.auto_consent} onCheckedChange={(v) => save({ auto_consent: v })} />}
        />
        <SettingsRow
          icon={<Share2 />}
          title="Default Share Link Access"
          control={
            <Select value={s.default_share_access} onValueChange={(v) => save({ default_share_access: v as never })}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="link">Anyone with the link can view</SelectItem>
                <SelectItem value="workspace">Workspace members</SelectItem>
                <SelectItem value="private">Only me</SelectItem>
              </SelectContent>
            </Select>
          }
        />
        <SettingsRow
          icon={<Sparkles />}
          title="In-meeting Chat Interface"
          control={<Switch checked={s.in_meeting_chat} onCheckedChange={(v) => save({ in_meeting_chat: v })} />}
        />
        <SettingsRow
          icon={<ShieldCheck />}
          title="Use my anonymized data to improve AI"
          control={<Switch checked={s.anonymized_data} onCheckedChange={(v) => save({ anonymized_data: v })} />}
        />
      </section>
    </div>
  );
}
