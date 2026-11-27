import { db } from '@/lib/db';
import { validateConfig } from '@/lib/security';
import { notificationChannels } from '@/lib/notifications';
export const dynamic = 'force-dynamic';
export async function GET() {
  try { validateConfig(); notificationChannels(); await db.connection.count(); return Response.json({ status: 'ready' }); }
  catch { return Response.json({ status: 'not_ready' }, { status: 503 }); }
}
