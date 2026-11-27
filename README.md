# Cost Observer — private Railway usage history and project budgets

**MIT licensed. Published on Railway Marketplace. Linux CI and Docker checks passed on 2026-11-27.**

[Deploy Cost Observer on Railway](https://railway.com/deploy/cost-observer) · [Verified CI run](https://github.com/ttyf2tbds5-debug/railway-cost-observer/actions/runs/45948392323)

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

For production-style local testing: `npm run build`, then `npm start` and a separate `npm run worker`. The Docker entrypoint runs both processes and migrates the database. Linux CI verified the Docker build, fresh-volume startup, non-root processes and persistence across restart.

## Deployment and costs
One Railway service, one persistent /data volume, one replica. Set DATABASE_URL=file:/data/cost-observer/data.db, APP_URL to your HTTPS deployment origin and independent random ADMIN_TOKEN and ENCRYPTION_KEY (at least 32 characters each). VIEWER_TOKEN is optional. Never use the maintainer's secrets. The deployer pays their own Railway resources. No external AI API is used. Optional notification destinations are supplied by the deployer and may have their own costs.

The [published Railway template](https://railway.com/deploy/cost-observer) configures the service, persistent volume, HTTPS origin and independent generated secrets. After deployment, copy the resolved ADMIN_TOKEN from your service's Variables tab to sign in. See docs/RAILWAY.md for setup. No maintainer-owned paid runtime was started; a live Railway deployment and real external notification delivery remain unverified.

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
