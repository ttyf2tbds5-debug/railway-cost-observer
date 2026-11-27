# Cost Observer — private Railway usage history and project budgets

**Release candidate, MIT licensed. Linux container verification is pending. Not yet published to Railway.**

Cost Observer (the CostGuard working project) helps small teams inspect Railway resource usage across workspaces, retain cost snapshots, set advisory project budgets, and read results through an authenticated REST API or a read-only MCP bridge. No central developer-operated server or paid AI API is required.

## Implemented
- Account/workspace-token read queries against Railway's official GraphQL API.
- CPU, memory, egress, disk and backup resource cost estimates with a documented rate table.
- Billing-period-aware linear forecast, advisory budgets, spike detection and deduplicated alerts.
- Encrypted stored connection tokens, admin session login, admin and viewer API roles, persistent request throttling and audit records.
- English dark/light responsive dashboard, per-project chart, historical CSV export.
- Polling worker, 90-day retention, JSON webhook, Discord, Telegram and SMTP notifications with durable per-channel retries; configurable project notification rules and evidence-based resource review hints.
- OpenAPI, integration examples and three MCP read tools.

## Quick start (Node.js 24)
```sh
npm ci
npm run setup
npm run db:deploy
npm run dev
```
Open http://localhost:3000 and sign in with ADMIN_TOKEN from your newly generated local .env. Then run `npm run worker` in a second terminal for polling. Add your own Railway account/workspace token and workspace UUID under Connections; click Sync usage. Project tokens and OAuth tokens are not supported by this adapter.

For production-style local testing: `npm run build`, then `npm start` and a separate `npm run worker`. The Docker entrypoint runs both processes and migrates the database. Docker validation is still pending; do not treat the presence of a Dockerfile as evidence it was tested.

## Deployment and costs
One Railway service, one persistent /data volume, one replica. Set DATABASE_URL=file:/data/cost-observer/data.db, APP_URL to your HTTPS deployment origin and independent random ADMIN_TOKEN and ENCRYPTION_KEY (at least 32 characters each). VIEWER_TOKEN is optional. Never use the maintainer's secrets. The deployer pays their own Railway resources. No external AI API is used. Optional notification destinations are supplied by the deployer and may have their own costs.

No Deploy button is included because no verified template URL exists yet. See docs/RAILWAY.md for the exact composition checklist.

## Limits and honest estimates
Standard rates are sourced from Railway pricing and its official CLI on 2026-11-27. This is resource usage estimation, not invoice reconciliation: platform subscriptions, credits, discounts, taxes, build and other charges are excluded. Forecasting starts after the first 24 hours of a billing period and assumes constant usage. Alerting never caps or stops a Railway service. There are no Railway mutations.

Single operator installation with a read-only API role, not a multi-tenant SaaS. SQLite requires one replica. Dashboard history is the latest 96 samples per project; CSV exports the latest 10,000 snapshots. Stored history is retained for 90 days by the worker. SMTP email, Telegram, configurable alert policies and resource review hints are implemented. No service-stop/delete/scale action is exposed; period-average hints do not guarantee savings. Full live provider delivery is not verified by mocks. See RELEASE_GATES.md.

## Development
```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
npm audit
```
Browser tests use installed Chrome. They use local fake credentials and never sync the fixture connection to Railway. Runtime adapter tests are mocked; official API schemas and usage were separately checked read-only with Railway CLI. That is not a complete live application integration test.

Documentation: docs/QUICKSTART.md, docs/API.md, docs/AI_INTEGRATION.md, docs/TROUBLESHOOTING.md, SECURITY.md and RELEASE_GATES.md. Application source: MIT license. Third-party dependencies retain their own licenses; see docs/DEPENDENCY_REVIEW.md.
