import { prisma } from "../config/prisma.js";

const TELEGRAM_SETTING_KEYS = [
  "site_name",
  "telegram_enabled",
  "telegram_bot_token",
  "telegram_chat_id",
  "telegram_chat_id_system",
  "telegram_chat_id_booking_created",
  "telegram_chat_id_booking_updated",
  "telegram_chat_id_booking_deleted",
  "telegram_notify_booking_created",
  "telegram_notify_booking_updated",
  "telegram_notify_booking_deleted"
];

const BOOKING_STATUS_LABELS = {
  new: "Mới",
  contacted: "Đã liên hệ",
  confirmed: "Đã chốt",
  closed: "Đã đóng"
};

const TELEGRAM_EVENT_LABELS = {
  "booking.created": "Booking mới",
  "booking.updated": "Booking cập nhật",
  "booking.deleted": "Booking bị xóa",
  "telegram.test": "Kiểm tra kết nối"
};

const TELEGRAM_UPDATE_DEBOUNCE_MS = 4000;

const deliveryQueue = [];
const pendingBookingUpdates = new Map();
let isProcessingQueue = false;

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value).toLowerCase() === "true";
}

function parseChatIds(value) {
  return [
    ...new Set(
      String(value ?? "")
        .split(/[\n,;]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  ];
}

function formatDate(value) {
  if (!value) return "Chưa cung cấp";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Chưa cung cấp";
  }

  return date.toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatValue(value, fallback = "Chưa cung cấp") {
  const normalized = String(value ?? "").trim();
  return escapeHtml(normalized || fallback);
}

function formatBookingStatus(status) {
  return BOOKING_STATUS_LABELS[status] ?? status ?? "Chưa rõ";
}

function formatRoute(booking) {
  const pickup = formatValue(booking.pickupLocation, "?");
  const dropoff = formatValue(booking.dropoffLocation, "?");
  return `${pickup} → ${dropoff}`;
}

function getShortBookingCode(bookingId) {
  return String(bookingId ?? "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 8)
    .toUpperCase();
}

function getEventLabel(eventType) {
  return TELEGRAM_EVENT_LABELS[eventType] ?? eventType;
}

function getNotificationPreference(config, eventType) {
  if (eventType === "booking.created") return config.notifyBookingCreated;
  if (eventType === "booking.updated") return config.notifyBookingUpdated;
  if (eventType === "booking.deleted") return config.notifyBookingDeleted;
  return true;
}

function resolveRecipients(config, eventType) {
  const defaultRecipients = config.defaultChatIds;

  if (eventType === "booking.created") {
    return config.bookingCreatedChatIds.length ? config.bookingCreatedChatIds : defaultRecipients;
  }

  if (eventType === "booking.updated") {
    return config.bookingUpdatedChatIds.length ? config.bookingUpdatedChatIds : defaultRecipients;
  }

  if (eventType === "booking.deleted") {
    return config.bookingDeletedChatIds.length ? config.bookingDeletedChatIds : defaultRecipients;
  }

  if (eventType === "telegram.test") {
    return config.systemChatIds.length ? config.systemChatIds : defaultRecipients;
  }

  return defaultRecipients;
}

async function loadTelegramConfig() {
  const settings = await prisma.siteSetting.findMany({
    where: {
      key: {
        in: TELEGRAM_SETTING_KEYS
      }
    }
  });

  const map = Object.fromEntries(settings.map((item) => [item.key, item.value]));

  return {
    siteName: map.site_name ?? "Nhà xe",
    enabled: parseBoolean(map.telegram_enabled, false),
    botToken: map.telegram_bot_token ?? "",
    defaultChatIds: parseChatIds(map.telegram_chat_id),
    systemChatIds: parseChatIds(map.telegram_chat_id_system),
    bookingCreatedChatIds: parseChatIds(map.telegram_chat_id_booking_created),
    bookingUpdatedChatIds: parseChatIds(map.telegram_chat_id_booking_updated),
    bookingDeletedChatIds: parseChatIds(map.telegram_chat_id_booking_deleted),
    notifyBookingCreated: parseBoolean(map.telegram_notify_booking_created, true),
    notifyBookingUpdated: parseBoolean(map.telegram_notify_booking_updated, true),
    notifyBookingDeleted: parseBoolean(map.telegram_notify_booking_deleted, false)
  };
}

async function createNotificationLog({
  eventType,
  status,
  recipient,
  message,
  errorMessage,
  bookingId
}) {
  try {
    await prisma.notificationLog.create({
      data: {
        channel: "telegram",
        eventType,
        status,
        recipient: recipient ?? null,
        message: message ?? null,
        errorMessage: errorMessage ?? null,
        bookingId: bookingId ?? null
      }
    });
  } catch (error) {
    console.error("[notification-log]", error.message);
  }
}

async function postTelegramMessage(botToken, payload) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.ok === false) {
    throw new Error(data.description ?? "Không thể gửi Telegram.");
  }

  return data;
}

function processDeliveryQueue() {
  if (isProcessingQueue) return;

  isProcessingQueue = true;

  void (async () => {
    while (deliveryQueue.length) {
      const queueItem = deliveryQueue.shift();

      if (!queueItem) continue;

      try {
        const result = await queueItem.run();
        queueItem.resolve(result);
      } catch (error) {
        queueItem.reject(error);
      }
    }

    isProcessingQueue = false;
  })();
}

function enqueueTelegramJob(run) {
  return new Promise((resolve, reject) => {
    deliveryQueue.push({ run, resolve, reject });
    processDeliveryQueue();
  });
}

async function sendConfiguredTelegramMessage(
  message,
  { bypassEnabled = false, eventType = "telegram.manual", bookingId = null } = {}
) {
  return enqueueTelegramJob(async () => {
    const config = await loadTelegramConfig();
    const recipients = resolveRecipients(config, eventType);
    const shouldNotify = getNotificationPreference(config, eventType);

    if (!bypassEnabled && !config.enabled) {
      await createNotificationLog({
        eventType,
        status: "skipped",
        recipient: recipients.join(", "),
        message,
        errorMessage: "Telegram đang tắt.",
        bookingId
      });
      return { skipped: true, reason: "disabled", sentCount: 0, recipientCount: recipients.length, failedRecipients: [] };
    }

    if (!bypassEnabled && !shouldNotify) {
      await createNotificationLog({
        eventType,
        status: "skipped",
        recipient: recipients.join(", "),
        message,
        errorMessage: "Loại thông báo này đang tắt.",
        bookingId
      });
      return { skipped: true, reason: "event-disabled", sentCount: 0, recipientCount: recipients.length, failedRecipients: [] };
    }

    if (!config.botToken || !recipients.length) {
      const errorMessage = "Thiếu Telegram bot token hoặc chat ID nhận thông báo.";
      await createNotificationLog({
        eventType,
        status: "failed",
        recipient: recipients.join(", "),
        message,
        errorMessage,
        bookingId
      });
      throw new Error(errorMessage);
    }

    const failedRecipients = [];
    let sentCount = 0;

    for (const chatId of recipients) {
      try {
        await postTelegramMessage(config.botToken, {
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
          disable_web_page_preview: true
        });

        sentCount += 1;
        await createNotificationLog({
          eventType,
          status: "sent",
          recipient: chatId,
          message,
          bookingId
        });
      } catch (error) {
        failedRecipients.push({
          chatId,
          errorMessage: error.message
        });

        await createNotificationLog({
          eventType,
          status: "failed",
          recipient: chatId,
          message,
          errorMessage: error.message,
          bookingId
        });
      }
    }

    if (!sentCount) {
      throw new Error(
        failedRecipients[0]?.errorMessage ?? "Không thể gửi Telegram tới các chat đã cấu hình."
      );
    }

    return {
      skipped: false,
      sentCount,
      recipientCount: recipients.length,
      failedRecipients
    };
  });
}

function buildMessageHeader(siteName, title, bookingId) {
  const header = [
    `<b>${escapeHtml(siteName)}</b>`,
    `<b>${escapeHtml(title)}</b>`
  ];

  if (bookingId) {
    header.push(`<b>Mã booking:</b> #${escapeHtml(getShortBookingCode(bookingId))}`);
  }

  return header.join("\n");
}

function buildBookingCreatedMessage(booking, config) {
  return [
    buildMessageHeader(config.siteName, "Có booking mới", booking.id),
    "",
    `<b>Khách hàng:</b> ${formatValue(booking.customerName, "Không rõ")}`,
    `<b>Số điện thoại:</b> ${formatValue(booking.phoneNumber, "Không rõ")}`,
    `<b>Lộ trình:</b> ${formatRoute(booking)}`,
    `<b>Ngày đi:</b> ${escapeHtml(formatDate(booking.tripDate))}`,
    `<b>Số người:</b> ${formatValue(booking.passengerCount, "Chưa cung cấp")}`,
    `<b>Ghi chú:</b> ${formatValue(booking.note, "Không có")}`,
    `<b>Thời gian tạo:</b> ${escapeHtml(formatDate(booking.createdAt))}`
  ].join("\n");
}

function buildBookingUpdatedMessage(booking, config) {
  return [
    buildMessageHeader(config.siteName, "Booking đã cập nhật", booking.id),
    "",
    `<b>Khách hàng:</b> ${formatValue(booking.customerName, "Không rõ")}`,
    `<b>Số điện thoại:</b> ${formatValue(booking.phoneNumber, "Không rõ")}`,
    `<b>Trạng thái:</b> ${escapeHtml(formatBookingStatus(booking.status))}`,
    `<b>Lộ trình:</b> ${formatRoute(booking)}`,
    `<b>Ngày đi:</b> ${escapeHtml(formatDate(booking.tripDate))}`,
    `<b>Cập nhật lúc:</b> ${escapeHtml(formatDate(booking.updatedAt ?? new Date()))}`
  ].join("\n");
}

function buildBookingDeletedMessage(booking, config) {
  return [
    buildMessageHeader(config.siteName, "Booking đã bị xóa", booking.id),
    "",
    `<b>Khách hàng:</b> ${formatValue(booking.customerName, "Không rõ")}`,
    `<b>Số điện thoại:</b> ${formatValue(booking.phoneNumber, "Không rõ")}`,
    `<b>Lộ trình:</b> ${formatRoute(booking)}`,
    `<b>Ngày đi:</b> ${escapeHtml(formatDate(booking.tripDate))}`,
    `<b>Trạng thái trước khi xóa:</b> ${escapeHtml(formatBookingStatus(booking.status))}`,
    `<b>Thời gian xóa:</b> ${escapeHtml(formatDate(new Date()))}`
  ].join("\n");
}

export function describeNotificationEvent(eventType) {
  return getEventLabel(eventType);
}

export async function fetchRecentTelegramLogs({ limit = 30, status, eventType } = {}) {
  return prisma.notificationLog.findMany({
    where: {
      channel: "telegram",
      ...(status && status !== "all" ? { status } : {}),
      ...(eventType && eventType !== "all" ? { eventType } : {})
    },
    include: {
      booking: {
        select: {
          id: true,
          customerName: true,
          phoneNumber: true,
          status: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: Math.min(Math.max(Number(limit) || 30, 1), 100)
  });
}

export async function sendBookingCreatedTelegramNotification(booking) {
  const config = await loadTelegramConfig();
  const message = buildBookingCreatedMessage(booking, config);

  return sendConfiguredTelegramMessage(message, {
    eventType: "booking.created",
    bookingId: booking.id
  });
}

export function sendBookingUpdatedTelegramNotification(booking) {
  const existing = pendingBookingUpdates.get(booking.id);

  if (existing) {
    clearTimeout(existing.timeoutId);
    existing.resolve({
      skipped: true,
      reason: "replaced-by-newer-update",
      sentCount: 0,
      recipientCount: 0,
      failedRecipients: []
    });
  }

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(async () => {
      pendingBookingUpdates.delete(booking.id);

      try {
        const config = await loadTelegramConfig();
        const message = buildBookingUpdatedMessage(booking, config);
        const result = await sendConfiguredTelegramMessage(message, {
          eventType: "booking.updated",
          bookingId: booking.id
        });
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }, TELEGRAM_UPDATE_DEBOUNCE_MS);

    pendingBookingUpdates.set(booking.id, {
      timeoutId,
      status: booking.status,
      resolve
    });
  });
}

export async function sendBookingDeletedTelegramNotification(booking) {
  const pending = pendingBookingUpdates.get(booking.id);

  if (pending) {
    clearTimeout(pending.timeoutId);
    pendingBookingUpdates.delete(booking.id);
  }

  const config = await loadTelegramConfig();
  const message = buildBookingDeletedMessage(booking, config);

  return sendConfiguredTelegramMessage(message, {
    eventType: "booking.deleted",
    bookingId: booking.id
  });
}

export async function sendTelegramTestMessage() {
  const config = await loadTelegramConfig();
  const message = [
    buildMessageHeader(config.siteName, "Kiểm tra kết nối Telegram"),
    "",
    "Kênh thông báo booking đang hoạt động bình thường.",
    `<b>Nhóm nhận:</b> ${escapeHtml(resolveRecipients(config, "telegram.test").join(", ") || "Chưa cấu hình")}`,
    `<b>Thời gian:</b> ${escapeHtml(formatDate(new Date()))}`
  ].join("\n");

  return sendConfiguredTelegramMessage(message, {
    bypassEnabled: true,
    eventType: "telegram.test"
  });
}
