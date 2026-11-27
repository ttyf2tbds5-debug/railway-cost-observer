# Agent integration

Use OpenAPI for REST. The local stdio MCP server bridges to your own deployment; it does not call an LLM or run on the maintainer's infrastructure. Set COST_OBSERVER_URL and COST_OBSERVER_TOKEN (prefer the viewer token), then run npm run mcp.

Tools: cost_observer_status, cost_observer_dashboard and cost_observer_audit. All are read-only. Status checks readiness, dashboard returns estimates/history/alerts, audit returns sanitized audit records. Transport negotiation is tested with the official MCP SDK. No HTTP MCP endpoint is implemented.

Example MCP host entry:
```json
{"mcpServers":{"cost-observer":{"command":"node","args":["--import","tsx","/absolute/path/to/project/src/mcp.ts"],"cwd":"/absolute/path/to/project","env":{"COST_OBSERVER_URL":"https://your-installation.example","COST_OBSERVER_TOKEN":"set-your-own-viewer-token"}}}}
```
Use the project directory as cwd so Node can resolve tsx. Never publish host configuration with a real token. Five runnable integration examples are in examples/. Examples require a local started app and your generated token; they do not use a paid API key.

llms.txt, llms-full.txt and capability-manifest.json are informational files, not promises of automatic AI discovery or selection.
