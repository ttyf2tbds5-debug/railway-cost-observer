# Deploy Cost Observer on Railway

Open https://railway.com/deploy/cost-observer and deploy in your own workspace. The deployer pays their own Railway resource usage.

The template includes one Docker service, a persistent /data volume, HTTP port 3000, DATABASE_URL=file:/data/cost-observer/data.db and APP_URL referencing the generated HTTPS domain. Independent admin, encryption and viewer secrets are generated for each deployment. Never paste the maintainer's credentials.

Once the deployment is ready, open its public domain. Copy the resolved ADMIN_TOKEN from the service Variables tab to sign in. In Connections add your own Railway account/workspace token and workspace UUID, then Sync usage. Project and OAuth tokens are unsupported. Configure project budgets and optional notification providers as described in NOTIFICATIONS.md.

Keep one replica. The container initializes volume ownership then runs migration, web and worker as node UID 1000. Readiness is /api/ready. Changing ENCRYPTION_KEY without migrating encrypted credentials makes saved connections unreadable. Back up the volume before upgrades. If adding a custom domain, update APP_URL to exactly match its HTTPS origin.

Linux container checks passed in public CI. The maintainer has not run a paid Railway demo or verified live external notification delivery. See PUBLISHING.md and RELEASE_GATES.md.
