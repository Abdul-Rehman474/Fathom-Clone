import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const bodySchema = z.object({
  source: z.enum(['upload', 'tab', 'bot']),
  platform: z.enum(['meet', 'zoom', 'teams', 'upload', 'browser']),
  title: z.string().max(200).optional(),
  meeting_url: z.string().url().optional(),
});

/** Create a call row owned by the current user (architecture.md §8). */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body', issues: parsed.error.issues }, { status: 400 });
  }
  const { source, platform, title, meeting_url } = parsed.data;

  const status = source === 'upload' ? 'uploading' : source === 'tab' ? 'recording' : 'scheduled';

  const { data, error } = await supabase
    .from('calls')
    .insert({
      owner_id: user.id,
      source,
      platform,
      title: title ?? null,
      meeting_url: meeting_url ?? null,
      status,
      media_kind: source === 'tab' ? 'audio' : null,
    })
    .select('id')
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'insert_failed', message: 'The call could not be created. Try again.' },
      { status: 500 },
    );
  }
  return NextResponse.json({ id: data.id });
}
