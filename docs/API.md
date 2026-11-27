# REST API

OpenAPI: /openapi.json. All versioned routes require Authorization: Bearer ADMIN_TOKEN or VIEWER_TOKEN, or an authenticated admin session. Viewer requests cannot write. Errors use {"error":{"code":"..."}}. Responses are no-store. Input JSON is limited to 16 KiB.

GET /api/v1/dashboard: connections without secrets, projects with the latest 96 snapshots each, latest 100 alerts, estimation metadata. GET /api/v1/export: last 10,000 snapshots as CSV with formula protection. GET /api/v1/audit: latest 100 local audit records.

POST /api/v1/connections: name, workspaceId UUID and user-owned token; saves encrypted credentials. POST /api/v1/connections/{id}/sync: fetch usage; at least 60 seconds between successful syncs. POST /api/v1/projects/{id}/budget: budget positive USD number or null. POST /api/v1/alerts/{id}/acknowledge: mark reviewed. DELETE /api/v1/connections/{id}: delete local connection and dependent history, never a Railway project.

GET /api/health is liveness; GET /api/ready checks secrets/origin configuration and database schema. Health endpoints expose no token or billing data. POST /api/auth accepts a token from a same-origin browser and sets an eight-hour session. DELETE /api/auth clears it.

POST /api/v1/projects/{id}/policy accepts alertsEnabled, forecastAlerts and anomalyMultiplier (1.5–20). It requires the admin role. Dashboard projects include evidence-backed insights; alerts include per-channel delivery status.
