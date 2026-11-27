# Cost Observer release candidate — publication checks

This candidate implements the first product's core monitoring workflow. It is not yet marketplace-published. Do not mark an unrun deployment check successful.

## Completed implementation
- Multi-workspace Railway resource estimates, per-project history and CSV export.
- Billing-period forecasting, advisory budgets and configurable forecast/anomaly notification policies.
- Service-level CPU/memory/egress/storage review hints with the numerical evidence and explicit limitations.
- Durable per-channel JSON webhook, Discord, Telegram and SMTP delivery records, bounded retries and error visibility.
- Authentication, separate viewer API role, encrypted credentials, CSRF/origin checks and request throttles.
- Responsive English UI, dark/light mode, keyboard-trapped dialogs and policy editor.
- REST/OpenAPI, five integration examples and a read-only MCP bridge.
- Container root-volume initialization followed by dropping privileges to UID 1000; web and worker process supervision.

## Verified here
52 unit/integration/MCP/network tests and 5 real Chrome browser tests pass. Typecheck, lint and production build pass. Dependency audit reports zero known vulnerabilities. Notification TLS is tested against a local trusted certificate with controlled DNS/socket routing; SMTP and Telegram adapters are mocked, not sent to a real recipient. Exact Railway queries/parser were verified with existing CLI authentication, not by copying credentials into the application.

## Remaining publication gates
1. Completed: the owner authorized publication after the public GitHub + MIT recommendation on 2026-11-27. The active LICENSE is MIT.
2. Run the included GitHub verification job in an approved public repository (standard ubuntu-latest runner only). It performs the Linux Docker build, fresh volume startup, non-root process checks and persistence across restart. No local Docker/WSL runtime is installed. The workflow refuses private repositories and uses neither artifact/cache uploads nor paid/larger runners.
3. Review the actual CI result before creating a stable release or publishing the Marketplace listing. Fix any Linux-only failure; do not claim it passed because a script exists.
4. Before any real Railway deployment, apply the owner's separate zero-additional-cost approval gate. A template can be composed without starting a runtime; no paid demo service is required.

## Intentional scope and disclosure
No Railway stop/delete/scale mutation is implemented. Configurable automatic rules produce alerts only, and destructive actions are unavailable. Resource hints use period averages and do not prove safe downsizing. Prices are standard resource estimates, not invoices; credits, discounts, platform fees and taxes are excluded. One replica; no multi-tenant SaaS. There is no independent security certification or proven public discovery ranking. These limitations must remain visible in the listing.
