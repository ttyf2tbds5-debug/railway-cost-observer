# Changelog

## Release candidate — 2026-11-27 (unreleased)
- Added SMTP and Telegram, durable per-channel retries and visible delivery status.
- Added project notification policies and CPU/memory/egress/storage review hints with evidence.
- Fixed future retry scheduling and provider backoff.
- Added local TLS/SSRF/redirect tests and keyboard-focused dialogs.
- Fixed mobile navigation after increasing interface text sizes.
- Fixed Railway root-owned volume startup by preparing the app directory then dropping privileges.
- Prepared pinned, public-only CI with real Docker/volume/restart verification. Not yet executed remotely.

## Initial local implementation
Usage adapter, private dashboard, budgets, forecast, history, encryption, REST, CSV and MCP. No marketplace release.
