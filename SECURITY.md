# Security model

This is a single-operator installation; anyone with ADMIN_TOKEN controls local connections. A separate optional VIEWER_TOKEN can only read APIs. Sessions expire after eight hours, use HttpOnly/SameSite=Strict and Secure cookies on HTTPS. Cookie writes require the configured origin. Tokens are compared with fixed-length hashes using timingSafeEqual. Login attempts have a persistent installation-wide throttle; this intentionally trades availability for a simple small-deployment abuse limit.

Railway tokens are AES-256-GCM encrypted with a random nonce. The encryption key must be protected alongside the SQLite volume. Compromise of the host/environment compromises stored secrets. No encryption-at-rest design here protects against a fully compromised host. Railway requests use a fixed HTTPS endpoint and do not follow redirects; only compiled query documents are sent.

Notifications accept deployment-admin configuration only. HTTPS, public IPv4 DNS checks, pinned socket lookup and no redirects mitigate SSRF/rebinding. IPv6-only destinations are currently unsupported. Generic webhook receivers should deduplicate by event id because network retries can duplicate delivery. Discord mentions are disabled. Real outbound delivery and DNS/TLS behavior still require additional testing before production release.

Threats considered: unauthenticated access, CSRF, stored token disclosure, CSV formula injection, GraphQL error leakage, request abuse, internal-network webhook access, concurrent syncs, partial writes and worker failure. Tests cover principal negative cases; this is not independent security certification.

Hard limits: no multi-tenant access separation, no SSO, no user self-registration, no encrypted SQLite volume, no service-stop controls. CSP permits inline script/style for the current Next.js implementation; nonce-based tightening is a release follow-up. Never paste tokens or private billing information into issues. A private reporting contact must be configured when the repository is published.
