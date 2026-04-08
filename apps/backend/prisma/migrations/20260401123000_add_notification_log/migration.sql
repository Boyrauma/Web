CREATE TABLE "NotificationLog" (
  "id" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "recipient" TEXT,
  "message" TEXT,
  "errorMessage" TEXT,
  "bookingId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NotificationLog_channel_eventType_createdAt_idx"
ON "NotificationLog"("channel", "eventType", "createdAt");

CREATE INDEX "NotificationLog_bookingId_idx"
ON "NotificationLog"("bookingId");

ALTER TABLE "NotificationLog"
ADD CONSTRAINT "NotificationLog_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "BookingRequest"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
