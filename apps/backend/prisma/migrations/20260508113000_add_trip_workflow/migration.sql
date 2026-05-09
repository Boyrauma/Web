-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tripDate" TIMESTAMP(3),
    "pickupLocation" TEXT,
    "dropoffLocation" TEXT,
    "vehicleId" TEXT,
    "driverId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "BookingRequest"
ADD COLUMN "tripId" TEXT;

-- CreateIndex
CREATE INDEX "Trip_tripDate_status_idx" ON "Trip"("tripDate", "status");

-- CreateIndex
CREATE INDEX "Trip_vehicleId_tripDate_idx" ON "Trip"("vehicleId", "tripDate");

-- CreateIndex
CREATE INDEX "Trip_driverId_tripDate_idx" ON "Trip"("driverId", "tripDate");

-- CreateIndex
CREATE INDEX "BookingRequest_tripId_tripDate_idx" ON "BookingRequest"("tripId", "tripDate");

-- AddForeignKey
ALTER TABLE "Trip"
ADD CONSTRAINT "Trip_vehicleId_fkey"
FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip"
ADD CONSTRAINT "Trip_driverId_fkey"
FOREIGN KEY ("driverId") REFERENCES "Driver"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequest"
ADD CONSTRAINT "BookingRequest_tripId_fkey"
FOREIGN KEY ("tripId") REFERENCES "Trip"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
