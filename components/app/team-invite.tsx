'use client';

import { useState } from 'react';
import { UserPlus, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toaster';

export function TeamInvite({ inviteToken }: { inviteToken: string }) {
  const [open, setOpen] = useState(false);
  const link =
    typeof window !== 'undefined' ? `${window.location.origin}/join/${inviteToken}` : `/join/${inviteToken}`;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus /> Invite teammates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite teammates</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-text-2">Share this link. Anyone who signs in and opens it joins your workspace.</p>
        <div className="flex gap-2">
          <Input readOnly value={link} className="text-xs" />
          <Button
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(link).then(() => toast.success('Invite link copied'));
            }}
          >
            <Copy className="size-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
