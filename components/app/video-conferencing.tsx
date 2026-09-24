'use client';

import { useRouter } from 'next/navigation';
import { Video, Check } from 'lucide-react';
import { SettingsRow } from '@/components/ui/settings-row';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toaster';
import { disconnectIntegration } from '@/app/(app)/settings/actions';

interface Integration {
  provider: 'google' | 'zoom';
  account_email: string | null;
}

function VcRow({
  provider,
  label,
  note,
  conn,
}: {
  provider: 'google' | 'zoom' | 'teams';
  label: string;
  note: string;
  conn?: Integration;
}) {
  const router = useRouter();
  if (provider === 'teams') {
    return (
      <SettingsRow
        icon={<Video />}
        title={
          <span>
            {label}: <span className="text-success">Enabled via meeting link</span>
          </span>
        }
        description={note}
      />
    );
  }
  return (
    <SettingsRow
      icon={<Video />}
      title={
        <span>
          {label}:{' '}
          {conn ? (
            <span className="text-success">Fully Enabled</span>
          ) : (
            <span className="text-text-3">Not connected</span>
          )}
        </span>
      }
      description={conn ? `Connected as ${conn.account_email ?? 'your account'}` : note}
      control={
        conn ? (
          <Button
            size="sm"
            variant="danger"
            onClick={async () => {
              await disconnectIntegration(provider);
              router.refresh();
              toast.success(`Disconnected ${label}`);
            }}
          >
            Disconnect
          </Button>
        ) : (
          <a href={`/api/integrations/${provider}/start?next=/settings`}>
            <Button size="sm" variant="tint">
              Connect
            </Button>
          </a>
        )
      }
    />
  );
}

export function VideoConferencing({ integrations }: { integrations: Integration[] }) {
  const byProvider = new Map(integrations.map((i) => [i.provider, i]));

  return (
    <section id="video" className="scroll-mt-24">
      <h2 className="border-b border-border pb-4 font-display text-xl font-semibold tracking-tight">Video conferencing</h2>
      <VcRow provider="zoom" label="Zoom" note="Create meetings and send your notetaker." conn={byProvider.get('zoom')} />
      <VcRow provider="google" label="Google Meet" note="Create meetings & send notetaker." conn={byProvider.get('google')} />
      <VcRow provider="teams" label="Microsoft Teams" note="Paste a Teams link. No connection needed." />
      {integrations.length > 0 && (
        <p className="flex items-center gap-1 text-xs text-success">
          <Check className="size-3" /> Connected providers can create meetings from New Meeting.
        </p>
      )}
    </section>
  );
}
