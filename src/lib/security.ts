import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { db } from './db';

export function secret(name: string) {
  const value = process.env[name];
  if (!value || value.length < 32) throw new Error(`CONFIG_${name}`);
  return value;
}
function key() { return createHash('sha256').update(secret('ENCRYPTION_KEY')).digest(); }
export function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64');
}
export function decrypt(value: string) {
  const bytes = Buffer.from(value, 'base64');
  const cipher = createDecipheriv('aes-256-gcm', key(), bytes.subarray(0, 12));
  cipher.setAuthTag(bytes.subarray(12, 28));
  return Buffer.concat([cipher.update(bytes.subarray(28)), cipher.final()]).toString('utf8');
}
export function equal(a: string, b: string) {
  return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
}
export function session(now = Date.now()) {
  const payload = `${now + 8 * 3600_000}.${randomBytes(16).toString('hex')}`;
  return `${payload}.${createHmac('sha256', secret('ADMIN_TOKEN')).update(payload).digest('hex')}`;
}
export function validSession(value: string, now = Date.now()) {
  const [expires, nonce, signature, extra] = value.split('.');
  if (extra || !nonce || !signature || !Number.isFinite(Number(expires)) || Number(expires) <= now || Number(expires) > now + 8 * 3600_000) return false;
  return equal(signature, createHmac('sha256', secret('ADMIN_TOKEN')).update(`${expires}.${nonce}`).digest('hex'));
}
export async function rateLimit(id: string, limit: number, seconds: number) {
  const now = new Date();
  await db.rateLimit.deleteMany({ where: { expiresAt: { lte: now } } });
  const bucket = await db.rateLimit.upsert({ where: { id }, create: { id, count: 1, expiresAt: new Date(now.getTime() + seconds * 1000) }, update: { count: { increment: 1 } } });
  return bucket.count <= limit;
}
export function validateConfig() {
  secret('ADMIN_TOKEN'); secret('ENCRYPTION_KEY');
  const origin = new URL(process.env.APP_URL ?? 'http://localhost:3000');
  if (origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password) throw new Error('CONFIG_APP_URL');
  if (process.env.NODE_ENV === 'production' && origin.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(origin.hostname)) throw new Error('CONFIG_HTTPS_REQUIRED');
  return origin.origin;
}
