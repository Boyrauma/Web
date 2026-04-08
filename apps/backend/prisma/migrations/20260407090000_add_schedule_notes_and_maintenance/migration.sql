CREATE TABLE "ScheduleNote" (
  "id" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "bookingRequestId" TEXT,
  "title" TEXT NOT NULL,
  "customerName" TEXT,
  "phoneNumber" TEXT,
  "tripDate" TIMESTAMP(3),
  "pickupLocation" TEXT,
  "dropoffLocation" TEXT,
  "status" TEXT NOT NULL DEFAULT 'scheduled',
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ScheduleNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VehicleMaintenance" (
  "id" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "maintenanceType" TEXT NOT NULL DEFAULT 'oil_change',
  "serviceDate" TIMESTAMP(3) NOT NULL,
  "nextServiceDate" TIMESTAMP(3),
  "odometerKm" INTEGER,
  "cost" DOUBLE PRECISION,
  "status" TEXT NOT NULL DEFAULT 'completed',
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VehicleMaintenance_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ScheduleNote_vehicleId_tripDate_idx"
ON "ScheduleNote"("vehicleId", "tripDate");

CREATE INDEX "ScheduleNote_bookingRequestId_idx"
ON "ScheduleNote"("bookingRequestId");

CREATE INDEX "VehicleMaintenance_vehicleId_serviceDate_idx"
ON "VehicleMaintenance"("vehicleId", "serviceDate");

CREATE INDEX "VehicleMaintenance_maintenanceType_status_idx"
ON "VehicleMaintenance"("maintenanceType", "status");

ALTER TABLE "ScheduleNote"
ADD CONSTRAINT "ScheduleNote_vehicleId_fkey"
FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ScheduleNote"
ADD CONSTRAINT "ScheduleNote_bookingRequestId_fkey"
FOREIGN KEY ("bookingRequestId") REFERENCES "BookingRequest"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VehicleMaintenance"
ADD CONSTRAINT "VehicleMaintenance_vehicleId_fkey"
FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
