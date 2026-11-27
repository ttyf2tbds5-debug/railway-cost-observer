# Cost Observer — Railway Usage History & Budget Alerts

Private cost visibility for small Railway installations. Connect your own account/workspace tokens, keep resource usage history, set project budgets, and inspect cost signals through a dashboard, REST API or read-only MCP bridge.

Features: billing-period resource estimates and linear forecasts; encrypted workspace connections; CSV export; configurable budget/forecast/anomaly notification policies; service-level CPU, memory, egress and storage review hints; JSON webhook, Discord, Telegram and SMTP alerts with durable channel-level retries.

Runs in your account with one service and a persistent volume. No maintainer-hosted backend or paid AI dependency. You pay your own Railway resources and any charges from your optional notification provider. Resource estimates exclude platform fees, credits, discounts, tax, builds and other non-tracked charges. Hints do not guarantee savings. No automatic stopping, deletion or scaling is implemented.

Deploy requirements: Node 24 Docker image, one replica, /data volume, APP_URL and two independent random secrets. API: /openapi.json. Health: /api/health and /api/ready. See README and docs/NOTIFICATIONS.md.

Publication draft only: insert the verified source repository, actual template URL and CI result after approval. Do not publish a stable listing until container validation has actually passed. Screenshots are real local captures; populated examples use synthetic labeled data.
