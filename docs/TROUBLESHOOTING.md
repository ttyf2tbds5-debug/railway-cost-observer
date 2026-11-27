# Troubleshooting

CONFIGURATION_REQUIRED: run setup and db:deploy; ensure random secrets are at least 32 characters and APP_URL is correct. INVALID_ORIGIN: localhost and 127.0.0.1 are different origins; use the exact APP_URL. Authentication is not disabled for local testing.

RAILWAY_QUERY_FAILED: check workspace UUID, token type and billing access. OAuth/project tokens are unsupported. No raw upstream error is shown to avoid exposing secrets. RAILWAY_RATE_LIMIT: wait; do not increase polling blindly. SYNC_COOLDOWN: manual refresh has a one-minute floor. A failed sync preserves previous snapshots and records its status.

No new history: start npm run worker. No notifications: check optional destination and deliveryAttempts; after five failures the alert remains visible but stops retrying automatically. Restart is not a reason to invent successful delivery.

Database errors: use npm run db:deploy, which creates the SQLite file before migrations. Keep a single replica and a persistent volume. Do not manually delete data to fix a deployment. Back up using an online SQLite backup or while both processes are stopped.

Unknown invoice differences: resource estimates exclude platform fees, credits, discounts, tax, builds and other resources. Railway invoices are the authority. Submit sanitized reproduction data, not account tokens.
