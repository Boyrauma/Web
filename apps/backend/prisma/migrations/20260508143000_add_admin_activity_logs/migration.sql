CREATE TABLE "AdminActivityLog" (
  "id" TEXT NOT NULL,
  "adminId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "entityLabel" TEXT,
  "description" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AdminActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminActivityLog_adminId_createdAt_idx" ON "AdminActivityLog"("adminId", "createdAt");
CREATE INDEX "AdminActivityLog_entityType_createdAt_idx" ON "AdminActivityLog"("entityType", "createdAt");
CREATE INDEX "AdminActivityLog_action_createdAt_idx" ON "AdminActivityLog"("action", "createdAt");

ALTER TABLE "AdminActivityLog"
ADD CONSTRAINT "AdminActivityLog_adminId_fkey"
FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
