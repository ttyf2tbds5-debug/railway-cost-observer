import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
try { process.loadEnvFile(); } catch {}
const url=process.env.DATABASE_URL;
if(!url?.startsWith('file:'))throw new Error('DATABASE_URL must use a persistent SQLite file');
const raw=url.slice(5); const path=isAbsolute(raw)?raw:resolve('prisma',raw);
mkdirSync(dirname(path),{recursive:true});
const database=new DatabaseSync(path);database.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');database.close();
const result=spawnSync(process.execPath,['node_modules/prisma/build/index.js','migrate','deploy'],{stdio:'inherit',env:process.env});
process.exit(result.status??1);
