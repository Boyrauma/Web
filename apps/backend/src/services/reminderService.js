import { prisma } from "../config/prisma.js";
import { sendReminderTelegramNotification } from "./telegramService.js";

const AUTO_REMINDER_LOOKAHEAD_DAYS = 14;
const AUTO_REMINDER_BEFORE_MS = 2 * 60 * 60 * 1000;
const REMINDER_PROCESS_LIMIT = 10;
const REMINDER_INTERVAL_MS = 60 * 1000;

export const reminderInclude = {
  bookingRequest: {
    include: {
      assignedVehicle: {
        select: {
          id: true,
          name: true
        }
      },
      assignedDriver: {
        select: {
          id: true,
          fullName: true,
          phoneNumber: true
        }
      }
    }
  },
  scheduleNote: {
    include: {
      vehicle: {
        select: {
          id: true,
          name: true
        }
      }
    }
  },
  trip: {
    include: {
      vehicle: {
        select: {
          id: true,
          name: true
        }
      },
      driver: {
        select: {
          id: true,
          fullName: true,
          phoneNumber: true
        }
      }
    }
  },
  vehicle: {
    select: {
      id: true,
      name: true
    }
  },
  driver: {
    select: {
      id: true,
      fullName: true,
      phoneNumber: true
    }
  }
};

function getReminderAt(tripDate) {
  const date = new Date(tripDate);
  const beforeTrip = new Date(date.getTime() - AUTO_REMINDER_BEFORE_MS);
  const soon = new Date(Date.now() + 30 * 1000);

  return beforeTrip > soon ? beforeTrip : soon;
}

function getRoute(pickupLocation, dropoffLocation) {
  return [pickupLocation || "Chưa có điểm đón", dropoffLocation || "Chưa có điểm trả"].join(" - ");
}

function buildBookingReminder(booking) {
  return {
    uniqueKey: `auto:booking:${booking.id}:upcoming`,
    title: `Nhắc chuyến của ${booking.customerName || "khách hàng"}`,
    reminderType: booking.assignedVehicleId && booking.assignedDriverId ? "trip_upcoming" : "assignment_missing",
    remindAt: getReminderAt(booking.tripDate),
    targetType: "booking",
    targetId: booking.id,
    bookingRequestId: booking.id,
    vehicleId: booking.assignedVehicleId ?? null,
    driverId: booking.assignedDriverId ?? null,
    note: `${getRoute(booking.pickupLocation, booking.dropoffLocation)}. ${
      booking.assignedVehicleId && booking.assignedDriverId
        ? "Kiểm tra lại trước giờ chạy."
        : "Booking này đang thiếu xe hoặc tài xế."
    }`
  };
}

function buildTripReminder(trip) {
  return {
    uniqueKey: `auto:trip:${trip.id}:upcoming`,
    title: `Nhắc chuyến ${trip.title || "đã chốt"}`,
    reminderType: trip.vehicleId && trip.driverId ? "trip_upcoming" : "assignment_missing",
    remindAt: getReminderAt(trip.tripDate),
    targetType: "trip",
    targetId: trip.id,
    tripId: trip.id,
    vehicleId: trip.vehicleId ?? null,
    driverId: trip.driverId ?? null,
    note: `${getRoute(trip.pickupLocation, trip.dropoffLocation)}. ${
      trip.vehicleId && trip.driverId ? "Kiểm tra lại lịch chạy." : "Chuyến này đang thiếu xe hoặc tài xế."
    }`
  };
}

function buildScheduleReminder(note) {
  return {
    uniqueKey: `auto:schedule:${note.id}:upcoming`,
    title: `Nhắc lịch xe ${note.title || note.customerName || ""}`.trim(),
    reminderType: "schedule_upcoming",
    remindAt: getReminderAt(note.tripDate),
    targetType: "schedule_note",
    targetId: note.id,
    scheduleNoteId: note.id,
    bookingRequestId: note.bookingRequestId ?? null,
    vehicleId: note.vehicleId ?? null,
    note: `${getRoute(note.pickupLocation, note.dropoffLocation)}. Kiểm tra lại lịch xe trước giờ chạy.`
  };
}

export async function ensureAutomaticReminders() {
  const now = new Date();
  const until = new Date(now.getTime() + AUTO_REMINDER_LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000);

  const [bookings, trips, scheduleNotes] = await Promise.all([
    prisma.bookingRequest.findMany({
      where: {
        tripDate: {
          gte: now,
          lte: until
        },
        status: {
          in: ["new", "called_back", "confirmed", "assigned", "scheduled"]
        }
      }
    }),
    prisma.trip.findMany({
      where: {
        tripDate: {
          gte: now,
          lte: until
        },
        status: {
          notIn: ["completed", "canceled"]
        }
      }
    }),
    prisma.scheduleNote.findMany({
      where: {
        tripDate: {
          gte: now,
          lte: until
        },
        status: "scheduled",
        archivedAt: null
      }
    })
  ]);

  const candidates = [
    ...bookings.map(buildBookingReminder),
    ...trips.map(buildTripReminder),
    ...scheduleNotes.map(buildScheduleReminder)
  ];

  if (!candidates.length) {
    return { createdCount: 0 };
  }

  const existing = await prisma.reminder.findMany({
    where: {
      uniqueKey: {
        in: candidates.map((item) => item.uniqueKey)
      }
    },
    select: {
      uniqueKey: true
    }
  });
  const existingKeys = new Set(existing.map((item) => item.uniqueKey));
  const missingCandidates = candidates.filter((item) => !existingKeys.has(item.uniqueKey));

  if (!missingCandidates.length) {
    return { createdCount: 0 };
  }

  await prisma.reminder.createMany({
    data: missingCandidates,
    skipDuplicates: true
  });

  return { createdCount: missingCandidates.length };
}

export async function processDueReminders() {
  await ensureAutomaticReminders();

  const reminders = await prisma.reminder.findMany({
    where: {
      status: "pending",
      remindAt: {
        lte: new Date()
      }
    },
    include: reminderInclude,
    orderBy: {
      remindAt: "asc"
    },
    take: REMINDER_PROCESS_LIMIT
  });

  let sentCount = 0;
  let failedCount = 0;

  for (const reminder of reminders) {
    try {
      await sendReminderTelegramNotification(reminder);
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          status: "sent",
          sentAt: new Date()
        }
      });
      sentCount += 1;
    } catch (error) {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          status: "failed",
          note: [reminder.note, `Lỗi gửi Telegram: ${error.message}`].filter(Boolean).join("\n")
        }
      });
      failedCount += 1;
    }
  }

  return { sentCount, failedCount };
}

export function startReminderScheduler() {
  let isRunning = false;

  const tick = async () => {
    if (isRunning) return;
    isRunning = true;

    try {
      await processDueReminders();
    } catch (error) {
      console.error("[reminder-scheduler]", error.message);
    } finally {
      isRunning = false;
    }
  };

  const intervalId = setInterval(() => {
    void tick();
  }, REMINDER_INTERVAL_MS);

  void tick();

  return () => clearInterval(intervalId);
}
