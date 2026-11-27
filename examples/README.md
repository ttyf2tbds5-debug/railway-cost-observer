# Five integrations

Start the local app after setup and migration. Set COST_OBSERVER_URL=http://localhost:3000 and COST_OBSERVER_TOKEN to your generated VIEWER_TOKEN. Never put a real value in these tracked files.

1. Node backend: `node examples/node.mjs`. Expected: JSON with projects count and estimateOnly=true.
2. Python backend: `python examples/python.py`. Expected: the same summary; uses the standard library.
3. Next.js server: import getCostSummary from next-server.ts in a server route/component. Set server-only environment variables. Verify meta.estimateOnly=true. Do not import it in a client component.
4. Railway environment: `node examples/railway-health.mjs` with your deployment URL. Expected: status=ready. This makes no provision/deploy call and requires no Railway account API token.
5. MCP consumer: `node examples/mcp-client.mjs` from the project directory. Expected: a status tool response containing status=ready. Install project dependencies first so SDK and tsx resolve.

401: missing/wrong viewer token. 503: app setup or migration is incomplete. Connection failure: URL/port or server process is wrong. An empty project list is expected before connecting a workspace and syncing. These local examples do not prove a paid external API integration.
