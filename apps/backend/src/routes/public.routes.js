import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { createIpRateLimit } from "../middlewares/ipRateLimit.js";
import { publishBookingEvent } from "../services/bookingEvents.js";
import { sendBookingCreatedTelegramNotification } from "../services/telegramService.js";
import { createBookingCaptchaChallenge, verifyBookingCaptcha } from "../utils/captcha.js";
import {
  validateBookingCooldown,
  validateBookingSubmissionTiming
} from "../utils/bookingProtection.js";
import {
  BOOKING_PROOF_OF_WORK_DIFFICULTY,
  verifyBookingProofOfWork
} from "../utils/proofOfWork.js";
import { verifyTurnstileToken } from "../utils/turnstile.js";

const router = Router();
const PUBLIC_SITE_SETTING_KEYS = [
  "address",
  "browser_title",
  "favicon_url",
  "footer_text",
  "hero_background_url",
  "hero_subtitle",
  "hero_title",
  "hotline",
  "logo_url",
  "site_name",
  "site_tagline",
  "zalo"
];
const captchaRateLimit = createIpRateLimit({
  windowMs: 60 * 1000,
  maxRequests: 24,
  message: "Bạn tải captcha quá nhanh. Vui lòng thử lại sau 1 phút."
});
const bookingRateLimit = createIpRateLimit({
  windowMs: 10 * 60 * 1000,
  maxRequests: 12,
  message: "Bạn gửi booking quá nhiều trong thời gian ngắn. Vui lòng thử lại sau ít phút."
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
  note: z.string().optional().nullable(),
  bookingCaptchaToken: z.string().min(1),
  bookingCaptchaAnswer: z.union([z.string(), z.number()]),
  bookingProofNonce: z.string().min(1),
  turnstileToken: z.string().optional().nullable(),
  website: z.string().optional().nullable()
});

function getRequestIp(request) {
  const forwardedFor = request.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return request.ip ?? request.socket?.remoteAddress ?? "";
}

router.get("/site-settings", async (request, response) => {
  const settings = await prisma.siteSetting.findMany({
    where: {
      key: {
        in: PUBLIC_SITE_SETTING_KEYS
      }
    },
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

router.get("/booking-captcha", captchaRateLimit, async (request, response) => {
  const challenge = createBookingCaptchaChallenge();

  return response.json({
    ...challenge,
    proofOfWork: {
      challenge: challenge.token,
      difficulty: BOOKING_PROOF_OF_WORK_DIFFICULTY
    },
    turnstile: {
      enabled: env.turnstileEnabled,
      siteKey: env.turnstileEnabled ? env.turnstileSiteKey : ""
    }
  });
});

router.post("/booking-requests", bookingRateLimit, async (request, response) => {
  const parsed = bookingSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Vui lòng nhập đầy đủ thông tin liên hệ hợp lệ.",
      errors: parsed.error.flatten()
    });
  }

  if (parsed.data.website?.trim()) {
    return response.status(400).json({
      message: "Xác thực captcha không hợp lệ. Vui lòng thử lại."
    });
  }

  const captchaResult = verifyBookingCaptcha({
    token: parsed.data.bookingCaptchaToken,
    answer: parsed.data.bookingCaptchaAnswer
  });

  if (!captchaResult.ok) {
    return response.status(400).json({
      message: "Xác thực captcha không hợp lệ. Vui lòng thử lại."
    });
  }

  const isProofValid = verifyBookingProofOfWork({
    challenge: parsed.data.bookingCaptchaToken,
    nonce: parsed.data.bookingProofNonce
  });

  if (!isProofValid) {
    return response.status(400).json({
      message: "Xác thực chống bot không hợp lệ. Vui lòng thử lại."
    });
  }

  const timingValidation = validateBookingSubmissionTiming(captchaResult.issuedAt);

  if (!timingValidation.ok) {
    return response.status(400).json({
      message: timingValidation.message
    });
  }

  const turnstileResult = await verifyTurnstileToken({
    token: parsed.data.turnstileToken,
    remoteIp: getRequestIp(request)
  });

  if (!turnstileResult.ok) {
    return response.status(turnstileResult.statusCode ?? 400).json({
      message: turnstileResult.message
    });
  }

  const cooldownValidation = validateBookingCooldown(request, parsed.data.phoneNumber);

  if (!cooldownValidation.ok) {
    if (cooldownValidation.retryAfter) {
      response.setHeader("Retry-After", String(cooldownValidation.retryAfter));
    }

    return response.status(cooldownValidation.statusCode ?? 429).json({
      message: cooldownValidation.message,
      retryAfter: cooldownValidation.retryAfter
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
