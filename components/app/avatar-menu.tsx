'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/toaster';

export function AvatarMenu({ name, email }: { name: string; email: string }) {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const webOnly = () => toast.info('There is no desktop app. Everything runs in the browser.');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full focus-visible:outline-none">
          <Avatar name={name} size={32} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuItem onSelect={() => router.push('/calls?new=1')}>Start Test Call</DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/help">Tutorial</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/help">FAQs</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/integrations">Developers</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/legal/privacy">Privacy Policy</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/legal/terms">Terms of Service</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/security">Security &amp; Compliance</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/status">System Status</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={webOnly}>Download App</DropdownMenuItem>
        <DropdownMenuItem destructive onSelect={logout}>
          Logout
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2 py-1 text-xs text-text-3">
          Logged in as
          <div className="truncate text-text-2">{email}</div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
