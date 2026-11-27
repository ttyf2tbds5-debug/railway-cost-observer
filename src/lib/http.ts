import { NextRequest, NextResponse } from 'next/server';
import { equal, rateLimit, secret, validSession, validateConfig } from './security';
export class HttpError extends Error { constructor(public status: number, public code: string) { super(code); } }
export async function authorize(request: NextRequest, write = false) {
  validateConfig();
  const bearer = request.headers.get('authorization')?.replace(/^Bearer /, '');
  let role: 'admin' | 'viewer' | null = null;
  if (bearer) {
    if (equal(bearer, secret('ADMIN_TOKEN'))) role = 'admin';
    else if (process.env.VIEWER_TOKEN && process.env.VIEWER_TOKEN.length >= 32 && equal(bearer, process.env.VIEWER_TOKEN)) role = 'viewer';
  } else if (validSession(request.cookies.get('costobserver_session')?.value ?? '')) role = 'admin';
  if (!role) throw new HttpError(401, 'UNAUTHORIZED');
  if (write && role !== 'admin') throw new HttpError(403, 'FORBIDDEN');
  if (write && !bearer) checkOrigin(request);
  if (!await rateLimit(`api:${role}:${write?'write':'read'}`, write ? 120 : 600, 60)) throw new HttpError(429, 'RATE_LIMITED');
  return role;
}
export function checkOrigin(request: NextRequest) {
  if (request.headers.get('origin') !== validateConfig()) throw new HttpError(403, 'INVALID_ORIGIN');
}
export async function body(request: NextRequest) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new HttpError(415, 'JSON_REQUIRED');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'INVALID_JSON');
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    for (;;) {
      const chunk = await reader.read(); if (chunk.done) break;
      length += chunk.value.length;
      if (length > 16384) { await reader.cancel(); throw new HttpError(413, 'BODY_TOO_LARGE'); }
      chunks.push(chunk.value);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch (error) { if (error instanceof HttpError) throw error; throw new HttpError(400, 'INVALID_JSON'); }
}
export function json(value: unknown, status = 200) { return NextResponse.json(value, { status, headers: { 'Cache-Control': 'no-store' } }); }
export function failure(error: unknown) {
  if (error instanceof HttpError) return json({ error: { code: error.code } }, error.status);
  if (error instanceof Error && error.name === 'ZodError') return json({ error: { code: 'VALIDATION_ERROR' } }, 400);
  if (error instanceof Error && error.message.startsWith('CONFIG_')) return json({ error: { code: 'CONFIGURATION_REQUIRED' } }, 503);
  return json({ error: { code: 'INTERNAL_ERROR' } }, 500);
}
