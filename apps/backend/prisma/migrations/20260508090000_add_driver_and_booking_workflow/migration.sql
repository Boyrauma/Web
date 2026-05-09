-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "note" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingStatusHistory" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "note" TEXT,
    "changedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingStatusHistory_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "BookingRequest"
ADD COLUMN "assignedDriverId" TEXT,
ADD COLUMN "assignedVehicleId" TEXT,
ADD COLUMN "cancelReason" TEXT,
ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "confirmedAt" TIMESTAMP(3),
ADD COLUMN "handledByAdminId" TEXT,
ADD COLUMN "internalNote" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Driver_phoneNumber_key" ON "Driver"("phoneNumber");

-- CreateIndex
CREATE INDEX "Driver_status_isActive_idx" ON "Driver"("status", "isActive");

-- CreateIndex
CREATE INDEX "BookingStatusHistory_bookingId_createdAt_idx" ON "BookingStatusHistory"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "BookingStatusHistory_changedByAdminId_createdAt_idx" ON "BookingStatusHistory"("changedByAdminId", "createdAt");

-- CreateIndex
CREATE INDEX "BookingRequest_status_createdAt_idx" ON "BookingRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "BookingRequest_assignedVehicleId_tripDate_idx" ON "BookingRequest"("assignedVehicleId", "tripDate");

-- CreateIndex
CREATE INDEX "BookingRequest_assignedDriverId_tripDate_idx" ON "BookingRequest"("assignedDriverId", "tripDate");

-- CreateIndex
CREATE INDEX "BookingRequest_handledByAdminId_idx" ON "BookingRequest"("handledByAdminId");

-- AddForeignKey
ALTER TABLE "BookingRequest"
ADD CONSTRAINT "BookingRequest_assignedVehicleId_fkey"
FOREIGN KEY ("assignedVehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequest"
ADD CONSTRAINT "BookingRequest_assignedDriverId_fkey"
FOREIGN KEY ("assignedDriverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequest"
ADD CONSTRAINT "BookingRequest_handledByAdminId_fkey"
FOREIGN KEY ("handledByAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingStatusHistory"
ADD CONSTRAINT "BookingStatusHistory_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "BookingRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingStatusHistory"
ADD CONSTRAINT "BookingStatusHistory_changedByAdminId_fkey"
FOREIGN KEY ("changedByAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
