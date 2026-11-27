# Concrete publishing route

Proposed source repository name: railway-cost-observer (subject to availability). Working display name: Cost Observer — Railway Usage History & Budget Alerts. No affiliation with Railway is implied. CostGuard already has name conflicts; no legal trademark clearance is claimed for the working name.

1. Completed 2026-11-27: owner authorized public source publication following the MIT recommendation. LICENSE is MIT.
2. Push this reviewed app directory only to a dedicated GitHub repository. Do not push the private portfolio folder, original prompt, .env, databases, credentials or TLS fixture keys.
3. The public-only Verify release candidate workflow runs on a standard ubuntu-latest runner. It has read-only repository permissions, pinned official actions, a 20-minute timeout and no artifact/cache storage. Larger runners and private repository billing are excluded. Workflow source is prepared; it has not run yet. Billing source checked: https://docs.github.com/en/billing/concepts/product-billing/github-actions .
4. Wait for the real Docker and browser result. Create a release only after failures are resolved.
5. In Railway Workspace Settings → Templates → New Template, choose this GitHub source, one service and /data volume. Configure the required variables below. This composition does not require starting a billable service.
6. Publish the template after quality review. Verify the actual public page, record its real URL and add the corresponding Deploy button. Do not invent template IDs.

Variables: DATABASE_URL=file:/data/cost-observer/data.db; APP_URL=the deployment HTTPS origin; independent random ADMIN_TOKEN and ENCRYPTION_KEY (32+ chars), optional VIEWER_TOKEN. Railway provides PORT. The image initializes /data/cost-observer as root, then runs migration/web/worker as node UID 1000. One replica only. Optional notification settings are documented separately.

No owner's runtime, new subscription, domain, paid API or payment setting is needed for source publication. An actual Railway test still needs separate approval under the original zero-cost rule; do not turn a failed container check into a paid cloud deployment.
