# Deploy and Host Cost Observer on Railway

Self-hosted Railway usage history, project budgets and alerts for small teams and independent developers. Keep your monitoring data in your own Railway account, with a dashboard, REST API and read-only MCP integration.

## Common Use Cases

- Resource usage history, billing-period estimates, linear forecasts and CSV export.
- Project budgets and configurable budget, forecast and anomaly alerts.
- CPU, memory, egress and storage review hints with supporting numbers.
- Optional JSON webhook, Discord, Telegram and SMTP notifications with durable retries.
- Encrypted Railway connections, admin authentication and a separate viewer API token.
- OpenAPI documentation and five integration examples.

## About Hosting Cost Observer

This template provisions one Docker service and a persistent `/data` volume. It generates independent admin, encryption and viewer secrets, configures the public HTTPS origin and uses port 3000. Keep one replica because the database is SQLite.

1. Deploy the template in your own Railway workspace.
2. Open the generated service URL. Copy your generated `ADMIN_TOKEN` from that service's Variables tab and use it to sign in. Keep this token private.
3. In Connections, add your own Railway account/workspace token and workspace UUID, then choose Sync usage. The connection token is encrypted at rest.
4. Set project budgets. Configure optional notification destinations using the linked documentation. Polling runs every 15 minutes; history is retained for 90 days by default.

Use `/api/ready` for readiness checks and `/openapi.json` for the API specification. Do not rotate `ENCRYPTION_KEY` without a migration plan: it protects stored connection credentials. Back up your volume before upgrades.

## Dependencies for Cost Observer Hosting

### Deployment Dependencies

- One Railway service built from the included Node.js 24 Dockerfile.
- A persistent volume mounted at `/data` for the SQLite database.
- Your own Railway account/workspace token to read usage. Notification providers are optional.

## Why Deploy Cost Observer on Railway?

The template configures the Docker service, HTTPS networking, generated application secrets and persistent storage together. Your monitoring data remains in your own workspace alongside the services you track. Keep this SQLite deployment at one replica.

## Cost and scope

You pay for your own Railway service/volume usage and any optional notification provider. There is no maintainer-hosted backend or paid AI dependency. Estimates exclude platform fees, credits, discounts, taxes and other non-tracked charges; they are not invoices. Budgets trigger advisory alerts, not spending caps. This application never stops, deletes or scales your Railway services. Resource hints do not guarantee savings. Intended for a single operator/team, not multi-tenant SaaS.

## Verification and support

The public Linux CI passed typecheck, lint, 52 unit/integration tests, 5 browser tests, production build, dependency audit and Docker startup/non-root/persistence checks. A live Railway deployment and real external notification delivery have not been verified by the maintainer. Screenshots in the repository use labeled synthetic examples.

- [Source, screenshots and documentation](https://github.com/ttyf2tbds5-debug/railway-cost-observer)
- [Notification setup](https://github.com/ttyf2tbds5-debug/railway-cost-observer/blob/main/docs/NOTIFICATIONS.md)
- [Verified CI run](https://github.com/ttyf2tbds5-debug/railway-cost-observer/actions/runs/45948392323)
- [Report an issue](https://github.com/ttyf2tbds5-debug/railway-cost-observer/issues)

MIT licensed. Independent project; no affiliation with Railway is implied.
