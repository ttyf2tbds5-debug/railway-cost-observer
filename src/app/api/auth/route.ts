import { NextRequest, NextResponse } from 'next/server';
import { body, checkOrigin, failure, HttpError, json } from '@/lib/http';
import { equal, rateLimit, secret, session, validateConfig } from '@/lib/security';
import { z } from 'zod';
export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    if (!await rateLimit('login-global', 10, 60)) throw new HttpError(429, 'RATE_LIMITED');
    const input = z.object({ token: z.string().max(256) }).parse(await body(request));
    if (!equal(input.token, secret('ADMIN_TOKEN'))) throw new HttpError(401, 'INVALID_CREDENTIALS');
    const response = json({ ok: true });
    response.cookies.set('costobserver_session', session(), { httpOnly: true, secure: validateConfig().startsWith('https:'), sameSite: 'strict', path: '/', maxAge: 8 * 3600 });
    return response;
  } catch (error) { return failure(error); }
}
export async function DELETE(request: NextRequest) {
  try { checkOrigin(request); const response = NextResponse.json({ ok: true }); response.cookies.set('costobserver_session', '', { maxAge: 0, path: '/' }); return response; }
  catch (error) { return failure(error); }
}
