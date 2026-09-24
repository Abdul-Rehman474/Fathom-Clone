import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const bodySchema = z.object({ text: z.string().max(20_000) });

/** Autosave target for the overlay scratchpad (PRD FR-4.2). */
export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

  const { data, error } = await supabase
    .from('calls')
    .update({ scratchpad: parsed.data.text })
    .eq('id', id)
    .eq('owner_id', user.id)
    .select('id');
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  if (!data?.length) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
