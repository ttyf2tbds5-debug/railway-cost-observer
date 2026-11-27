# Publication status

Published on 2026-11-27: https://railway.com/deploy/cost-observer
Source: https://github.com/ttyf2tbds5-debug/railway-cost-observer
Verified CI: https://github.com/ttyf2tbds5-debug/railway-cost-observer/actions/runs/45948392323

The owner authorized public source and MIT. The Marketplace listing is PUBLISHED and its public page was visually verified. Railway's separate isApproved/isVerified flags are false at publication; no Railway verification badge is claimed. The initial total project count and payout are zero. Publication does not guarantee deployments or earnings.

The template uses one Docker service, one persistent /data volume, port 3000 and an automatically referenced HTTPS origin. ADMIN_TOKEN, ENCRYPTION_KEY and VIEWER_TOKEN each use an independent secret(64) generator. Every template variable has a description. No owner credential is embedded. Healthcheck and replica configuration are in railway.toml.

Linux CI passed typecheck, lint, 52 unit/integration/MCP/network tests, 5 browser tests, production build, dependency audit and Docker build/startup/non-root/persistence checks. The restart smoke test rediscovering the mapped ephemeral port is included in the successful commit.

No paid maintainer runtime, subscription, domain or external notification provider was started. A live Railway application deployment and real external notification delivery remain unverified. Keep one replica and back up the volume before upgrades. Estimates are not invoices; alerts never stop/delete/scale services.

Kickback program reference: https://docs.railway.com/templates/kickbacks
