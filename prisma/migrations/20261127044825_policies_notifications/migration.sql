-- CreateTable
CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alertId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "deliveredAt" DATETIME,
    "nextAttemptAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    CONSTRAINT "Delivery_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "Alert" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Connection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "lastSync" DATETIME,
    "lastError" TEXT,
    "nextSyncAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Connection" ("createdAt", "id", "lastError", "lastSync", "name", "token", "workspaceId") SELECT "createdAt", "id", "lastError", "lastSync", "name", "token", "workspaceId" FROM "Connection";
DROP TABLE "Connection";
ALTER TABLE "new_Connection" RENAME TO "Connection";
CREATE UNIQUE INDEX "Connection_workspaceId_key" ON "Connection"("workspaceId");
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "budget" REAL,
    "alertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "forecastAlerts" BOOLEAN NOT NULL DEFAULT true,
    "anomalyMultiplier" REAL NOT NULL DEFAULT 3,
    CONSTRAINT "Project_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "Connection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("budget", "connectionId", "id", "name") SELECT "budget", "connectionId", "id", "name" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_alertId_channel_key" ON "Delivery"("alertId", "channel");
