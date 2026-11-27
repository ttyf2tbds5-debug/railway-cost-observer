import {beforeAll,afterAll,beforeEach,afterEach,it,expect,vi} from 'vitest';
import {spawnSync} from 'node:child_process';
import {db} from '../src/lib/db';
import {encrypt} from '../src/lib/security';
import {syncConnection} from '../src/lib/sync';
import {collect} from '../src/lib/railway';
import {deliverAlerts,notificationChannels} from '../src/lib/notifications';
vi.mock('../src/lib/railway',()=>({collect:vi.fn()}));
beforeAll(()=>{const p=spawnSync(process.execPath,['scripts/migrate.mjs'],{env:{...process.env,DATABASE_URL:'file:../data/test.db'},encoding:'utf8'});if(p.status!==0)throw new Error(p.stderr);});
beforeEach(async()=>{await db.connection.deleteMany();await db.lease.deleteMany();await db.audit.deleteMany();vi.clearAllMocks();});
afterAll(()=>db.$disconnect());
afterEach(()=>vi.unstubAllEnvs());
async function fixture(){
 const c=await db.connection.create({data:{name:'Fixture',workspaceId:'sync-fixture',token:encrypt('mock-token')}});
 await db.project.create({data:{id:'sync-project',name:'Fixture app',connectionId:c.id,budget:1}});
 vi.mocked(collect).mockResolvedValue({name:'Fixture',start:new Date('2026-11-01'),end:new Date('2026-12-01'),now:new Date('2026-11-10'),usage:[{measurement:'CPU_USAGE',value:43200,tags:{projectId:'sync-project',serviceId:'service'}}],projects:{pageInfo:{hasNextPage:false},edges:[{node:{id:'sync-project',name:'Fixture app',deletedAt:null}}]}});
 return c;
}
it('writes usage and budget alerts atomically and deduplicates alerts across syncs',async()=>{
 const c=await fixture();await syncConnection(c.id);await syncConnection(c.id);
 expect(await db.snapshot.count()).toBe(2);expect(await db.alert.count()).toBe(1);
 expect((await db.snapshot.findFirst())?.cost).toBe(20);
 expect(collect).toHaveBeenCalledWith('mock-token','sync-fixture');
 expect((await db.connection.findUnique({where:{id:c.id}}))?.lastError).toBeNull();
});
it('records a sanitized failure and keeps last good history',async()=>{
 const c=await fixture();await syncConnection(c.id);vi.mocked(collect).mockRejectedValue(new Error('secret mock-token must not be logged'));
 await expect(syncConnection(c.id)).rejects.toThrow('SYNC_FAILED');
 expect(await db.snapshot.count()).toBe(1);
 expect((await db.connection.findUnique({where:{id:c.id}}))?.lastError).toBe('SYNC_FAILED');
 expect((await db.lease.findUnique({where:{id:c.id}}))?.expiresAt.getTime()).toBe(0);
});
it('refuses an overlapping sync',async()=>{
 const c=await fixture();await db.lease.create({data:{id:c.id,expiresAt:new Date(Date.now()+60000)}});await expect(syncConnection(c.id)).rejects.toThrow('SYNC_IN_PROGRESS');expect(collect).not.toHaveBeenCalled();
});
it('retries a failed notification and marks a successful delivery',async()=>{
 const c=await fixture();await syncConnection(c.id);process.env.NOTIFY_WEBHOOK_URL='https://example.invalid/fixture';
 const failed=vi.fn().mockRejectedValue(new Error('network failed'));await deliverAlerts(failed);
 let a=await db.alert.findFirstOrThrow();expect(a.deliveryAttempts).toBe(1);expect(a.deliveredAt).toBeNull();expect(+a.nextAttemptAt).toBeGreaterThan(Date.now());
 await db.delivery.updateMany({where:{alertId:a.id},data:{nextAttemptAt:new Date(0)}});
 const ok=vi.fn().mockResolvedValue(undefined);await deliverAlerts(ok);a=await db.alert.findFirstOrThrow();expect(a.deliveredAt).not.toBeNull();expect(ok).toHaveBeenCalledOnce();delete process.env.NOTIFY_WEBHOOK_URL;
});
it('sends email and Telegram only through explicitly configured adapters and does not resend successful channels',async()=>{
 const c=await fixture();await syncConnection(c.id);
 vi.stubEnv('TELEGRAM_BOT_TOKEN','12345:synthetic_fixture_token_only_0000');vi.stubEnv('TELEGRAM_CHAT_ID','-123');vi.stubEnv('SMTP_HOST','smtp.example.invalid');vi.stubEnv('SMTP_FROM','sender@example.invalid');vi.stubEnv('SMTP_TO','owner@example.invalid');
 const send=vi.fn().mockResolvedValue(undefined),mail=vi.fn().mockRejectedValue(new Error('fixture failure'));
 await deliverAlerts(send,mail);expect(send).toHaveBeenCalledOnce();expect(send.mock.calls[0][0]).toContain('/sendMessage');expect(send.mock.calls[0][1].text).toContain('Fixture app');expect(send.mock.calls[0][2]).toBe(true);expect(mail).toHaveBeenCalledOnce();
 await db.delivery.updateMany({where:{channel:'email'},data:{nextAttemptAt:new Date(0)}});mail.mockResolvedValue(undefined);await deliverAlerts(send,mail);
 expect(send).toHaveBeenCalledOnce();expect(mail).toHaveBeenCalledTimes(2);expect((await db.alert.findFirstOrThrow()).deliveredAt).not.toBeNull();
});
it('disabled project policy suppresses new alerts',async()=>{
 const c=await fixture();await db.project.update({where:{id:'sync-project'},data:{alertsEnabled:false}});await syncConnection(c.id);expect(await db.alert.count()).toBe(0);expect(await db.snapshot.count()).toBe(1);
});
it('uses exponential polling backoff for provider failures',async()=>{
 const c=await fixture();vi.mocked(collect).mockRejectedValue(new Error('RAILWAY_RATE_LIMIT'));await expect(syncConnection(c.id)).rejects.toThrow();
 const record=await db.connection.findUniqueOrThrow({where:{id:c.id}});expect(record.failureCount).toBe(1);expect(+record.nextSyncAt).toBeGreaterThan(Date.now()+50000);
});
it('rejects partial notification configuration before sending anything',()=>{
 expect(()=>notificationChannels({TELEGRAM_BOT_TOKEN:'incomplete'})).toThrow('CONFIG_TELEGRAM');expect(()=>notificationChannels({SMTP_HOST:'smtp.example.invalid',SMTP_PORT:'25',SMTP_FROM:'a@b.test',SMTP_TO:'a@b.test'})).toThrow('CONFIG_SMTP');
});
