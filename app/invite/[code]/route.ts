import { NextResponse, type NextRequest } from 'next/server';

/** Referral entry point: remember the code, then send to signup (PRD FR-6.13). */
export async function GET(request: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const res = NextResponse.redirect(new URL('/signup', request.url));
  res.cookies.set('ref_code', code, { maxAge: 60 * 60 * 24 * 30, path: '/', httpOnly: true, sameSite: 'lax' });
  return res;
}
