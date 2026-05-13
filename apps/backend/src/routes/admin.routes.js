import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireAdminAuth, requireAdminPermission } from "../middlewares/authMiddleware.js";
import {
  optimizeStoredImageFile,
  removeUploadedFiles,
  uploadBrandLogo,
  uploadVehicleImages,
  validateStoredImageFile
} from "../middlewares/uploadMiddleware.js";
import { publishBookingEvent, subscribeBookingEvents } from "../services/bookingEvents.js";
import {
  ensureAutomaticReminders,
  processDueReminders,
  reminderInclude
} from "../services/reminderService.js";
import {
  fetchRecentTelegramLogs,
  sendBookingDeletedTelegramNotification,
  sendTelegramTestMessage
} from "../services/telegramService.js";
import { hashPassword } from "../utils/auth.js";
import { ALL_ADMIN_PERMISSIONS, resolveAdminPermissions } from "../utils/adminPermissions.js";
import { normalizePhoneKey } from "../utils/phone.js";
import { ensureDefaultSiteSettings } from "../utils/siteSettings.js";

const router = Router();

const bookingInclude = {
  trip: {
    select: {
      id: true,
      title: true,
      tripDate: true,
      status: true
    }
  },
  assignedVehicle: {
    select: {
      id: true,
      name: true,
      seatCount: true,
      category: {
        select: {
          id: true,
          name: true
        }
      }
    }
  },
  assignedDriver: {
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
      status: true
    }
  },
  handledByAdmin: {
    select: {
      id: true,
      fullName: true,
      email: true
    }
  },
  statusHistory: {
    include: {
      changedByAdmin: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  }
};

const tripInclude = {
  vehicle: {
    select: {
      id: true,
      name: true,
      seatCount: true,
      category: {
        select: {
          id: true,
          name: true
        }
      }
    }
  },
  driver: {
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
      status: true
    }
  },
  bookings: {
    include: bookingInclude,
    orderBy: [{ tripDate: "asc" }, { createdAt: "desc" }]
  }
};

const tripExpenseInclude = {
  trip: {
    select: {
      id: true,
      title: true,
      tripDate: true,
      status: true
    }
  },
  bookingRequest: {
    select: {
      id: true,
      customerName: true,
      phoneNumber: true,
      tripDate: true,
      pickupLocation: true,
      dropoffLocation: true,
      status: true
    }
  },
  vehicle: {
    select: {
      id: true,
      name: true,
      seatCount: true
    }
  }
};

const CUSTOMER_STATUSES = ["regular", "vip", "watchlist", "blocked"];
const ACTIVE_BOOKING_STATUSES = ["new", "called_back", "confirmed", "assigned", "scheduled"];
const BOOKING_SCHEDULE_STEP_STATUSES = new Set(["confirmed", "assigned", "scheduled"]);

const scheduleNoteInclude = {
  vehicle: {
    select: {
      id: true,
      name: true,
      seatCount: true
    }
  },
  bookingRequest: {
    select: {
      id: true,
      customerName: true,
      phoneNumber: true,
      tripDate: true,
      pickupLocation: true,
      dropoffLocation: true,
      status: true
    }
  }
};

const vehicleTripPaymentInclude = {
  vehicle: {
    select: {
      id: true,
      name: true,
      seatCount: true
    }
  },
  scheduleNote: {
    select: {
      id: true,
      title: true,
      customerName: true,
      phoneNumber: true,
      tripDate: true,
      pickupLocation: true,
      dropoffLocation: true,
      status: true,
      vehicleId: true,
      bookingRequestId: true
    }
  },
  bookingRequest: {
    select: {
      id: true,
      customerName: true,
      phoneNumber: true,
      createdAt: true,
      tripDate: true,
      pickupLocation: true,
      dropoffLocation: true,
      status: true,
      note: true
    }
  }
};

function getComparableDate(value) {
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function getLaterDate(left, right) {
  if (!left) return right ?? null;
  if (!right) return left ?? null;
  return getComparableDate(left) >= getComparableDate(right) ? left : right;
}

function createCustomerEntryFromProfile(profile) {
  return {
    id: profile.id,
    profileId: profile.id,
    fullName: profile.fullName,
    phoneNumber: profile.phoneNumber,
    phoneKey: profile.phoneKey,
    status: profile.status,
    note: profile.note ?? "",
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    bookingCount: 0,
    completedCount: 0,
    canceledCount: 0,
    activeBookingCount: 0,
    lastBookingAt: null,
    lastTripDate: null,
    latestRoute: "",
    latestBooking: null,
    bookings: []
  };
}

function createCustomerEntryFromBooking(booking, phoneKey) {
  return {
    id: `phone-${phoneKey}`,
    profileId: null,
    fullName: booking.customerName,
    phoneNumber: booking.phoneNumber,
    phoneKey,
    status: "regular",
    note: "",
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    bookingCount: 0,
    completedCount: 0,
    canceledCount: 0,
    activeBookingCount: 0,
    lastBookingAt: null,
    lastTripDate: null,
    latestRoute: "",
    latestBooking: null,
    bookings: []
  };
}

function applyBookingToCustomerEntry(entry, booking) {
  entry.bookingCount += 1;
  if (booking.status === "completed") entry.completedCount += 1;
  if (["canceled", "cancelled"].includes(booking.status)) entry.canceledCount += 1;
  if (ACTIVE_BOOKING_STATUSES.includes(booking.status)) entry.activeBookingCount += 1;

  entry.lastBookingAt = getLaterDate(entry.lastBookingAt, booking.createdAt);
  entry.lastTripDate = getLaterDate(entry.lastTripDate, booking.tripDate);

  const currentLatest = entry.latestBooking;
  if (!currentLatest || getComparableDate(booking.createdAt) > getComparableDate(currentLatest.createdAt)) {
    entry.latestBooking = booking;
    entry.latestRoute = [booking.pickupLocation, booking.dropoffLocation].filter(Boolean).join(" - ");
    if (!entry.profileId) {
      entry.fullName = booking.customerName || entry.fullName;
      entry.phoneNumber = booking.phoneNumber || entry.phoneNumber;
      entry.updatedAt = booking.updatedAt ?? booking.createdAt ?? entry.updatedAt;
    }
  }

  entry.bookings.push(booking);
}

async function buildCustomerSummaries() {
  const [profiles, bookings] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { updatedAt: "desc" }
    }),
    prisma.bookingRequest.findMany({
      include: bookingInclude,
      orderBy: [{ createdAt: "desc" }]
    })
  ]);

  const customersByPhone = new Map();

  for (const profile of profiles) {
    customersByPhone.set(profile.phoneKey, createCustomerEntryFromProfile(profile));
  }

  for (const booking of bookings) {
    const phoneKey = normalizePhoneKey(booking.phoneNumber);
    if (!phoneKey) continue;

    const currentEntry =
      customersByPhone.get(phoneKey) ?? createCustomerEntryFromBooking(booking, phoneKey);
    applyBookingToCustomerEntry(currentEntry, booking);
    customersByPhone.set(phoneKey, currentEntry);
  }

  return [...customersByPhone.values()]
    .map((customer) => ({
      ...customer,
      bookings: customer.bookings
        .sort(
          (left, right) =>
            getComparableDate(right.tripDate ?? right.createdAt) -
            getComparableDate(left.tripDate ?? left.createdAt)
        )
        .slice(0, 12)
    }))
    .sort(
      (left, right) =>
        getComparableDate(right.lastBookingAt ?? right.updatedAt) -
        getComparableDate(left.lastBookingAt ?? left.updatedAt)
    );
}

function buildBookingStatusPatch(currentBooking, nextStatus, payload = {}) {
  const update = {
    status: nextStatus,
    cancelReason:
      nextStatus === "canceled"
        ? payload.cancelReason ?? currentBooking.cancelReason ?? null
        : payload.cancelReason ?? null
  };

  if (nextStatus === "confirmed" && !currentBooking.confirmedAt) {
    update.confirmedAt = new Date();
  }

  if (nextStatus === "completed" && !currentBooking.completedAt) {
    update.completedAt = new Date();
  }

  return update;
}

function isBookingInScheduleStep(status) {
  return BOOKING_SCHEDULE_STEP_STATUSES.has(status);
}

function buildScheduleNoteDataFromBooking(booking) {
  if (!booking?.assignedVehicleId) return null;

  return {
    vehicleId: booking.assignedVehicleId,
    bookingRequestId: booking.id,
    title: booking.customerName?.trim()
      ? `Lịch xe - ${booking.customerName.trim()}`
      : "Lịch xe",
    customerName: booking.customerName ?? null,
    phoneNumber: booking.phoneNumber ?? null,
    tripDate: booking.tripDate ?? null,
    pickupLocation: booking.pickupLocation ?? null,
    dropoffLocation: booking.dropoffLocation ?? null,
    status: booking.status === "completed" ? "completed" : "scheduled",
    note: booking.internalNote ?? booking.note ?? null,
    archivedAt: null
  };
}

function buildPaymentDataFromBooking(booking) {
  if (!booking?.assignedVehicleId) return null;

  return {
    vehicleId: booking.assignedVehicleId,
    scheduleNoteId: null,
    bookingRequestId: booking.id,
    title: booking.customerName?.trim()
      ? `Tiền xe - ${booking.customerName.trim()}`
      : "Tiền xe",
    customerName: booking.customerName ?? null,
    phoneNumber: booking.phoneNumber ?? null,
    tripDate: booking.tripDate ?? null,
    pickupLocation: booking.pickupLocation ?? null,
    dropoffLocation: booking.dropoffLocation ?? null,
    paymentStatus: "unpaid",
    note: booking.internalNote ?? booking.note ?? null,
    archivedAt: null
  };
}

function buildPaymentDataFromScheduleNote(note) {
  if (!note?.vehicleId) return null;

  return {
    vehicleId: note.vehicleId,
    scheduleNoteId: note.id,
    bookingRequestId: note.bookingRequestId ?? null,
    title: note.title?.trim() ? `Tiền xe - ${note.title.trim()}` : "Tiền xe",
    customerName: note.customerName ?? note.bookingRequest?.customerName ?? null,
    phoneNumber: note.phoneNumber ?? note.bookingRequest?.phoneNumber ?? null,
    tripDate: note.tripDate ?? note.bookingRequest?.tripDate ?? null,
    pickupLocation: note.pickupLocation ?? note.bookingRequest?.pickupLocation ?? null,
    dropoffLocation: note.dropoffLocation ?? note.bookingRequest?.dropoffLocation ?? null,
    paymentStatus: "unpaid",
    note: note.note ?? null,
    archivedAt: null
  };
}

async function findPaymentDraft(tx, { scheduleNoteId, bookingRequestId }) {
  if (scheduleNoteId) {
    const bySchedule = await tx.vehicleTripPayment.findUnique({
      where: { scheduleNoteId }
    });
    if (bySchedule) return bySchedule;
  }

  if (bookingRequestId) {
    return tx.vehicleTripPayment.findUnique({
      where: { bookingRequestId }
    });
  }

  return null;
}

async function upsertPaymentDraft(tx, sourceData) {
  if (!sourceData?.vehicleId) return null;

  const existingPayment = await findPaymentDraft(tx, sourceData);

  if (existingPayment) {
    if (existingPayment.paymentStatus === "paid" || existingPayment.archivedAt) {
      return existingPayment;
    }

    return tx.vehicleTripPayment.update({
      where: { id: existingPayment.id },
      data: {
        vehicleId: sourceData.vehicleId,
        scheduleNoteId: existingPayment.scheduleNoteId ?? sourceData.scheduleNoteId ?? null,
        bookingRequestId: existingPayment.bookingRequestId ?? sourceData.bookingRequestId ?? null,
        title: sourceData.title,
        customerName: sourceData.customerName,
        phoneNumber: sourceData.phoneNumber,
        tripDate: sourceData.tripDate,
        pickupLocation: sourceData.pickupLocation,
        dropoffLocation: sourceData.dropoffLocation,
        archivedAt: null
      }
    });
  }

  return tx.vehicleTripPayment.create({
    data: sourceData
  });
}

async function upsertScheduleNoteFromBooking(tx, booking) {
  const scheduleData = buildScheduleNoteDataFromBooking(booking);
  if (!scheduleData) return null;

  const existingNote = await tx.scheduleNote.findFirst({
    where: {
      bookingRequestId: booking.id,
      archivedAt: null
    },
    orderBy: { createdAt: "desc" }
  });

  if (existingNote) {
    return tx.scheduleNote.update({
      where: { id: existingNote.id },
      data: scheduleData,
      include: scheduleNoteInclude
    });
  }

  return tx.scheduleNote.create({
    data: scheduleData,
    include: scheduleNoteInclude
  });
}

async function ensureWorkflowForBooking(tx, booking) {
  if (isBookingInScheduleStep(booking.status)) {
    await upsertScheduleNoteFromBooking(tx, booking);
    return;
  }

  if (booking.status !== "completed") return;

  const linkedNote = await upsertScheduleNoteFromBooking(tx, booking);
  if (linkedNote) {
    await upsertPaymentDraft(tx, buildPaymentDataFromScheduleNote(linkedNote));
    return;
  }

  await upsertPaymentDraft(tx, buildPaymentDataFromBooking(booking));
}

async function ensureWorkflowForScheduleNote(tx, note) {
  if (note.status !== "completed") return;

  await upsertPaymentDraft(tx, buildPaymentDataFromScheduleNote(note));
}

function mapTripStatusToBookingStatus(tripStatus, hasAssignments) {
  if (tripStatus === "completed") return "completed";
  if (tripStatus === "canceled") return "canceled";
  if (tripStatus === "confirmed") return hasAssignments ? "assigned" : "confirmed";
  if (tripStatus === "in_progress") return "assigned";
  return null;
}

async function syncBookingsForTrip(tx, {
  bookingIds,
  tripId,
  vehicleId,
  driverId,
  tripStatus,
  note,
  changedByAdminId
}) {
  if (!bookingIds?.length) {
    return;
  }

  const currentBookings = await tx.bookingRequest.findMany({
    where: {
      id: {
        in: bookingIds
      }
    }
  });

  for (const booking of currentBookings) {
    const hasAssignments = Boolean(vehicleId || driverId || booking.assignedVehicleId || booking.assignedDriverId);
    const nextStatus = mapTripStatusToBookingStatus(tripStatus, hasAssignments) ?? booking.status;
    const statusPatch =
      nextStatus !== booking.status
        ? buildBookingStatusPatch(booking, nextStatus, {
            note,
            cancelReason: tripStatus === "canceled" ? note : null
          })
        : {};

    await tx.bookingRequest.update({
      where: { id: booking.id },
      data: {
        tripId,
        assignedVehicleId: vehicleId ?? booking.assignedVehicleId ?? null,
        assignedDriverId: driverId ?? booking.assignedDriverId ?? null,
        handledByAdminId: changedByAdminId ?? null,
        ...statusPatch
      }
    });

    if (nextStatus !== booking.status) {
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          fromStatus: booking.status,
          toStatus: nextStatus,
          note: note ?? null,
          changedByAdminId: changedByAdminId ?? null
        }
      });
    }
  }
}

async function createAdminActivityLog(tx, {
  adminId,
  action,
  entityType,
  entityId,
  entityLabel,
  description,
  metadata
}) {
  return tx.adminActivityLog.create({
    data: {
      adminId: adminId ?? null,
      action,
      entityType,
      entityId: entityId ?? null,
      entityLabel: entityLabel ?? null,
      description: description ?? null,
      metadata: metadata ?? undefined
    }
  });
}

function buildOptimizedCandidatePath(filePath = "") {
  return filePath.replace(/\.[^.]+$/, ".webp");
}

router.get("/booking-events", requireAdminAuth, (request, response) => {
  response.setHeader("Content-Type", "text/event-stream");
  response.setHeader("Cache-Control", "no-cache, no-transform");
  response.setHeader("Connection", "keep-alive");
  response.setHeader("X-Accel-Buffering", "no");
  response.setHeader("Content-Encoding", "identity");
  request.socket?.setTimeout?.(0);
  request.socket?.setNoDelay?.(true);
  response.flushHeaders?.();

  const unsubscribe = subscribeBookingEvents(response);
  const heartbeat = setInterval(() => {
    response.write(`: heartbeat\n\n`);
  }, 25000);

  request.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

router.use(requireAdminAuth);

router.post("/notifications/telegram/test", requireAdminPermission("notifications.manage"), async (request, response) => {
  try {
    const result = await sendTelegramTestMessage();

    return response.json({
      message:
        result.recipientCount > 1
          ? `Đã gửi tin nhắn test Telegram tới ${result.sentCount}/${result.recipientCount} chat${
              result.failedRecipients?.length ? `, lỗi ${result.failedRecipients.length} chat` : ""
            }.`
          : "Đã gửi tin nhắn test Telegram."
    });
  } catch (error) {
    return response.status(400).json({
      message: error?.message ?? "Không thể gửi test Telegram."
    });
  }
});

router.get("/notifications/logs", requireAdminPermission("notifications.manage"), async (request, response) => {
  const eventType =
    typeof request.query.eventType === "string" ? request.query.eventType : undefined;
  const status = typeof request.query.status === "string" ? request.query.status : undefined;
  const limit = Number(request.query.limit ?? 30);

  const logs = await fetchRecentTelegramLogs({
    eventType,
    status,
    limit
  });

  return response.json(logs);
});

router.get("/activity-logs", requireAdminPermission("activity_logs.view"), async (request, response) => {
  const entityType =
    typeof request.query.entityType === "string" && request.query.entityType !== "all"
      ? request.query.entityType
      : undefined;
  const action =
    typeof request.query.action === "string" && request.query.action !== "all"
      ? request.query.action
      : undefined;
  const limit = Math.min(Number(request.query.limit ?? 100) || 100, 300);

  const logs = await prisma.adminActivityLog.findMany({
    where: {
      ...(entityType ? { entityType } : {}),
      ...(action ? { action } : {})
    },
    include: {
      admin: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: limit
  });

  return response.json(logs);
});

router.get("/admin-users", requireAdminPermission("admin_users.manage"), async (request, response) => {
  const users = await prisma.adminUser.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      permissions: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: [{ role: "asc" }, { fullName: "asc" }]
  });

  return response.json(
    users.map((user) => ({
      ...user,
      permissions: resolveAdminPermissions(user.role, user.permissions)
    }))
  );
});

router.post("/admin-users", requireAdminPermission("admin_users.manage"), async (request, response) => {
  const parsed = adminUserCreateSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Dữ liệu tài khoản admin không hợp lệ.",
      errors: parsed.error.flatten()
    });
  }

  const existingUser = await prisma.adminUser.findUnique({
    where: {
      email: parsed.data.email.trim().toLowerCase()
    },
    select: {
      id: true
    }
  });

  if (existingUser) {
    return response.status(400).json({
      message: "Email này đã tồn tại."
    });
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const adminUser = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.adminUser.create({
      data: {
        email: parsed.data.email.trim().toLowerCase(),
        fullName: parsed.data.fullName.trim(),
        role: parsed.data.role,
        permissions: resolveAdminPermissions(parsed.data.role, parsed.data.permissions),
        isActive: parsed.data.isActive ?? true,
        passwordHash
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    await createAdminActivityLog(tx, {
      adminId: request.admin?.sub,
      action: "create",
      entityType: "admin_user",
      entityId: createdUser.id,
      entityLabel: createdUser.fullName,
      description: "Tạo tài khoản admin",
      metadata: {
        email: createdUser.email,
        role: createdUser.role,
        permissions: createdUser.permissions,
        isActive: createdUser.isActive
      }
    });

    return createdUser;
  });

  return response.status(201).json({
    ...adminUser,
    permissions: resolveAdminPermissions(adminUser.role, adminUser.permissions)
  });
});

router.patch("/admin-users/:id", requireAdminPermission("admin_users.manage"), async (request, response) => {
  const parsed = adminUserUpdateSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Dữ liệu cập nhật tài khoản admin không hợp lệ.",
      errors: parsed.error.flatten()
    });
  }

  const currentUser = await prisma.adminUser.findUnique({
    where: { id: request.params.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      permissions: true,
      isActive: true
    }
  });

  if (!currentUser) {
    return response.status(404).json({
      message: "Không tìm thấy tài khoản admin."
    });
  }

  const normalizedEmail = parsed.data.email.trim().toLowerCase();
  const duplicateEmail = await prisma.adminUser.findFirst({
    where: {
      email: normalizedEmail,
      id: {
        not: request.params.id
      }
    },
    select: {
      id: true
    }
  });

  if (duplicateEmail) {
    return response.status(400).json({
      message: "Email này đã tồn tại."
    });
  }

  if (request.admin?.sub === currentUser.id) {
    if (parsed.data.role !== currentUser.role) {
      return response.status(400).json({
        message: "Bạn không thể tự đổi vai trò của chính mình."
      });
    }

    const currentPermissions = resolveAdminPermissions(currentUser.role, currentUser.permissions).slice().sort().join("|");
    const nextPermissions = resolveAdminPermissions(parsed.data.role, parsed.data.permissions).slice().sort().join("|");

    if (currentPermissions !== nextPermissions) {
      return response.status(400).json({
        message: "Bạn không thể tự thay đổi quyền của chính mình."
      });
    }

    if ((parsed.data.isActive ?? true) === false) {
      return response.status(400).json({
        message: "Bạn không thể tự khóa tài khoản của chính mình."
      });
    }
  }

  const passwordHash = parsed.data.password ? await hashPassword(parsed.data.password) : null;

  const adminUser = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.adminUser.update({
      where: { id: request.params.id },
      data: {
        email: normalizedEmail,
        fullName: parsed.data.fullName.trim(),
        role: parsed.data.role,
        permissions: resolveAdminPermissions(parsed.data.role, parsed.data.permissions),
        isActive: parsed.data.isActive ?? true,
        ...(passwordHash ? { passwordHash } : {})
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    await createAdminActivityLog(tx, {
      adminId: request.admin?.sub,
      action: "update",
      entityType: "admin_user",
      entityId: updatedUser.id,
      entityLabel: updatedUser.fullName,
      description: "Cập nhật tài khoản admin",
      metadata: {
        email: updatedUser.email,
        role: updatedUser.role,
        permissions: updatedUser.permissions,
        isActive: updatedUser.isActive,
        passwordChanged: Boolean(passwordHash)
      }
    });

    return updatedUser;
  });

  return response.json({
    ...adminUser,
    permissions: resolveAdminPermissions(adminUser.role, adminUser.permissions)
  });
});

router.delete("/admin-users/:id", requireAdminPermission("admin_users.manage"), async (request, response) => {
  const currentUser = await prisma.adminUser.findUnique({
    where: { id: request.params.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      permissions: true
    }
  });

  if (!currentUser) {
    return response.status(404).json({
      message: "Không tìm thấy tài khoản admin."
    });
  }

  if (request.admin?.sub === currentUser.id) {
    return response.status(400).json({
      message: "Bạn không thể tự xóa tài khoản của chính mình."
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.adminUser.delete({
      where: { id: request.params.id }
    });

    await createAdminActivityLog(tx, {
      adminId: request.admin?.sub,
      action: "delete",
      entityType: "admin_user",
      entityId: currentUser.id,
      entityLabel: currentUser.fullName,
      description: "Xóa tài khoản admin",
      metadata: {
        email: currentUser.email,
        role: currentUser.role,
        permissions: currentUser.permissions
      }
    });
  });

  return response.status(204).send();
});

router.get("/dashboard", requireAdminPermission("dashboard.view"), async (request, response) => {
  const [bookingCount, vehicleCount, serviceCount, driverCount, pendingBookingCount, tripCount] = await Promise.all([
    prisma.bookingRequest.count(),
    prisma.vehicle.count(),
    prisma.service.count(),
    prisma.driver.count({
      where: {
        isActive: true
      }
    }),
    prisma.bookingRequest.count({
      where: {
        status: {
          in: ["new", "called_back", "confirmed"]
        }
      }
    }),
    prisma.trip.count()
  ]);

  return response.json({
    bookingCount,
    vehicleCount,
    serviceCount,
    driverCount,
    pendingBookingCount,
    tripCount
  });
});

router.get("/booking-requests", requireAdminPermission("bookings.manage"), async (request, response) => {
  const bookings = await prisma.bookingRequest.findMany({
    include: bookingInclude,
    orderBy: { createdAt: "desc" }
  });

  return response.json(bookings);
});

router.delete("/booking-requests/:id", requireAdminPermission("bookings.manage"), async (request, response) => {
  const booking = await prisma.$transaction(async (tx) => {
    const deletedBooking = await tx.bookingRequest.delete({
      where: { id: request.params.id }
    });

    await createAdminActivityLog(tx, {
      adminId: request.admin?.sub,
      action: "delete",
      entityType: "booking",
      entityId: deletedBooking.id,
      entityLabel: deletedBooking.customerName,
      description: "Xóa booking",
      metadata: {
        phoneNumber: deletedBooking.phoneNumber,
        pickupLocation: deletedBooking.pickupLocation,
        dropoffLocation: deletedBooking.dropoffLocation
      }
    });

    return deletedBooking;
  });

  publishBookingEvent("booking.deleted", booking);
  void sendBookingDeletedTelegramNotification(booking).catch((error) => {
    console.error("[telegram][booking.deleted]", error.message);
  });

  return response.status(204).send();
});

router.get("/customers", requireAdminPermission("customers.manage"), async (request, response) => {
  const customers = await buildCustomerSummaries();
  return response.json(customers);
});

router.post("/customers", requireAdminPermission("customers.manage"), async (request, response) => {
  const parsed = customerSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Thông tin khách hàng không hợp lệ.",
      errors: parsed.error.flatten()
    });
  }

  const phoneNumber = parsed.data.phoneNumber.trim();
  const phoneKey = normalizePhoneKey(phoneNumber);

  if (!phoneKey) {
    return response.status(400).json({ message: "Số điện thoại khách hàng không hợp lệ." });
  }

  const existingCustomer = await prisma.customer.findUnique({
    where: { phoneKey }
  });

  const customer = await prisma.$transaction(async (tx) => {
    const savedCustomer = await tx.customer.upsert({
      where: { phoneKey },
      update: {
        fullName: parsed.data.fullName.trim(),
        phoneNumber,
        status: parsed.data.status ?? "regular",
        note: parsed.data.note ?? null
      },
      create: {
        fullName: parsed.data.fullName.trim(),
        phoneNumber,
        phoneKey,
        status: parsed.data.status ?? "regular",
        note: parsed.data.note ?? null
      }
    });

    await createAdminActivityLog(tx, {
      adminId: request.admin?.sub,
      action: existingCustomer ? "update" : "create",
      entityType: "customer",
      entityId: savedCustomer.id,
      entityLabel: savedCustomer.fullName,
      description: existingCustomer ? "Cập nhật hồ sơ khách hàng" : "Tạo hồ sơ khách hàng",
      metadata: {
        phoneNumber: savedCustomer.phoneNumber,
        status: savedCustomer.status
      }
    });

    return savedCustomer;
  });

  return response.status(existingCustomer ? 200 : 201).json(customer);
});

router.patch("/customers/:id", requireAdminPermission("customers.manage"), async (request, response) => {
  const parsed = customerSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Thông tin khách hàng không hợp lệ.",
      errors: parsed.error.flatten()
    });
  }

  const currentCustomer = await prisma.customer.findUnique({
    where: { id: request.params.id }
  });

  if (!currentCustomer) {
    return response.status(404).json({ message: "Khách hàng không tồn tại." });
  }

  const phoneNumber = parsed.data.phoneNumber.trim();
  const phoneKey = normalizePhoneKey(phoneNumber);

  if (!phoneKey) {
    return response.status(400).json({ message: "Số điện thoại khách hàng không hợp lệ." });
  }

  const duplicatedCustomer = await prisma.customer.findUnique({
    where: { phoneKey }
  });

  if (duplicatedCustomer && duplicatedCustomer.id !== currentCustomer.id) {
    return response.status(409).json({
      message: "Số điện thoại này đã có hồ sơ khách hàng khác."
    });
  }

  const customer = await prisma.$transaction(async (tx) => {
    const updatedCustomer = await tx.customer.update({
      where: { id: currentCustomer.id },
      data: {
        fullName: parsed.data.fullName.trim(),
        phoneNumber,
        phoneKey,
        status: parsed.data.status ?? "regular",
        note: parsed.data.note ?? null
      }
    });

    await createAdminActivityLog(tx, {
      adminId: request.admin?.sub,
      action: "update",
      entityType: "customer",
      entityId: updatedCustomer.id,
      entityLabel: updatedCustomer.fullName,
      description: "Cập nhật hồ sơ khách hàng",
      metadata: {
        phoneNumber: updatedCustomer.phoneNumber,
        status: updatedCustomer.status
      }
    });

    return updatedCustomer;
  });

  return response.json(customer);
});

router.delete("/customers/:id", requireAdminPermission("customers.manage"), async (request, response) => {
  const currentCustomer = await prisma.customer.findUnique({
    where: { id: request.params.id }
  });

  if (!currentCustomer) {
    return response.status(404).json({ message: "Khách hàng không tồn tại." });
  }

  await prisma.$transaction(async (tx) => {
    await tx.customer.delete({
      where: { id: currentCustomer.id }
    });

    await createAdminActivityLog(tx, {
      adminId: request.admin?.sub,
      action: "delete",
      entityType: "customer",
      entityId: currentCustomer.id,
      entityLabel: currentCustomer.fullName,
      description: "Xóa hồ sơ khách hàng",
      metadata: {
        phoneNumber: currentCustomer.phoneNumber,
        status: currentCustomer.status
      }
    });
  });

  return response.status(204).send();
});

router.get("/schedule-notes", requireAdminPermission("schedule_notes.manage"), async (request, response) => {
  const scope = request.query.scope === "archived" ? "archived" : request.query.scope === "all" ? "all" : "active";
  const where =
    scope === "archived"
      ? { archivedAt: { not: null } }
      : scope === "all"
        ? {}
        : { archivedAt: null };

  const notes = await prisma.scheduleNote.findMany({
    where,
    include: scheduleNoteInclude,
    orderBy: [{ tripDate: "asc" }, { createdAt: "desc" }]
  });

  return response.json(notes);
});

router.post("/schedule-notes", requireAdminPermission("schedule_notes.manage"), async (request, response) => {
  const parsed = scheduleNoteSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Invalid schedule note payload",
      errors: parsed.error.flatten()
    });
  }

  const note = await prisma.$transaction(async (tx) => {
    const createdNote = await tx.scheduleNote.create({
      data: {
        vehicleId: parsed.data.vehicleId,
        bookingRequestId: parsed.data.bookingRequestId || null,
        title: parsed.data.title?.trim() || "Ghi chú lịch xe",
        customerName: parsed.data.customerName ?? null,
        phoneNumber: parsed.data.phoneNumber ?? null,
        tripDate: parsed.data.tripDate ?? null,
        pickupLocation: parsed.data.pickupLocation ?? null,
        dropoffLocation: parsed.data.dropoffLocation ?? null,
        status: parsed.data.status ?? "scheduled",
        note: parsed.data.note ?? null
      },
      include: scheduleNoteInclude
    });

    await ensureWorkflowForScheduleNote(tx, createdNote);

    return createdNote;
  });

  return response.status(201).json(note);
});

router.patch("/schedule-notes/:id", requireAdminPermission("schedule_notes.manage"), async (request, response) => {
  const parsed = scheduleNoteSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Invalid schedule note payload",
      errors: parsed.error.flatten()
    });
  }

  const note = await prisma.$transaction(async (tx) => {
    const updatedNote = await tx.scheduleNote.update({
      where: { id: request.params.id },
      data: {
        vehicleId: parsed.data.vehicleId,
        bookingRequestId: parsed.data.bookingRequestId || null,
        title: parsed.data.title?.trim() || "Ghi chú lịch xe",
        customerName: parsed.data.customerName ?? null,
        phoneNumber: parsed.data.phoneNumber ?? null,
        tripDate: parsed.data.tripDate ?? null,
        pickupLocation: parsed.data.pickupLocation ?? null,
        dropoffLocation: parsed.data.dropoffLocation ?? null,
        status: parsed.data.status ?? "scheduled",
        note: parsed.data.note ?? null
      },
      include: scheduleNoteInclude
    });

    await ensureWorkflowForScheduleNote(tx, updatedNote);

    return updatedNote;
  });

  return response.json(note);
});

router.delete("/schedule-notes/:id", requireAdminPermission("schedule_notes.manage"), async (request, response) => {
  await prisma.scheduleNote.update({
    where: { id: request.params.id },
    data: {
      archivedAt: new Date()
    }
  });

  return response.status(204).send();
});

router.post("/schedule-notes/:id/restore", requireAdminPermission("schedule_notes.manage"), async (request, response) => {
  const note = await prisma.scheduleNote.update({
    where: { id: request.params.id },
    data: {
      archivedAt: null
    },
    include: scheduleNoteInclude
  });

  return response.json(note);
});

router.get("/vehicle-trip-payments", requireAdminPermission("payments.manage"), async (request, response) => {
  const scope = request.query.scope === "archived" ? "archived" : request.query.scope === "all" ? "all" : "active";
  const where =
    scope === "archived"
      ? { archivedAt: { not: null } }
      : scope === "all"
        ? {}
        : { archivedAt: null };

  const payments = await prisma.vehicleTripPayment.findMany({
    where,
    include: vehicleTripPaymentInclude,
    orderBy: [{ tripDate: "asc" }, { createdAt: "desc" }]
  });

  return response.json(payments);
});

router.post("/vehicle-trip-payments", requireAdminPermission("payments.manage"), async (request, response) => {
  const parsed = vehicleTripPaymentSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Invalid vehicle trip payment payload",
      errors: parsed.error.flatten()
    });
  }

  const payment = await prisma.vehicleTripPayment.create({
    data: {
      vehicleId: parsed.data.vehicleId,
      scheduleNoteId: parsed.data.scheduleNoteId || null,
      bookingRequestId: parsed.data.bookingRequestId || null,
      title: parsed.data.title?.trim() || "Tiền xe",
      customerName: parsed.data.customerName ?? null,
      phoneNumber: parsed.data.phoneNumber ?? null,
      tripDate: parsed.data.tripDate ?? null,
      pickupLocation: parsed.data.pickupLocation ?? null,
      dropoffLocation: parsed.data.dropoffLocation ?? null,
      amount: parsed.data.amount ?? null,
      paymentStatus: parsed.data.paymentStatus ?? "unpaid",
      collectedAt:
        (parsed.data.paymentStatus ?? "unpaid") === "paid"
          ? parsed.data.collectedAt ?? new Date()
          : parsed.data.collectedAt ?? null,
      note: parsed.data.note ?? null
    },
    include: vehicleTripPaymentInclude
  });

  return response.status(201).json(payment);
});

router.patch("/vehicle-trip-payments/:id", requireAdminPermission("payments.manage"), async (request, response) => {
  const parsed = vehicleTripPaymentSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Invalid vehicle trip payment payload",
      errors: parsed.error.flatten()
    });
  }

  const payment = await prisma.vehicleTripPayment.update({
    where: { id: request.params.id },
    data: {
      vehicleId: parsed.data.vehicleId,
      scheduleNoteId: parsed.data.scheduleNoteId || null,
      bookingRequestId: parsed.data.bookingRequestId || null,
      title: parsed.data.title?.trim() || "Tiền xe",
      customerName: parsed.data.customerName ?? null,
      phoneNumber: parsed.data.phoneNumber ?? null,
      tripDate: parsed.data.tripDate ?? null,
      pickupLocation: parsed.data.pickupLocation ?? null,
      dropoffLocation: parsed.data.dropoffLocation ?? null,
      amount: parsed.data.amount ?? null,
      paymentStatus: parsed.data.paymentStatus ?? "unpaid",
      collectedAt:
        (parsed.data.paymentStatus ?? "unpaid") === "paid"
          ? parsed.data.collectedAt ?? new Date()
          : parsed.data.collectedAt ?? null,
      note: parsed.data.note ?? null
    },
    include: vehicleTripPaymentInclude
  });

  return response.json(payment);
});

router.delete("/vehicle-trip-payments/:id", requireAdminPermission("payments.manage"), async (request, response) => {
  await prisma.vehicleTripPayment.update({
    where: { id: request.params.id },
    data: {
      archivedAt: new Date()
    }
  });

  return response.status(204).send();
});

router.post("/vehicle-trip-payments/:id/restore", requireAdminPermission("payments.manage"), async (request, response) => {
  const payment = await prisma.vehicleTripPayment.update({
    where: { id: request.params.id },
    data: {
      archivedAt: null
    },
    include: vehicleTripPaymentInclude
  });

  return response.json(payment);
});

router.get("/trip-expenses", requireAdminPermission("finance.manage"), async (request, response) => {
  const expenses = await prisma.tripExpense.findMany({
    include: tripExpenseInclude,
    orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }]
  });

  return response.json(expenses);
});

router.post("/trip-expenses", requireAdminPermission("finance.manage"), async (request, response) => {
  const parsed = tripExpenseSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Thông tin chi phí không hợp lệ.",
      errors: parsed.error.flatten()
    });
  }

  const expense = await prisma.$transaction(async (tx) => {
    const savedExpense = await tx.tripExpense.create({
      data: {
        tripId: parsed.data.tripId ?? null,
        bookingRequestId: parsed.data.bookingRequestId ?? null,
        vehicleId: parsed.data.vehicleId ?? null,
        title: parsed.data.title?.trim() || "Chi phí chuyến đi",
        expenseType: parsed.data.expenseType ?? "other",
        amount: Number(parsed.data.amount || 0),
        expenseDate: parsed.data.expenseDate ?? new Date(),
        paidBy: parsed.data.paidBy ?? null,
        note: parsed.data.note ?? null
      },
      include: tripExpenseInclude
    });

    await createAdminActivityLog(tx, {
      adminId: request.admin?.sub,
      action: "create",
      entityType: "trip_expense",
      entityId: savedExpense.id,
      entityLabel: savedExpense.title,
      description: "Tạo chi phí chuyến đi",
      metadata: {
        amount: savedExpense.amount,
        expenseType: savedExpense.expenseType,
        vehicleId: savedExpense.vehicleId,
        tripId: savedExpense.tripId
      }
    });

    return savedExpense;
  });

  return response.status(201).json(expense);
});

router.patch("/trip-expenses/:id", requireAdminPermission("finance.manage"), async (request, response) => {
  const parsed = tripExpenseSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Thông tin chi phí không hợp lệ.",
      errors: parsed.error.flatten()
    });
  }

  const expense = await prisma.$transaction(async (tx) => {
    const savedExpense = await tx.tripExpense.update({
      where: { id: request.params.id },
      data: {
        tripId: parsed.data.tripId ?? null,
        bookingRequestId: parsed.data.bookingRequestId ?? null,
        vehicleId: parsed.data.vehicleId ?? null,
        title: parsed.data.title?.trim() || "Chi phí chuyến đi",
        expenseType: parsed.data.expenseType ?? "other",
        amount: Number(parsed.data.amount || 0),
        expenseDate: parsed.data.expenseDate ?? new Date(),
        paidBy: parsed.data.paidBy ?? null,
        note: parsed.data.note ?? null
      },
      include: tripExpenseInclude
    });

    await createAdminActivityLog(tx, {
      adminId: request.admin?.sub,
      action: "update",
      entityType: "trip_expense",
      entityId: savedExpense.id,
      entityLabel: savedExpense.title,
      description: "Cập nhật chi phí chuyến đi",
      metadata: {
        amount: savedExpense.amount,
        expenseType: savedExpense.expenseType
      }
    });

    return savedExpense;
  });

  return response.json(expense);
});

router.delete("/trip-expenses/:id", requireAdminPermission("finance.manage"), async (request, response) => {
  const currentExpense = await prisma.tripExpense.findUnique({
    where: { id: request.params.id }
  });

  if (!currentExpense) {
    return response.status(404).json({ message: "Chi phí không tồn tại." });
  }

  await prisma.$transaction(async (tx) => {
    await tx.tripExpense.delete({
      where: { id: currentExpense.id }
    });

    await createAdminActivityLog(tx, {
      adminId: request.admin?.sub,
      action: "delete",
      entityType: "trip_expense",
      entityId: currentExpense.id,
      entityLabel: currentExpense.title,
      description: "Xóa chi phí chuyến đi",
      metadata: {
        amount: currentExpense.amount,
        expenseType: currentExpense.expenseType
      }
    });
  });

  return response.status(204).send();
});

router.get("/reminders", requireAdminPermission("reminders.manage"), async (request, response) => {
  await ensureAutomaticReminders();

  const scope = request.query.scope === "all" ? "all" : request.query.scope === "done" ? "done" : "active";
  const where =
    scope === "done"
      ? { status: { in: ["sent", "completed", "canceled"] } }
      : scope === "all"
        ? {}
        : { status: { in: ["pending", "failed"] } };

  const reminders = await prisma.reminder.findMany({
    where,
    include: reminderInclude,
    orderBy: [{ remindAt: "asc" }, { createdAt: "desc" }]
  });

  return response.json(reminders);
});

router.post("/reminders", requireAdminPermission("reminders.manage"), async (request, response) => {
  const parsed = reminderSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Thông tin nhắc việc không hợp lệ.",
      errors: parsed.error.flatten()
    });
  }

  const reminder = await prisma.$transaction(async (tx) => {
    const savedReminder = await tx.reminder.create({
      data: {
        title: parsed.data.title.trim(),
        reminderType: parsed.data.reminderType ?? "manual",
        remindAt: parsed.data.remindAt,
        status: parsed.data.status ?? "pending",
        targetType: parsed.data.targetType ?? null,
        targetId: parsed.data.targetId ?? null,
        bookingRequestId: parsed.data.bookingRequestId ?? null,
        scheduleNoteId: parsed.data.scheduleNoteId ?? null,
        tripId: parsed.data.tripId ?? null,
        vehicleId: parsed.data.vehicleId ?? null,
        driverId: parsed.data.driverId ?? null,
        note: parsed.data.note ?? null
      },
      include: reminderInclude
    });

    await createAdminActivityLog(tx, {
      adminId: request.admin?.sub,
      action: "create",
      entityType: "reminder",
      entityId: savedReminder.id,
      entityLabel: savedReminder.title,
      description: "Tạo nhắc việc",
      metadata: {
        remindAt: savedReminder.remindAt,
        reminderType: savedReminder.reminderType
      }
    });

    return savedReminder;
  });

  return response.status(201).json(reminder);
});

router.patch("/reminders/:id", requireAdminPermission("reminders.manage"), async (request, response) => {
  const parsed = reminderSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Thông tin nhắc việc không hợp lệ.",
      errors: parsed.error.flatten()
    });
  }

  const reminder = await prisma.$transaction(async (tx) => {
    const savedReminder = await tx.reminder.update({
      where: { id: request.params.id },
      data: {
        title: parsed.data.title.trim(),
        reminderType: parsed.data.reminderType ?? "manual",
        remindAt: parsed.data.remindAt,
        status: parsed.data.status ?? "pending",
        targetType: parsed.data.targetType ?? null,
        targetId: parsed.data.targetId ?? null,
        bookingRequestId: parsed.data.bookingRequestId ?? null,
        scheduleNoteId: parsed.data.scheduleNoteId ?? null,
        tripId: parsed.data.tripId ?? null,
        vehicleId: parsed.data.vehicleId ?? null,
        driverId: parsed.data.driverId ?? null,
        note: parsed.data.note ?? null,
        completedAt: parsed.data.status === "completed" ? new Date() : null
      },
      include: reminderInclude
    });

    await createAdminActivityLog(tx, {
      adminId: request.admin?.sub,
      action: "update",
      entityType: "reminder",
      entityId: savedReminder.id,
      entityLabel: savedReminder.title,
      description: "Cập nhật nhắc việc",
      metadata: {
        status: savedReminder.status,
        remindAt: savedReminder.remindAt
      }
    });

    return savedReminder;
  });

  return response.json(reminder);
});

router.patch("/reminders/:id/status", requireAdminPermission("reminders.manage"), async (request, response) => {
  const parsed = reminderStatusSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Trạng thái nhắc việc không hợp lệ.",
      errors: parsed.error.flatten()
    });
  }

  const reminder = await prisma.reminder.update({
    where: { id: request.params.id },
    data: {
      status: parsed.data.status,
      completedAt: parsed.data.status === "completed" ? new Date() : null,
      sentAt: parsed.data.status === "sent" ? new Date() : undefined
    },
    include: reminderInclude
  });

  return response.json(reminder);
});

router.post("/reminders/process-due", requireAdminPermission("reminders.manage"), async (request, response) => {
  const result = await processDueReminders();
  return response.json(result);
});

router.delete("/reminders/:id", requireAdminPermission("reminders.manage"), async (request, response) => {
  const currentReminder = await prisma.reminder.findUnique({
    where: { id: request.params.id }
  });

  if (!currentReminder) {
    return response.status(404).json({ message: "Nhắc việc không tồn tại." });
  }

  await prisma.reminder.delete({
    where: { id: currentReminder.id }
  });

  return response.status(204).send();
});

router.get("/vehicle-maintenances", requireAdminPermission("maintenances.manage"), async (request, response) => {
  const maintenances = await prisma.vehicleMaintenance.findMany({
    include: {
      vehicle: {
        select: {
          id: true,
          name: true,
          seatCount: true
        }
      }
    },
    orderBy: [{ serviceDate: "desc" }, { createdAt: "desc" }]
  });

  return response.json(maintenances);
});

router.post("/vehicle-maintenances", requireAdminPermission("maintenances.manage"), async (request, response) => {
  const parsed = vehicleMaintenanceSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Invalid vehicle maintenance payload",
      errors: parsed.error.flatten()
    });
  }

  const maintenance = await prisma.vehicleMaintenance.create({
    data: {
      vehicleId: parsed.data.vehicleId,
      title: parsed.data.title?.trim() || "Bảo dưỡng xe",
      maintenanceType: parsed.data.maintenanceType,
      licensePlate: parsed.data.licensePlate ?? null,
      serviceDate: parsed.data.serviceDate ?? new Date(),
      nextServiceDate: parsed.data.nextServiceDate ?? null,
      odometerKm: parsed.data.odometerKm ?? null,
      cost: parsed.data.cost ?? null,
      status: parsed.data.status ?? "completed",
      note: parsed.data.note ?? null
    },
    include: {
      vehicle: {
        select: {
          id: true,
          name: true,
          seatCount: true
        }
      }
    }
  });

  return response.status(201).json(maintenance);
});

router.patch("/vehicle-maintenances/:id", requireAdminPermission("maintenances.manage"), async (request, response) => {
  const parsed = vehicleMaintenanceSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Invalid vehicle maintenance payload",
      errors: parsed.error.flatten()
    });
  }

  const maintenance = await prisma.vehicleMaintenance.update({
    where: { id: request.params.id },
    data: {
      vehicleId: parsed.data.vehicleId,
      title: parsed.data.title?.trim() || "Bảo dưỡng xe",
      maintenanceType: parsed.data.maintenanceType,
      licensePlate: parsed.data.licensePlate ?? null,
      serviceDate: parsed.data.serviceDate ?? new Date(),
      nextServiceDate: parsed.data.nextServiceDate ?? null,
      odometerKm: parsed.data.odometerKm ?? null,
      cost: parsed.data.cost ?? null,
      status: parsed.data.status ?? "completed",
      note: parsed.data.note ?? null
    },
    include: {
      vehicle: {
        select: {
          id: true,
          name: true,
          seatCount: true
        }
      }
    }
  });

  return response.json(maintenance);
});

router.delete("/vehicle-maintenances/:id", requireAdminPermission("maintenances.manage"), async (request, response) => {
  await prisma.vehicleMaintenance.delete({
    where: { id: request.params.id }
  });

  return response.status(204).send();
});

router.get("/vehicle-categories", requireAdminPermission("vehicle_categories.manage"), async (request, response) => {
  const categories = await prisma.vehicleCategory.findMany({
    include: {
      vehicles: {
        include: {
          images: {
            orderBy: { sortOrder: "asc" }
          }
        },
        orderBy: { createdAt: "desc" }
      }
    },
    orderBy: { sortOrder: "asc" }
  });

  return response.json(categories);
});

router.post("/vehicle-categories", requireAdminPermission("vehicle_categories.manage"), async (request, response) => {
  const parsed = vehicleCategorySchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Invalid vehicle category payload",
      errors: parsed.error.flatten()
    });
  }

  const category = await prisma.vehicleCategory.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      sortOrder: parsed.data.sortOrder ?? 0,
      isPublished: parsed.data.isPublished ?? true
    }
  });

  return response.status(201).json(category);
});

router.patch("/vehicle-categories/:id", requireAdminPermission("vehicle_categories.manage"), async (request, response) => {
  const parsed = vehicleCategorySchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Invalid vehicle category payload",
      errors: parsed.error.flatten()
    });
  }

  const category = await prisma.vehicleCategory.update({
    where: { id: request.params.id },
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      sortOrder: parsed.data.sortOrder ?? 0,
      isPublished: parsed.data.isPublished ?? true
    }
  });

  return response.json(category);
});

router.delete("/vehicle-categories/:id", requireAdminPermission("vehicle_categories.manage"), async (request, response) => {
  await prisma.vehicleCategory.delete({
    where: { id: request.params.id }
  });

  return response.status(204).send();
});

router.get("/drivers", requireAdminPermission("drivers.manage"), async (request, response) => {
  const drivers = await prisma.driver.findMany({
    orderBy: [{ isActive: "desc" }, { fullName: "asc" }]
  });

  return response.json(drivers);
});

router.post("/drivers", requireAdminPermission("drivers.manage"), async (request, response) => {
  const parsed = driverSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Invalid driver payload",
      errors: parsed.error.flatten()
    });
  }

  const driver = await prisma.$transaction(async (tx) => {
    const createdDriver = await tx.driver.create({
      data: {
        fullName: parsed.data.fullName.trim(),
        phoneNumber: parsed.data.phoneNumber.trim(),
        status: parsed.data.status ?? "available",
        note: parsed.data.note ?? null,
        isActive: parsed.data.isActive ?? true
      }
    });

    await createAdminActivityLog(tx, {
      adminId: request.admin?.sub,
      action: "create",
      entityType: "driver",
      entityId: createdDriver.id,
      entityLabel: createdDriver.fullName,
      description: "Tạo tài xế",
      metadata: {
        phoneNumber: createdDriver.phoneNumber,
        status: createdDriver.status
      }
    });

    return createdDriver;
  });

  return response.status(201).json(driver);
});

router.patch("/drivers/:id", requireAdminPermission("drivers.manage"), async (request, response) => {
  const parsed = driverSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Invalid driver payload",
      errors: parsed.error.flatten()
    });
  }

  const driver = await prisma.$transaction(async (tx) => {
    const updatedDriver = await tx.driver.update({
      where: { id: request.params.id },
      data: {
        fullName: parsed.data.fullName.trim(),
        phoneNumber: parsed.data.phoneNumber.trim(),
        status: parsed.data.status ?? "available",
        note: parsed.data.note ?? null,
        isActive: parsed.data.isActive ?? true
      }
    });

    await createAdminActivityLog(tx, {
      adminId: request.admin?.sub,
      action: "update",
      entityType: "driver",
      entityId: updatedDriver.id,
      entityLabel: updatedDriver.fullName,
      description: "Cập nhật tài xế",
      metadata: {
        phoneNumber: updatedDriver.phoneNumber,
        status: updatedDriver.status
      }
    });

    return updatedDriver;
  });

  return response.json(driver);
});

router.delete("/drivers/:id", requireAdminPermission("drivers.manage"), async (request, response) => {
  await prisma.$transaction(async (tx) => {
    const deletedDriver = await tx.driver.delete({
      where: { id: request.params.id }
    });

    await createAdminActivityLog(tx, {
      adminId: request.admin?.sub,
      action: "delete",
      entityType: "driver",
      entityId: deletedDriver.id,
      entityLabel: deletedDriver.fullName,
      description: "Xóa tài xế",
      metadata: {
        phoneNumber: deletedDriver.phoneNumber
      }
    });
  });

  return response.status(204).send();
});

router.get("/trips", requireAdminPermission("trips.manage"), async (request, response) => {
  const trips = await prisma.trip.findMany({
    include: tripInclude,
    orderBy: [{ tripDate: "asc" }, { createdAt: "desc" }]
  });

  return response.json(trips);
});

router.post("/trips", requireAdminPermission("trips.manage"), async (request, response) => {
  const parsed = tripSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Invalid trip payload",
      errors: parsed.error.flatten()
    });
  }

  const trip = await prisma.$transaction(async (tx) => {
    const createdTrip = await tx.trip.create({
      data: {
        title: parsed.data.title.trim(),
        tripDate: parsed.data.tripDate ?? null,
        pickupLocation: parsed.data.pickupLocation ?? null,
        dropoffLocation: parsed.data.dropoffLocation ?? null,
        vehicleId: parsed.data.vehicleId ?? null,
        driverId: parsed.data.driverId ?? null,
        status: parsed.data.status ?? "draft",
        note: parsed.data.note ?? null
      }
    });

    if (parsed.data.bookingIds?.length) {
      await syncBookingsForTrip(tx, {
        bookingIds: parsed.data.bookingIds,
        tripId: createdTrip.id,
        vehicleId: parsed.data.vehicleId ?? null,
        driverId: parsed.data.driverId ?? null,
        tripStatus: parsed.data.status ?? "draft",
        note: parsed.data.note ?? null,
        changedByAdminId: request.admin?.sub ?? null
      });
    }

    const tripWithInclude = await tx.trip.findUnique({
      where: { id: createdTrip.id },
      include: tripInclude
    });

    await createAdminActivityLog(tx, {
      adminId: request.admin?.sub,
      action: "create",
      entityType: "trip",
      entityId: createdTrip.id,
      entityLabel: createdTrip.title,
      description: "Tạo chuyến đi",
      metadata: {
        bookingCount: parsed.data.bookingIds?.length ?? 0,
        status: createdTrip.status
      }
    });

    return tripWithInclude;
  });

  return response.status(201).json(trip);
});

router.patch("/trips/:id", requireAdminPermission("trips.manage"), async (request, response) => {
  const parsed = tripSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Invalid trip payload",
      errors: parsed.error.flatten()
    });
  }

  const currentTrip = await prisma.trip.findUnique({
    where: { id: request.params.id }
  });

  if (!currentTrip) {
    return response.status(404).json({ message: "Chuyến đi không tồn tại." });
  }

  const trip = await prisma.$transaction(async (tx) => {
    await tx.trip.update({
      where: { id: request.params.id },
      data: {
        title: parsed.data.title.trim(),
        tripDate: parsed.data.tripDate ?? null,
        pickupLocation: parsed.data.pickupLocation ?? null,
        dropoffLocation: parsed.data.dropoffLocation ?? null,
        vehicleId: parsed.data.vehicleId ?? null,
        driverId: parsed.data.driverId ?? null,
        status: parsed.data.status ?? "draft",
        note: parsed.data.note ?? null
      }
    });

    const selectedBookingIds = parsed.data.bookingIds ?? [];

    await tx.bookingRequest.updateMany({
      where: {
        tripId: request.params.id,
        id: {
          notIn: selectedBookingIds.length ? selectedBookingIds : [""]
        }
      },
      data: {
        tripId: null
      }
    });

    if (selectedBookingIds.length) {
      await syncBookingsForTrip(tx, {
        bookingIds: selectedBookingIds,
        tripId: request.params.id,
        vehicleId: parsed.data.vehicleId ?? null,
        driverId: parsed.data.driverId ?? null,
        tripStatus: parsed.data.status ?? "draft",
        note: parsed.data.note ?? null,
        changedByAdminId: request.admin?.sub ?? null
      });
    }

    const tripWithInclude = await tx.trip.findUnique({
      where: { id: request.params.id },
      include: tripInclude
    });

    await createAdminActivityLog(tx, {
      adminId: request.admin?.sub,
      action: "update",
      entityType: "trip",
      entityId: request.params.id,
      entityLabel: parsed.data.title.trim(),
      description: "Cập nhật chuyến đi",
      metadata: {
        bookingCount: parsed.data.bookingIds?.length ?? 0,
        status: parsed.data.status ?? "draft"
      }
    });

    return tripWithInclude;
  });

  return response.json(trip);
});

router.delete("/trips/:id", requireAdminPermission("trips.manage"), async (request, response) => {
  await prisma.$transaction(async (tx) => {
    const existingTrip = await tx.trip.findUnique({
      where: { id: request.params.id }
    });

    await tx.bookingRequest.updateMany({
      where: {
        tripId: request.params.id
      },
      data: {
        tripId: null
      }
    });

    await tx.trip.delete({
      where: { id: request.params.id }
    });

    await createAdminActivityLog(tx, {
      adminId: request.admin?.sub,
      action: "delete",
      entityType: "trip",
      entityId: request.params.id,
      entityLabel: existingTrip?.title ?? null,
      description: "Xóa chuyến đi",
      metadata: {
        status: existingTrip?.status ?? null
      }
    });
  });

  return response.status(204).send();
});

const serviceSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isPublished: z.boolean().optional()
});

const vehicleSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  seatCount: z.number().int().min(1),
  shortDescription: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  features: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean().optional()
});

const vehicleCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isPublished: z.boolean().optional()
});

const driverSchema = z.object({
  fullName: z.string().min(1),
  phoneNumber: z.string().min(1),
  status: z.string().min(1).optional(),
  note: z.string().optional().nullable(),
  isActive: z.boolean().optional()
});

const customerSchema = z.object({
  fullName: z.string().min(1),
  phoneNumber: z.string().min(1),
  status: z.enum(CUSTOMER_STATUSES).optional(),
  note: z.string().optional().nullable()
});

const bookingStatusSchema = z.object({
  status: z.string().min(1),
  note: z.string().optional().nullable(),
  cancelReason: z.string().optional().nullable()
});

const optionalDateField = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.coerce.date().optional().nullable()
);

const optionalIntField = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.coerce.number().int().optional().nullable()
);

const optionalNumberField = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.coerce.number().optional().nullable()
);

const optionalStringField = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.string().optional().nullable()
);

const adminUserRoleSchema = z.enum([
  "super_admin",
  "operator",
  "accountant",
  "content_editor"
]);

const adminUserCreateSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  role: adminUserRoleSchema,
  password: z.string().min(8),
  permissions: z.array(z.enum(ALL_ADMIN_PERMISSIONS)).optional(),
  isActive: z.boolean().optional()
});

const adminUserUpdateSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  role: adminUserRoleSchema,
  password: z.string().min(8).optional().or(z.literal("")),
  permissions: z.array(z.enum(ALL_ADMIN_PERMISSIONS)).optional(),
  isActive: z.boolean().optional()
});

const tripSchema = z.object({
  title: z.string().min(1),
  tripDate: optionalDateField,
  pickupLocation: optionalStringField,
  dropoffLocation: optionalStringField,
  vehicleId: optionalStringField,
  driverId: optionalStringField,
  status: z.string().min(1).optional(),
  note: optionalStringField,
  bookingIds: z.array(z.string().min(1)).optional()
});

const bookingUpdateSchema = z.object({
  customerName: z.string().min(1),
  phoneNumber: z.string().min(1),
  pickupLocation: z.string().min(1),
  dropoffLocation: z.string().min(1),
  tripDate: optionalDateField,
  note: optionalStringField,
  status: z.string().min(1),
  internalNote: optionalStringField,
  cancelReason: optionalStringField,
  assignedVehicleId: optionalStringField,
  assignedDriverId: optionalStringField
});

const siteSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  group: z.string().min(1)
});

const vehicleImageSchema = z.object({
  altText: z.string().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isPrimary: z.boolean().optional()
});

const scheduleNoteSchema = z.object({
  vehicleId: z.string().min(1),
  bookingRequestId: optionalStringField,
  title: optionalStringField,
  customerName: optionalStringField,
  phoneNumber: optionalStringField,
  tripDate: optionalDateField,
  pickupLocation: optionalStringField,
  dropoffLocation: optionalStringField,
  status: z.string().min(1).optional(),
  note: optionalStringField
});

const vehicleMaintenanceSchema = z.object({
  vehicleId: z.string().min(1),
  title: optionalStringField,
  maintenanceType: z.string().min(1),
  licensePlate: optionalStringField,
  serviceDate: optionalDateField,
  nextServiceDate: optionalDateField,
  odometerKm: optionalIntField,
  cost: optionalNumberField,
  status: z.string().min(1).optional(),
  note: optionalStringField
});

const vehicleTripPaymentSchema = z.object({
  vehicleId: z.string().min(1),
  scheduleNoteId: optionalStringField,
  bookingRequestId: optionalStringField,
  title: optionalStringField,
  customerName: optionalStringField,
  phoneNumber: optionalStringField,
  tripDate: optionalDateField,
  pickupLocation: optionalStringField,
  dropoffLocation: optionalStringField,
  amount: optionalNumberField,
  paymentStatus: z.string().min(1).optional(),
  collectedAt: optionalDateField,
  note: optionalStringField
});

const tripExpenseSchema = z.object({
  tripId: optionalStringField,
  bookingRequestId: optionalStringField,
  vehicleId: optionalStringField,
  title: optionalStringField,
  expenseType: z.string().min(1).optional(),
  amount: optionalNumberField,
  expenseDate: optionalDateField,
  paidBy: optionalStringField,
  note: optionalStringField
});

const reminderSchema = z.object({
  title: z.string().min(1),
  reminderType: z.string().min(1).optional(),
  remindAt: z.coerce.date(),
  status: z.string().min(1).optional(),
  targetType: optionalStringField,
  targetId: optionalStringField,
  bookingRequestId: optionalStringField,
  scheduleNoteId: optionalStringField,
  tripId: optionalStringField,
  vehicleId: optionalStringField,
  driverId: optionalStringField,
  note: optionalStringField
});

const reminderStatusSchema = z.object({
  status: z.enum(["pending", "sent", "failed", "completed", "canceled"])
});

router.get("/services", requireAdminPermission("services.manage"), async (request, response) => {
  const services = await prisma.service.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });

  return response.json(services);
});

router.post("/services", requireAdminPermission("services.manage"), async (request, response) => {
  const parsed = serviceSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Invalid service payload",
      errors: parsed.error.flatten()
    });
  }

  const service = await prisma.service.create({
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      icon: parsed.data.icon ?? null,
      sortOrder: parsed.data.sortOrder ?? 0,
      isPublished: parsed.data.isPublished ?? true
    }
  });

  return response.status(201).json(service);
});

router.patch("/services/:id", requireAdminPermission("services.manage"), async (request, response) => {
  const parsed = serviceSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Invalid service payload",
      errors: parsed.error.flatten()
    });
  }

  const service = await prisma.service.update({
    where: { id: request.params.id },
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      icon: parsed.data.icon ?? null,
      sortOrder: parsed.data.sortOrder ?? 0,
      isPublished: parsed.data.isPublished ?? true
    }
  });

  return response.json(service);
});

router.delete("/services/:id", requireAdminPermission("services.manage"), async (request, response) => {
  await prisma.service.delete({
    where: { id: request.params.id }
  });

  return response.status(204).send();
});

router.get("/vehicles", requireAdminPermission("vehicles.manage"), async (request, response) => {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: "asc" }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return response.json(vehicles);
});

router.post("/vehicles", requireAdminPermission("vehicles.manage"), async (request, response) => {
  const parsed = vehicleSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Invalid vehicle payload",
      errors: parsed.error.flatten()
    });
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      categoryId: parsed.data.categoryId,
      name: parsed.data.name,
      slug: parsed.data.slug,
      seatCount: parsed.data.seatCount,
      shortDescription: parsed.data.shortDescription ?? null,
      description: parsed.data.description ?? null,
      features: parsed.data.features ?? [],
      isFeatured: parsed.data.isFeatured ?? false,
      isPublished: parsed.data.isPublished ?? true
    }
  });

  return response.status(201).json(vehicle);
});

router.patch("/vehicles/:id", requireAdminPermission("vehicles.manage"), async (request, response) => {
  const parsed = vehicleSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Invalid vehicle payload",
      errors: parsed.error.flatten()
    });
  }

  const vehicle = await prisma.vehicle.update({
    where: { id: request.params.id },
    data: {
      categoryId: parsed.data.categoryId,
      name: parsed.data.name,
      slug: parsed.data.slug,
      seatCount: parsed.data.seatCount,
      shortDescription: parsed.data.shortDescription ?? null,
      description: parsed.data.description ?? null,
      features: parsed.data.features ?? [],
      isFeatured: parsed.data.isFeatured ?? false,
      isPublished: parsed.data.isPublished ?? true
    }
  });

  return response.json(vehicle);
});

router.delete("/vehicles/:id", requireAdminPermission("vehicles.manage"), async (request, response) => {
  await prisma.vehicle.delete({
    where: { id: request.params.id }
  });

  return response.status(204).send();
});

router.post(
  "/vehicles/:id/images",
  requireAdminPermission("vehicles.manage"),
  uploadVehicleImages.array("images", 10),
  async (request, response) => {
    const files = request.files ?? [];

    if (!files.length) {
      return response.status(400).json({ message: "No files uploaded" });
    }

    const fileList = Array.isArray(files) ? files : [];
    const invalidFile = (
      await Promise.all(
        fileList.map(async (file) => ({
          file,
          isValid: await validateStoredImageFile(file.path)
        }))
      )
    ).find((entry) => !entry.isValid);

    if (invalidFile) {
      await removeUploadedFiles(fileList);
      return response.status(400).json({
        message: "File tải lên không đúng định dạng ảnh hợp lệ."
      });
    }

    let optimizedFiles;

    try {
      optimizedFiles = await Promise.all(
        fileList.map((file) =>
          optimizeStoredImageFile(file, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 82
          })
        )
      );
    } catch (error) {
      await removeUploadedFiles([
        ...fileList,
        ...fileList.map((file) => buildOptimizedCandidatePath(file.path))
      ]);
      return response.status(400).json({
        message: "Không thể xử lý ảnh tải lên."
      });
    }

    const existingCount = await prisma.vehicleImage.count({
      where: { vehicleId: request.params.id }
    });

    const createdImages = await prisma.$transaction(
      optimizedFiles.map((file, index) =>
        prisma.vehicleImage.create({
          data: {
            vehicleId: request.params.id,
            imageUrl: `/image/vehicles/${file.filename}`,
            altText: file.originalname,
            isPrimary: existingCount === 0 && index === 0,
            sortOrder: existingCount + index
          }
        })
      )
    );

    return response.status(201).json(createdImages);
  }
);

router.delete("/vehicle-images/:id", requireAdminPermission("vehicles.manage"), async (request, response) => {
  await prisma.vehicleImage.delete({
    where: { id: request.params.id }
  });

  return response.status(204).send();
});

router.patch("/vehicle-images/:id", requireAdminPermission("vehicles.manage"), async (request, response) => {
  const parsed = vehicleImageSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Invalid vehicle image payload",
      errors: parsed.error.flatten()
    });
  }

  const currentImage = await prisma.vehicleImage.findUnique({
    where: { id: request.params.id }
  });

  if (!currentImage) {
    return response.status(404).json({ message: "Vehicle image not found" });
  }

  const updatedImage = await prisma.$transaction(async (tx) => {
    if (parsed.data.isPrimary) {
      await tx.vehicleImage.updateMany({
        where: { vehicleId: currentImage.vehicleId },
        data: { isPrimary: false }
      });
    }

    return tx.vehicleImage.update({
      where: { id: request.params.id },
      data: {
        altText: parsed.data.altText ?? currentImage.altText,
        sortOrder: parsed.data.sortOrder ?? currentImage.sortOrder,
        isPrimary: parsed.data.isPrimary ?? currentImage.isPrimary
      }
    });
  });

  return response.json(updatedImage);
});

router.get("/site-settings", requireAdminPermission("settings.manage"), async (request, response) => {
  await ensureDefaultSiteSettings(prisma);

  const settings = await prisma.siteSetting.findMany({
    orderBy: [{ group: "asc" }, { key: "asc" }]
  });

  return response.json(settings);
});

router.post("/site-settings", requireAdminPermission("settings.manage"), async (request, response) => {
  const parsed = siteSettingSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Invalid site setting payload",
      errors: parsed.error.flatten()
    });
  }

  const setting = await prisma.siteSetting.create({
    data: parsed.data
  });

  return response.status(201).json(setting);
});

router.post("/site-assets/logo", requireAdminPermission("settings.manage"), uploadBrandLogo.single("logo"), async (request, response) => {
  if (!request.file) {
    return response.status(400).json({ message: "Chưa có file logo được tải lên." });
  }

  const isValidImage = await validateStoredImageFile(request.file.path);

  if (!isValidImage) {
    await removeUploadedFiles([request.file]);
    return response.status(400).json({
      message: "File tải lên không đúng định dạng ảnh hợp lệ."
    });
  }

  let optimizedLogo;

  try {
    optimizedLogo = await optimizeStoredImageFile(request.file, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 84
    });
  } catch (error) {
    await removeUploadedFiles([
      request.file,
      buildOptimizedCandidatePath(request.file.path)
    ]);
    return response.status(400).json({
      message: "Không thể xử lý ảnh tải lên."
    });
  }

  return response.status(201).json({
    imageUrl: `/image/branding/${optimizedLogo.filename}`
  });
});

router.post(
  "/site-assets/hero-background",
  requireAdminPermission("settings.manage"),
  uploadBrandLogo.single("image"),
  async (request, response) => {
    if (!request.file) {
      return response.status(400).json({ message: "Chưa có ảnh nền hero được tải lên." });
    }

    const isValidImage = await validateStoredImageFile(request.file.path);

    if (!isValidImage) {
      await removeUploadedFiles([request.file]);
      return response.status(400).json({
        message: "File tải lên không đúng định dạng ảnh hợp lệ."
      });
    }

    let optimizedImage;

    try {
      optimizedImage = await optimizeStoredImageFile(request.file, {
        maxWidth: 2200,
        maxHeight: 1600,
        quality: 84
      });
    } catch (error) {
      await removeUploadedFiles([request.file, buildOptimizedCandidatePath(request.file.path)]);
      return response.status(400).json({
        message: "Không thể xử lý ảnh tải lên."
      });
    }

    return response.status(201).json({
      imageUrl: `/image/branding/${optimizedImage.filename}`
    });
  }
);

router.put("/site-settings/:id", requireAdminPermission("settings.manage"), async (request, response) => {
  const parsed = siteSettingSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Invalid site setting payload",
      errors: parsed.error.flatten()
    });
  }

  const setting = await prisma.siteSetting.update({
    where: { id: request.params.id },
    data: parsed.data
  });

  return response.json(setting);
});

router.delete("/site-settings/:id", requireAdminPermission("settings.manage"), async (request, response) => {
  await prisma.siteSetting.delete({
    where: { id: request.params.id }
  });

  return response.status(204).send();
});

router.patch("/booking-requests/:id/status", requireAdminPermission("bookings.manage"), async (request, response) => {
  const parsed = bookingStatusSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Invalid booking status payload",
      errors: parsed.error.flatten()
    });
  }

  const currentBooking = await prisma.bookingRequest.findUnique({
    where: { id: request.params.id }
  });

  if (!currentBooking) {
    return response.status(404).json({ message: "Booking không tồn tại." });
  }

  const booking = await prisma.$transaction(async (tx) => {
    const updatedBooking = await tx.bookingRequest.update({
      where: { id: request.params.id },
      data: {
        ...buildBookingStatusPatch(currentBooking, parsed.data.status, parsed.data),
        handledByAdminId: request.admin?.sub ?? null
      },
      include: bookingInclude
    });

    if (currentBooking.status !== parsed.data.status) {
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: currentBooking.id,
          fromStatus: currentBooking.status,
          toStatus: parsed.data.status,
          note: parsed.data.note ?? parsed.data.cancelReason ?? null,
          changedByAdminId: request.admin?.sub ?? null
        }
      });
    }

    await createAdminActivityLog(tx, {
      adminId: request.admin?.sub,
      action: "status_change",
      entityType: "booking",
      entityId: currentBooking.id,
      entityLabel: updatedBooking.customerName,
      description: "Đổi trạng thái booking",
      metadata: {
        fromStatus: currentBooking.status,
        toStatus: parsed.data.status,
        note: parsed.data.note ?? parsed.data.cancelReason ?? null
      }
    });

    await ensureWorkflowForBooking(tx, updatedBooking);

    return updatedBooking;
  });

  publishBookingEvent("booking.updated", booking);

  return response.json(booking);
});

router.patch("/booking-requests/:id", requireAdminPermission("bookings.manage"), async (request, response) => {
  const parsed = bookingUpdateSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Invalid booking payload",
      errors: parsed.error.flatten()
    });
  }

  const currentBooking = await prisma.bookingRequest.findUnique({
    where: { id: request.params.id }
  });

  if (!currentBooking) {
    return response.status(404).json({ message: "Booking không tồn tại." });
  }

  const booking = await prisma.$transaction(async (tx) => {
    const updatedBooking = await tx.bookingRequest.update({
      where: { id: request.params.id },
      data: {
        customerName: parsed.data.customerName.trim(),
        phoneNumber: parsed.data.phoneNumber.trim(),
        pickupLocation: parsed.data.pickupLocation.trim(),
        dropoffLocation: parsed.data.dropoffLocation.trim(),
        tripDate: parsed.data.tripDate ?? null,
        note: parsed.data.note ?? null,
        internalNote: parsed.data.internalNote ?? null,
        cancelReason: parsed.data.cancelReason ?? null,
        assignedVehicleId: parsed.data.assignedVehicleId ?? null,
        assignedDriverId: parsed.data.assignedDriverId ?? null,
        handledByAdminId: request.admin?.sub ?? null,
        ...buildBookingStatusPatch(currentBooking, parsed.data.status, parsed.data)
      },
      include: bookingInclude
    });

    if (currentBooking.status !== parsed.data.status) {
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: currentBooking.id,
          fromStatus: currentBooking.status,
          toStatus: parsed.data.status,
          note: parsed.data.internalNote ?? parsed.data.cancelReason ?? parsed.data.note ?? null,
          changedByAdminId: request.admin?.sub ?? null
        }
      });
    }

    await createAdminActivityLog(tx, {
      adminId: request.admin?.sub,
      action: "update",
      entityType: "booking",
      entityId: currentBooking.id,
      entityLabel: updatedBooking.customerName,
      description: "Cập nhật booking",
      metadata: {
        status: updatedBooking.status,
        assignedVehicleId: updatedBooking.assignedVehicleId,
        assignedDriverId: updatedBooking.assignedDriverId,
        tripId: updatedBooking.tripId ?? null
      }
    });

    await ensureWorkflowForBooking(tx, updatedBooking);

    return updatedBooking;
  });

  publishBookingEvent("booking.updated", booking);

  return response.json(booking);
});

export default router;




