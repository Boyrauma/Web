CREATE TABLE "TripExpense" (
  "id" TEXT NOT NULL,
  "tripId" TEXT,
  "bookingRequestId" TEXT,
  "vehicleId" TEXT,
  "title" TEXT NOT NULL,
  "expenseType" TEXT NOT NULL DEFAULT 'other',
  "amount" DOUBLE PRECISION NOT NULL,
  "expenseDate" TIMESTAMP(3),
  "paidBy" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TripExpense_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Reminder" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "reminderType" TEXT NOT NULL DEFAULT 'manual',
  "remindAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "targetType" TEXT,
  "targetId" TEXT,
  "uniqueKey" TEXT,
  "bookingRequestId" TEXT,
  "scheduleNoteId" TEXT,
  "tripId" TEXT,
  "vehicleId" TEXT,
  "driverId" TEXT,
  "note" TEXT,
  "sentAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TripExpense_expenseDate_expenseType_idx" ON "TripExpense"("expenseDate", "expenseType");
CREATE INDEX "TripExpense_tripId_idx" ON "TripExpense"("tripId");
CREATE INDEX "TripExpense_bookingRequestId_idx" ON "TripExpense"("bookingRequestId");
CREATE INDEX "TripExpense_vehicleId_expenseDate_idx" ON "TripExpense"("vehicleId", "expenseDate");

CREATE UNIQUE INDEX "Reminder_uniqueKey_key" ON "Reminder"("uniqueKey");
CREATE INDEX "Reminder_status_remindAt_idx" ON "Reminder"("status", "remindAt");
CREATE INDEX "Reminder_targetType_targetId_idx" ON "Reminder"("targetType", "targetId");
CREATE INDEX "Reminder_bookingRequestId_idx" ON "Reminder"("bookingRequestId");
CREATE INDEX "Reminder_scheduleNoteId_idx" ON "Reminder"("scheduleNoteId");
CREATE INDEX "Reminder_tripId_idx" ON "Reminder"("tripId");
CREATE INDEX "Reminder_vehicleId_idx" ON "Reminder"("vehicleId");
CREATE INDEX "Reminder_driverId_idx" ON "Reminder"("driverId");

ALTER TABLE "TripExpense"
ADD CONSTRAINT "TripExpense_tripId_fkey"
FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TripExpense"
ADD CONSTRAINT "TripExpense_bookingRequestId_fkey"
FOREIGN KEY ("bookingRequestId") REFERENCES "BookingRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TripExpense"
ADD CONSTRAINT "TripExpense_vehicleId_fkey"
FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Reminder"
ADD CONSTRAINT "Reminder_bookingRequestId_fkey"
FOREIGN KEY ("bookingRequestId") REFERENCES "BookingRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Reminder"
ADD CONSTRAINT "Reminder_scheduleNoteId_fkey"
FOREIGN KEY ("scheduleNoteId") REFERENCES "ScheduleNote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Reminder"
ADD CONSTRAINT "Reminder_tripId_fkey"
FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Reminder"
ADD CONSTRAINT "Reminder_vehicleId_fkey"
FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Reminder"
ADD CONSTRAINT "Reminder_driverId_fkey"
FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "AdminUser"
SET "permissions" = array_append("permissions", 'finance.manage')
WHERE "role" IN ('super_admin', 'operator', 'accountant')
  AND NOT ('finance.manage' = ANY("permissions"));

UPDATE "AdminUser"
SET "permissions" = array_append("permissions", 'reminders.manage')
WHERE "role" IN ('super_admin', 'operator')
  AND NOT ('reminders.manage' = ANY("permissions"));
