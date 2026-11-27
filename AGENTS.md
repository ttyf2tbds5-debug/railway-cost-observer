# Cost Observer contributor instructions

Node 24, Next.js App Router, strict TypeScript, Prisma SQLite. src/lib owns accounting, security, GraphQL, sync and notification behavior. src/app/api exposes authenticated endpoints. src/worker.ts runs polling; src/mcp.ts is a stdio-to-REST read-only bridge. prisma/migrations is the versioned database history. Tests use mocks and isolated SQLite; e2e uses local Chrome.

Run setup and db:deploy before first local start. Never read .env into messages or commits. Do not call real paid AI APIs. No mutation operation may be added to the Railway adapter. Do not weaken outbound private-IP filtering. APP_URL must exactly match the browser's origin for cookie writes.

After edits run typecheck, lint and relevant tests; run build and browser checks for release. Do not claim Docker/Railway tests passed without running them. Documentation must match implemented scope. Read RELEASE_GATES.md before publishing. No owner telemetry or shared central service.
