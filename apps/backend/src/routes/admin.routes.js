import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireAdminAuth } from "../middlewares/authMiddleware.js";
import { uploadBrandLogo, uploadVehicleImages } from "../middlewares/uploadMiddleware.js";
import { verifyAdminToken } from "../utils/auth.js";
import { publishBookingEvent, subscribeBookingEvents } from "../services/bookingEvents.js";
import {
  fetchRecentTelegramLogs,
  sendBookingDeletedTelegramNotification,
  sendBookingUpdatedTelegramNotification,
  sendTelegramTestMessage
} from "../services/telegramService.js";

const router = Router();

router.get("/booking-events", (request, response) => {
  const token = typeof request.query.token === "string" ? request.query.token : "";

  if (!token) {
    return response.status(401).json({ message: "Unauthorized" });
  }

  try {
    request.admin = verifyAdminToken(token);
  } catch {
    return response.status(401).json({ message: "Invalid token" });
  }

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

router.post("/notifications/telegram/test", async (request, response) => {
  const result = await sendTelegramTestMessage();

  return response.json({
    message:
      result.recipientCount > 1
        ? `Đã gửi tin nhắn test Telegram tới ${result.sentCount}/${result.recipientCount} chat${
            result.failedRecipients?.length ? `, lỗi ${result.failedRecipients.length} chat` : ""
          }.`
        : "Đã gửi tin nhắn test Telegram."
  });
});

router.get("/notifications/logs", async (request, response) => {
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

router.get("/dashboard", async (request, response) => {
  const [bookingCount, vehicleCount, serviceCount] = await Promise.all([
    prisma.bookingRequest.count(),
    prisma.vehicle.count(),
    prisma.service.count()
  ]);

  return response.json({
    bookingCount,
    vehicleCount,
    serviceCount
  });
});

router.get("/booking-requests", async (request, response) => {
  const bookings = await prisma.bookingRequest.findMany({
    orderBy: { createdAt: "desc" }
  });

  return response.json(bookings);
});

router.delete("/booking-requests/:id", async (request, response) => {
  const booking = await prisma.bookingRequest.delete({
    where: { id: request.params.id }
  });

  publishBookingEvent("booking.deleted", booking);
  void sendBookingDeletedTelegramNotification(booking).catch((error) => {
    console.error("[telegram][booking.deleted]", error.message);
  });

  return response.status(204).send();
});

router.get("/schedule-notes", async (request, response) => {
  const notes = await prisma.scheduleNote.findMany({
    include: {
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
    },
    orderBy: [{ tripDate: "asc" }, { createdAt: "desc" }]
  });

  return response.json(notes);
});

router.post("/schedule-notes", async (request, response) => {
  const parsed = scheduleNoteSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Invalid schedule note payload",
      errors: parsed.error.flatten()
    });
  }

  const note = await prisma.scheduleNote.create({
    data: {
      vehicleId: parsed.data.vehicleId,
      bookingRequestId: parsed.data.bookingRequestId || null,
      title: parsed.data.title,
      customerName: parsed.data.customerName ?? null,
      phoneNumber: parsed.data.phoneNumber ?? null,
      tripDate: parsed.data.tripDate ?? null,
      pickupLocation: parsed.data.pickupLocation ?? null,
      dropoffLocation: parsed.data.dropoffLocation ?? null,
      status: parsed.data.status ?? "scheduled",
      note: parsed.data.note ?? null
    },
    include: {
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
    }
  });

  return response.status(201).json(note);
});

router.patch("/schedule-notes/:id", async (request, response) => {
  const parsed = scheduleNoteSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Invalid schedule note payload",
      errors: parsed.error.flatten()
    });
  }

  const note = await prisma.scheduleNote.update({
    where: { id: request.params.id },
    data: {
      vehicleId: parsed.data.vehicleId,
      bookingRequestId: parsed.data.bookingRequestId || null,
      title: parsed.data.title,
      customerName: parsed.data.customerName ?? null,
      phoneNumber: parsed.data.phoneNumber ?? null,
      tripDate: parsed.data.tripDate ?? null,
      pickupLocation: parsed.data.pickupLocation ?? null,
      dropoffLocation: parsed.data.dropoffLocation ?? null,
      status: parsed.data.status ?? "scheduled",
      note: parsed.data.note ?? null
    },
    include: {
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
    }
  });

  return response.json(note);
});

router.delete("/schedule-notes/:id", async (request, response) => {
  await prisma.scheduleNote.delete({
    where: { id: request.params.id }
  });

  return response.status(204).send();
});

router.get("/vehicle-maintenances", async (request, response) => {
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

router.post("/vehicle-maintenances", async (request, response) => {
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
      title: parsed.data.title,
      maintenanceType: parsed.data.maintenanceType,
      serviceDate: parsed.data.serviceDate,
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

router.patch("/vehicle-maintenances/:id", async (request, response) => {
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
      title: parsed.data.title,
      maintenanceType: parsed.data.maintenanceType,
      serviceDate: parsed.data.serviceDate,
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

router.delete("/vehicle-maintenances/:id", async (request, response) => {
  await prisma.vehicleMaintenance.delete({
    where: { id: request.params.id }
  });

  return response.status(204).send();
});

router.get("/vehicle-categories", async (request, response) => {
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

router.post("/vehicle-categories", async (request, response) => {
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

router.patch("/vehicle-categories/:id", async (request, response) => {
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

router.delete("/vehicle-categories/:id", async (request, response) => {
  await prisma.vehicleCategory.delete({
    where: { id: request.params.id }
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

const bookingStatusSchema = z.object({
  status: z.string().min(1)
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
  bookingRequestId: z.string().optional().nullable(),
  title: z.string().min(1),
  customerName: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  tripDate: optionalDateField,
  pickupLocation: z.string().optional().nullable(),
  dropoffLocation: z.string().optional().nullable(),
  status: z.string().min(1).optional(),
  note: z.string().optional().nullable()
});

const vehicleMaintenanceSchema = z.object({
  vehicleId: z.string().min(1),
  title: z.string().min(1),
  maintenanceType: z.string().min(1),
  serviceDate: z.coerce.date(),
  nextServiceDate: optionalDateField,
  odometerKm: optionalIntField,
  cost: optionalNumberField,
  status: z.string().min(1).optional(),
  note: z.string().optional().nullable()
});

router.get("/services", async (request, response) => {
  const services = await prisma.service.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });

  return response.json(services);
});

router.post("/services", async (request, response) => {
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

router.patch("/services/:id", async (request, response) => {
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

router.delete("/services/:id", async (request, response) => {
  await prisma.service.delete({
    where: { id: request.params.id }
  });

  return response.status(204).send();
});

router.get("/vehicles", async (request, response) => {
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

router.post("/vehicles", async (request, response) => {
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

router.patch("/vehicles/:id", async (request, response) => {
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

router.delete("/vehicles/:id", async (request, response) => {
  await prisma.vehicle.delete({
    where: { id: request.params.id }
  });

  return response.status(204).send();
});

router.post(
  "/vehicles/:id/images",
  uploadVehicleImages.array("images", 10),
  async (request, response) => {
    const files = request.files ?? [];

    if (!files.length) {
      return response.status(400).json({ message: "No files uploaded" });
    }

    const existingCount = await prisma.vehicleImage.count({
      where: { vehicleId: request.params.id }
    });

    const createdImages = await prisma.$transaction(
      files.map((file, index) =>
        prisma.vehicleImage.create({
          data: {
            vehicleId: request.params.id,
            imageUrl: `/uploads/vehicles/${file.filename}`,
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

router.delete("/vehicle-images/:id", async (request, response) => {
  await prisma.vehicleImage.delete({
    where: { id: request.params.id }
  });

  return response.status(204).send();
});

router.patch("/vehicle-images/:id", async (request, response) => {
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

router.get("/site-settings", async (request, response) => {
  const settings = await prisma.siteSetting.findMany({
    orderBy: [{ group: "asc" }, { key: "asc" }]
  });

  return response.json(settings);
});

router.post("/site-settings", async (request, response) => {
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

router.post("/site-assets/logo", uploadBrandLogo.single("logo"), async (request, response) => {
  if (!request.file) {
    return response.status(400).json({ message: "Chưa có file logo được tải lên." });
  }

  return response.status(201).json({
    imageUrl: `/uploads/branding/${request.file.filename}`
  });
});

router.put("/site-settings/:id", async (request, response) => {
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

router.delete("/site-settings/:id", async (request, response) => {
  await prisma.siteSetting.delete({
    where: { id: request.params.id }
  });

  return response.status(204).send();
});

router.patch("/booking-requests/:id/status", async (request, response) => {
  const parsed = bookingStatusSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Invalid booking status payload",
      errors: parsed.error.flatten()
    });
  }

  const booking = await prisma.bookingRequest.update({
    where: { id: request.params.id },
    data: {
      status: parsed.data.status
    }
  });

  publishBookingEvent("booking.updated", booking);
  void sendBookingUpdatedTelegramNotification(booking).catch((error) => {
    console.error("[telegram][booking.updated]", error.message);
  });

  return response.json(booking);
});

export default router;
