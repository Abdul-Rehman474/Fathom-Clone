'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plug, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SettingsRow } from '@/components/ui/settings-row';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toaster';

const INTEGRATIONS = ['Claude', 'ChatGPT', 'Zapier', 'Slack', 'Salesforce', 'HubSpot', 'Task Manager'];

/** Integrations + API/MCP + apps: all "coming soon" modals (UI.md §12.4-7). */
export function IntegrationsSection() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section id="integrations" className="scroll-mt-24">
      <h2 className="border-b border-border pb-4 font-display text-xl font-semibold tracking-tight">Integrations</h2>
      {INTEGRATIONS.map((name) => (
        <SettingsRow
          key={name}
          icon={<Plug />}
          title={name}
          description="Sync data with your other tools."
          control={
            <Button size="sm" variant="tint" onClick={() => setOpen(name)}>
              Connect
            </Button>
          }
        />
      ))}
      <SettingsRow
        icon={<Plug />}
        title="API Access & MCP Server"
        description="Build on Fathom’s API and MCP server."
        control={
          <Button size="sm" variant="secondary" onClick={() => setOpen('API Access')}>
            Set up
          </Button>
        }
      />

      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{open} is coming soon</DialogTitle>
            <DialogDescription>
              This integration is presented as UI only in this build. The core capture → transcript
              → summary → Ask pipeline is fully functional.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </section>
  );
}

/** Delete account: confirm by typing DELETE (UI.md §12.9). */
export function DangerZone() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  async function del() {
    setBusy(true);
    const res = await fetch('/api/account/delete', { method: 'POST' });
    if (res.ok) {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/');
    } else {
      setBusy(false);
      toast.error('Could not delete account');
    }
  }

  return (
    <section id="account" className="scroll-mt-24">
      <h2 className="border-b border-border pb-4 font-display text-xl font-semibold tracking-tight">Delete account</h2>
      <div className="mt-5 rounded-card border border-danger/30 p-6">
        <p className="text-sm text-danger">
          Deleting your account is permanent. All recordings and data will be deleted.
        </p>
        <Button variant="danger" className="mt-4" onClick={() => setOpen(true)}>
          <Trash2 /> Delete Account
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This cannot be undone. Type <strong>DELETE</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="DELETE" />
          <Button variant="danger" disabled={confirm !== 'DELETE' || busy} onClick={del}>
            {busy ? 'Deleting…' : 'Permanently delete'}
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}
