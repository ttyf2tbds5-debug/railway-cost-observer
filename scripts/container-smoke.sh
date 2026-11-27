#!/usr/bin/env bash
set -euo pipefail
name="cost-observer-check-${RANDOM}"
volume="${name}-data"
cleanup() { docker rm -f "$name" >/dev/null 2>&1 || true; docker volume rm "$volume" >/dev/null 2>&1 || true; }
trap cleanup EXIT
export ADMIN_TOKEN ENCRYPTION_KEY VIEWER_TOKEN
ADMIN_TOKEN="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
ENCRYPTION_KEY="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
VIEWER_TOKEN="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
if [ "${GITHUB_ACTIONS:-}" = "true" ]; then
  echo "::add-mask::$ADMIN_TOKEN"
  echo "::add-mask::$ENCRYPTION_KEY"
  echo "::add-mask::$VIEWER_TOKEN"
fi
docker build --tag cost-observer:validation .
docker volume create "$volume" >/dev/null
docker run -d --name "$name" --publish 127.0.0.1::3000 --mount "type=volume,source=$volume,target=/data" -e ADMIN_TOKEN -e ENCRYPTION_KEY -e VIEWER_TOKEN -e APP_URL=http://localhost:3000 cost-observer:validation >/dev/null
port="$(docker port "$name" 3000/tcp | head -n 1 | sed 's/.*://')"
wait_ready() {
  for _ in $(seq 1 60); do
    if curl -fsS "http://127.0.0.1:$port/api/ready" >/dev/null; then return; fi
    sleep 1
  done
  docker logs "$name"
  return 1
}
wait_ready
test "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$port/api/v1/dashboard")" = "401"
docker exec "$name" node --input-type=module -e '
import fs from "node:fs";
const rows=fs.readdirSync("/proc").filter(x=>/^\d+$/.test(x)).flatMap(id=>{try{return [{id,cmd:fs.readFileSync(`/proc/${id}/cmdline`,"utf8"),status:fs.readFileSync(`/proc/${id}/status`,"utf8")}]}catch{return []}});
const workers=rows.filter(x=>x.id!==String(process.pid)&&(x.cmd.includes("src/worker.ts")||x.cmd.includes("next-server")));
if(workers.length<2||workers.some(x=>!/^Uid:\s+1000\s/m.test(x.status)))throw new Error("Web and worker must both run as UID 1000");
console.log("Verified web and worker privileges");
'
docker exec "$name" node --input-type=module -e '
import {PrismaClient} from "@prisma/client";
const db=new PrismaClient();
const c=await db.connection.create({data:{name:"Synthetic persistence check",workspaceId:"container-fixture",token:"intentionally-unusable",nextSyncAt:new Date(Date.now()+86400000)}});
await db.project.create({data:{id:"container-fixture",name:"Synthetic persistence check",connectionId:c.id,budget:42}});await db.$disconnect();
'
docker restart "$name" >/dev/null
wait_ready
curl -fsS -H "Authorization: Bearer $VIEWER_TOKEN" "http://127.0.0.1:$port/api/v1/dashboard" | node --input-type=module -e '
let s="";for await(const b of process.stdin)s+=b;const d=JSON.parse(s);if(!d.projects.some(p=>p.id==="container-fixture"&&p.budget===42))throw new Error("Persistence failed");if(d.connections.some(c=>"token" in c))throw new Error("Credential exposure");console.log("Verified persistence across container restart and credential redaction");
'
echo "Container build, readiness, privileges and volume persistence checks passed."
