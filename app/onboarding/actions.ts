'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { seedDemoCall } from '@/lib/seed/demo-call';
import { randomBytes } from 'node:crypto';

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return { supabase, user };
}

export async function saveAccountType(formData: FormData) {
  const accountType = z.enum(['personal', 'team']).parse(formData.get('account_type'));
  const { supabase, user } = await requireUser();
  await supabase
    .from('profiles')
    .update({ account_type: accountType, onboarding_step: 2 })
    .eq('id', user.id);
  redirect('/onboarding/preferences');
}

export async function savePreferences(formData: FormData) {
  const schema = z.object({ notes_on: z.string().min(1), share_with: z.string().min(1) });
  const { notes_on, share_with } = schema.parse({
    notes_on: formData.get('notes_on'),
    share_with: formData.get('share_with'),
  });
  const { supabase, user } = await requireUser();
  await supabase.from('user_settings').update({ notes_on, share_with }).eq('user_id', user.id);
  await supabase.from('profiles').update({ onboarding_step: 3 }).eq('id', user.id);
  redirect('/onboarding/about-you');
}

export async function saveAboutYou(formData: FormData) {
  const schema = z.object({ department: z.string().min(1), role: z.string().min(1) });
  const { department, role } = schema.parse({
    department: formData.get('department'),
    role: formData.get('role'),
  });
  const { supabase, user } = await requireUser();
  await supabase.from('profiles').update({ department, role, onboarding_step: 4 }).eq('id', user.id);
  redirect('/onboarding/usage');
}

export async function saveUsage(formData: FormData) {
  const usage = z.enum(['solo', 'team']).parse(formData.get('usage'));
  const { supabase, user } = await requireUser();

  if (usage === 'team') {
    // Create a workspace named "{First}'s Team" and add the owner as a member.
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();
    const first = (profile?.full_name ?? 'My').split(' ')[0];
    const { data: existing } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();
    if (!existing) {
      const inviteToken = randomBytes(16).toString('base64url');
      const { data: ws } = await supabase
        .from('workspaces')
        .insert({ name: `${first}'s Team`, owner_id: user.id, invite_token: inviteToken })
        .select('id')
        .single();
      if (ws) {
        await supabase
          .from('workspace_members')
          .insert({ workspace_id: ws.id, user_id: user.id, role: 'owner' });
      }
    }
  }

  await supabase
    .from('profiles')
    .update({ usage, account_type: usage === 'team' ? 'team' : 'personal', onboarding_step: 5 })
    .eq('id', user.id);
  redirect('/onboarding/connect');
}

export async function advanceToFirstCall() {
  const { supabase, user } = await requireUser();
  await supabase.from('profiles').update({ onboarding_step: 6 }).eq('id', user.id);
  redirect('/onboarding/first-call');
}

export async function finishOnboarding() {
  const { supabase, user } = await requireUser();
  await supabase
    .from('profiles')
    .update({ onboarding_done: true, onboarding_step: 6 })
    .eq('id', user.id);
  try {
    await seedDemoCall(supabase, user.id);
  } catch {
    // Never block finishing onboarding on the demo seed.
  }
  await creditReferrer(user.id);
  redirect('/calls');
}

/** If the user arrived via /invite/{code}, credit the inviter +10 (FR-6.13). */
async function creditReferrer(inviteeId: string) {
  try {
    const store = await cookies();
    const code = store.get('ref_code')?.value;
    if (!code) return;
    const admin = createAdminClient();
    const { data: inviter } = await admin
      .from('profiles')
      .select('id, credits')
      .eq('invite_code', code)
      .maybeSingle();
    if (inviter && inviter.id !== inviteeId) {
      await admin.from('referrals').insert({ inviter_id: inviter.id, invitee_id: inviteeId });
      await admin.from('profiles').update({ credits: (inviter.credits ?? 25) + 10 }).eq('id', inviter.id);
    }
    store.delete('ref_code');
  } catch {
    // Referral crediting is best-effort.
  }
}
