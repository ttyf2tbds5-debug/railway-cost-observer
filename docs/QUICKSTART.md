# First run

Requirements: Node.js 24, npm and an installed Chrome for browser tests. Run npm ci, npm run setup, npm run db:deploy and npm run dev. Read your local ADMIN_TOKEN from .env and visit http://localhost:3000. Run npm run worker in another terminal.

Use your own Railway account/workspace token. Find the workspace UUID in Railway workspace settings. Save it under Connections and click Sync usage. A first successful read creates projects and snapshots. Set budgets in Projects. Forecasts require 24 hours elapsed in the billing period. Charts require two snapshots in the same period. A zero spend with no data is not a verified zero bill.

Environment: ADMIN_TOKEN and ENCRYPTION_KEY are required, 32+ characters; DATABASE_URL is a persistent SQLite file; APP_URL is the exact browser origin. VIEWER_TOKEN enables read-only API access. NOTIFY_WEBHOOK_URL and NOTIFY_FORMAT=json|discord configure an optional user-owned destination. No notification is sent when the URL is absent.
