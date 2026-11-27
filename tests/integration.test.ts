import {beforeAll,afterAll,it,expect} from 'vitest';
import {spawnSync} from 'node:child_process';
import {db} from '../src/lib/db';
import {encrypt,rateLimit} from '../src/lib/security';
import {dashboard} from '../src/lib/dashboard';
beforeAll(async()=>{
 const migrated=spawnSync(process.execPath,['scripts/migrate.mjs'],{env:{...process.env,DATABASE_URL:'file:../data/test.db'},encoding:'utf8'});
 if(migrated.status!==0)throw new Error(migrated.stderr);
 await db.connection.deleteMany();await db.rateLimit.deleteMany();await db.audit.deleteMany();
});
afterAll(()=>db.$disconnect());
it('persists project history without returning stored credentials',async()=>{
 const connection=await db.connection.create({data:{name:'Fixture',workspaceId:'fixture',token:encrypt('secret-fixture')}});
 await db.project.create({data:{id:'fixture',name:'Fixture app',connectionId:connection.id,budget:20,snapshots:{create:{periodStart:new Date('2026-11-01'),periodEnd:new Date('2026-12-01'),cost:3,forecast:8,metrics:'[]'}}}});
 await db.$disconnect();
 const data=await dashboard();expect(data.projects[0].snapshots[0].cost).toBe(3);expect(JSON.stringify(data)).not.toContain('secret-fixture');expect(data.connections[0]).not.toHaveProperty('token');
 await db.connection.delete({where:{id:connection.id}});expect(await db.snapshot.count()).toBe(0);
});
it('persists rate limits across reconnects',async()=>{
 expect(await rateLimit('test',2,60)).toBe(true);await db.$disconnect();expect(await rateLimit('test',2,60)).toBe(true);expect(await rateLimit('test',2,60)).toBe(false);
});
