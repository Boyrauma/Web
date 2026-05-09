CREATE TABLE "Customer" (
  "id" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "phoneNumber" TEXT NOT NULL,
  "phoneKey" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'regular',
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Customer_phoneKey_key" ON "Customer"("phoneKey");
CREATE INDEX "Customer_status_updatedAt_idx" ON "Customer"("status", "updatedAt");

UPDATE "AdminUser"
SET "permissions" = array_append("permissions", 'customers.manage')
WHERE "role" IN ('super_admin', 'operator')
  AND NOT ('customers.manage' = ANY("permissions"));
