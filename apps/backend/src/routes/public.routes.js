import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { createIpRateLimit } from "../middlewares/ipRateLimit.js";
import { publishBookingEvent } from "../services/bookingEvents.js";
import { sendBookingCreatedTelegramNotification } from "../services/telegramService.js";

const router = Router();
const bookingRateLimit = createIpRateLimit({
  windowMs: 60 * 1000,
  maxRequests: 100,
  message: "Bạn gửi booking quá nhanh từ cùng một IP. Vui lòng thử lại sau 1 phút."
});

const bookingSchema = z.object({
  customerName: z.string().min(2),
  phoneNumber: z.string().min(8),
  pickupLocation: z.string().min(2),
  dropoffLocation: z.string().min(2),
  tripDate: z.string().optional().nullable(),
  passengerCount: z
    .union([z.string(), z.number()])
    .optional()
    .transform((value) => {
      if (value === undefined || value === null || value === "") {
        return null;
      }

      return Number(value);
    }),
  note: z.string().optional().nullable()
});

router.get("/site-settings", async (request, response) => {
  const settings = await prisma.siteSetting.findMany({
    orderBy: { key: "asc" }
  });

  return response.json(settings);
});

router.get("/services", async (request, response) => {
  const services = await prisma.service.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });

  return response.json(services);
});

router.get("/vehicle-categories", async (request, response) => {
  const categories = await prisma.vehicleCategory.findMany({
    where: { isPublished: true },
    include: {
      vehicles: {
        where: { isPublished: true },
        include: {
          images: {
            orderBy: { sortOrder: "asc" }
          }
        },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }]
      }
    },
    orderBy: { sortOrder: "asc" }
  });

  return response.json(categories);
});

router.get("/vehicles/:slug", async (request, response) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { slug: request.params.slug },
    include: {
      category: true,
      images: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }]
      }
    }
  });

  if (!vehicle || !vehicle.isPublished) {
    return response.status(404).json({ message: "Vehicle not found" });
  }

  return response.json(vehicle);
});

router.post("/booking-requests", bookingRateLimit, async (request, response) => {
  const parsed = bookingSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Invalid booking payload",
      errors: parsed.error.flatten()
    });
  }

  const booking = await prisma.bookingRequest.create({
    data: {
      customerName: parsed.data.customerName,
      phoneNumber: parsed.data.phoneNumber,
      pickupLocation: parsed.data.pickupLocation,
      dropoffLocation: parsed.data.dropoffLocation,
      passengerCount: parsed.data.passengerCount,
      note: parsed.data.note ?? null,
      tripDate: parsed.data.tripDate ? new Date(parsed.data.tripDate) : null
    }
  });

  publishBookingEvent("booking.created", booking);
  void sendBookingCreatedTelegramNotification(booking).catch((error) => {
    console.error("[telegram][booking.created]", error.message);
  });

  return response.status(201).json(booking);
});

export default router;
