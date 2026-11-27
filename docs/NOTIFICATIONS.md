# Notifications

All channels are optional and supplied by the deployer. The maintainer provides no shared keys or relay. An alert can go to several channels; each has its own durable attempt count. Successful channels are not retried when another fails. Five attempts maximum, exponential delays, no unbounded retries. After exhaustion, the Alerts page shows failure. Delivery is at least once: a remote success followed by a local database failure may produce a duplicate; generic receivers can deduplicate by alert id.

- JSON webhook: NOTIFY_WEBHOOK_URL and NOTIFY_FORMAT=json. Destination must be public IPv4 HTTPS on port 443; no redirects. DNS is validated and pinned for the request.
- Discord: DISCORD_WEBHOOK_URL, or legacy NOTIFY_FORMAT=discord with NOTIFY_WEBHOOK_URL. Mentions are disabled.
- Telegram: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID. The fixed official Bot API sendMessage endpoint is used, plain text only; the response must explicitly say ok=true. No paid broadcast option is enabled.
- Email: SMTP_HOST, SMTP_PORT=465 (TLS) or 587 (mandatory STARTTLS), SMTP_FROM, SMTP_TO, and optional paired SMTP_USER/SMTP_PASSWORD. Certificate verification is enabled; file/URL attachments are disabled. Use an existing user-owned provider and check its charges before enabling delivery. SMTP configuration is trusted installation-admin environment configuration, never arbitrary request data.

Incomplete SMTP/Telegram settings fail readiness. No messages are sent during the local automated suite: it uses fake adapters and a loopback TLS fixture. External delivery has not been claimed as verified. Sources: https://nodemailer.com/smtp and https://core.telegram.org/bots/api#sendmessage .

Turning off alerts in a project's Rules editor suppresses new alerts and pending delivery for that project; previously delivered messages are not recalled. Adding a channel does not resend historical events that were already fully delivered.
