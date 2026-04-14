const API_URL = import.meta.env.VITE_API_URL ?? "/api";
const TOKEN_KEY = "dinhdung_admin_token";
const API_BASE_URL = API_URL.replace(/\/api\/?$/, "");

function withSessionCredentials(options = {}) {
  return {
    credentials: "include",
    ...options
  };
}

async function apiFetch(input, init = {}) {
  const headers = new Headers(init.headers ?? {});
  headers.delete("Authorization");
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  return window.fetch(input, {
    ...init,
    cache: "no-store",
    credentials: "include",
    headers
  });
}

async function readJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("API trả về dữ liệu không hợp lệ. Hãy kiểm tra lại cấu hình /api và reverse proxy.");
  }
}

export function resolveAdminAssetUrl(path) {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//.test(path)) {
    return path;
  }

  if (path.startsWith("/")) {
    return path;
  }

  return `${API_BASE_URL}${path}`;
}

export async function sendTelegramTest(token) {
  const response = await apiFetch(`${API_URL}/admin/notifications/telegram/test`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể gửi test Telegram");
  }

  return data;
}

export async function uploadSiteLogo(token, file) {
  const formData = new FormData();
  formData.append("logo", file);

  const response = await apiFetch(`${API_URL}/admin/site-assets/logo`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể tải logo lên");
  }

  return data;
}

export async function fetchNotificationLogs(
  token,
  { eventType = "all", status = "all", limit = 30 } = {}
) {
  const searchParams = new URLSearchParams();

  if (eventType && eventType !== "all") {
    searchParams.set("eventType", eventType);
  }

  if (status && status !== "all") {
    searchParams.set("status", status);
  }

  searchParams.set("limit", String(limit));

  const response = await apiFetch(`${API_URL}/admin/notifications/logs?${searchParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể tải nhật ký Telegram");
  }

  return data;
}

export function getStoredToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  return null;
}

export function storeToken(token) {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export async function loginAdmin(payload) {
  const response = await apiFetch(`${API_URL}/auth/login`, withSessionCredentials({
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  }));
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Đăng nhập thất bại");
  }

  return data;
}

export async function fetchCurrentAdminSession() {
  const response = await apiFetch(`${API_URL}/auth/me`, withSessionCredentials());
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể khôi phục phiên đăng nhập");
  }

  return data;
}

export async function logoutAdmin() {
  const response = await apiFetch(`${API_URL}/auth/logout`, withSessionCredentials({
    method: "POST"
  }));

  if (!response.ok) {
    const data = await readJsonResponse(response);
    throw new Error(data?.message ?? "Không thể đăng xuất");
  }
}

export async function changeAdminPassword(token, payload) {
  const response = await apiFetch(`${API_URL}/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể đổi mật khẩu");
  }

  return data;
}

export async function fetchAdminDashboard(token) {
  const response = await apiFetch(`${API_URL}/admin/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể tải dashboard");
  }

  return data;
}

export async function fetchAdminBookings(token) {
  const response = await apiFetch(`${API_URL}/admin/booking-requests`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể tải booking");
  }

  return data;
}

export function connectBookingStream(token, { onMessage, onError }) {
  const controller = new AbortController();
  let isClosed = false;

  const streamPromise = apiFetch(`${API_URL}/admin/booking-events`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "text/event-stream"
    },
    signal: controller.signal
  })
    .then(async (response) => {
      if (!response.ok || !response.body) {
        const data = await readJsonResponse(response);
        throw new Error(data?.message ?? "Không thể kết nối luồng booking");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      const emitEvent = (chunk) => {
        const lines = chunk.split(/\r?\n/);
        let eventName = "message";
        const dataLines = [];

        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).trimStart());
          }
        }

        if (eventName !== "booking" || !dataLines.length) {
          return;
        }

        try {
          onMessage?.(JSON.parse(dataLines.join("\n")));
        } catch (error) {
          onError?.(error);
        }
      };

      while (!isClosed) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          emitEvent(chunk);
        }
      }
    })
    .catch((error) => {
      if (!isClosed && error.name !== "AbortError") {
        onError?.(error);
      }
    });

  return () => {
    isClosed = true;
    controller.abort();
    return streamPromise;
  };
}

export async function updateBookingStatus(token, id, status) {
  const response = await apiFetch(`${API_URL}/admin/booking-requests/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể cập nhật booking");
  }

  return data;
}

export async function updateBooking(token, id, payload) {
  const response = await apiFetch(`${API_URL}/admin/booking-requests/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể cập nhật booking");
  }

  return data;
}

export async function deleteBooking(token, id) {
  const response = await apiFetch(`${API_URL}/admin/booking-requests/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const data = await readJsonResponse(response);
    throw new Error(data?.message ?? "Không thể xóa booking");
  }
}

export async function fetchScheduleNotes(token, scope = "active") {
  const searchParams = new URLSearchParams();
  searchParams.set("scope", scope);

  const response = await apiFetch(`${API_URL}/admin/schedule-notes?${searchParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể tải lịch xe");
  }

  return data;
}

export async function createScheduleNote(token, payload) {
  const response = await apiFetch(`${API_URL}/admin/schedule-notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể tạo lịch xe");
  }

  return data;
}

export async function updateScheduleNote(token, id, payload) {
  const response = await apiFetch(`${API_URL}/admin/schedule-notes/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể cập nhật lịch xe");
  }

  return data;
}

export async function deleteScheduleNote(token, id) {
  const response = await apiFetch(`${API_URL}/admin/schedule-notes/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const data = await readJsonResponse(response);
    throw new Error(data?.message ?? "Không thể xóa lịch xe");
  }
}

export async function restoreScheduleNote(token, id) {
  const response = await apiFetch(`${API_URL}/admin/schedule-notes/${id}/restore`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể khôi phục lịch xe");
  }

  return data;
}

export async function fetchVehicleTripPayments(token, scope = "active") {
  const searchParams = new URLSearchParams();
  searchParams.set("scope", scope);

  const response = await apiFetch(
    `${API_URL}/admin/vehicle-trip-payments?${searchParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể tải tiền xe");
  }

  return data;
}

export async function restoreVehicleTripPayment(token, id) {
  const response = await apiFetch(`${API_URL}/admin/vehicle-trip-payments/${id}/restore`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể khôi phục phiếu tiền xe");
  }

  return data;
}

export async function createVehicleTripPayment(token, payload) {
  const response = await apiFetch(`${API_URL}/admin/vehicle-trip-payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể tạo phiếu tiền xe");
  }

  return data;
}

export async function updateVehicleTripPayment(token, id, payload) {
  const response = await apiFetch(`${API_URL}/admin/vehicle-trip-payments/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể cập nhật phiếu tiền xe");
  }

  return data;
}

export async function deleteVehicleTripPayment(token, id) {
  const response = await apiFetch(`${API_URL}/admin/vehicle-trip-payments/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const data = await readJsonResponse(response);
    throw new Error(data?.message ?? "Không thể xóa phiếu tiền xe");
  }
}

export async function fetchVehicleMaintenances(token) {
  const response = await apiFetch(`${API_URL}/admin/vehicle-maintenances`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể tải bảo dưỡng xe");
  }

  return data;
}

export async function createVehicleMaintenance(token, payload) {
  const response = await apiFetch(`${API_URL}/admin/vehicle-maintenances`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể tạo lịch bảo dưỡng");
  }

  return data;
}

export async function updateVehicleMaintenance(token, id, payload) {
  const response = await apiFetch(`${API_URL}/admin/vehicle-maintenances/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể cập nhật bảo dưỡng");
  }

  return data;
}

export async function deleteVehicleMaintenance(token, id) {
  const response = await apiFetch(`${API_URL}/admin/vehicle-maintenances/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const data = await readJsonResponse(response);
    throw new Error(data?.message ?? "Không thể xóa bảo dưỡng");
  }
}

export async function fetchAdminServices(token) {
  const response = await apiFetch(`${API_URL}/admin/services`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể tải dịch vụ");
  }

  return data;
}

export async function createService(token, payload) {
  const response = await apiFetch(`${API_URL}/admin/services`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể tạo dịch vụ");
  }

  return data;
}

export async function updateService(token, id, payload) {
  const response = await apiFetch(`${API_URL}/admin/services/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể cập nhật dịch vụ");
  }

  return data;
}

export async function deleteService(token, id) {
  const response = await apiFetch(`${API_URL}/admin/services/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const data = await readJsonResponse(response);
    throw new Error(data?.message ?? "Không thể xóa dịch vụ");
  }
}

export async function fetchVehicleCategories(token) {
  const response = await apiFetch(`${API_URL}/admin/vehicle-categories`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể tải nhóm xe");
  }

  return data;
}

export async function createVehicleCategory(token, payload) {
  const response = await apiFetch(`${API_URL}/admin/vehicle-categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể tạo nhóm xe");
  }

  return data;
}

export async function updateVehicleCategory(token, id, payload) {
  const response = await apiFetch(`${API_URL}/admin/vehicle-categories/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể cập nhật nhóm xe");
  }

  return data;
}

export async function deleteVehicleCategory(token, id) {
  const response = await apiFetch(`${API_URL}/admin/vehicle-categories/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const data = await readJsonResponse(response);
    throw new Error(data?.message ?? "Không thể xóa nhóm xe");
  }
}

export async function fetchVehicles(token) {
  const response = await apiFetch(`${API_URL}/admin/vehicles`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể tải xe");
  }

  return data;
}

export async function createVehicle(token, payload) {
  const response = await apiFetch(`${API_URL}/admin/vehicles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể tạo xe");
  }

  return data;
}

export async function updateVehicle(token, id, payload) {
  const response = await apiFetch(`${API_URL}/admin/vehicles/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể cập nhật xe");
  }

  return data;
}

export async function deleteVehicle(token, id) {
  const response = await apiFetch(`${API_URL}/admin/vehicles/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const data = await readJsonResponse(response);
    throw new Error(data?.message ?? "Không thể xóa xe");
  }
}

export async function uploadVehicleImages(token, vehicleId, files) {
  const formData = new FormData();

  for (const file of files) {
    formData.append("images", file);
  }

  const response = await apiFetch(`${API_URL}/admin/vehicles/${vehicleId}/images`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể tải ảnh lên");
  }

  return data;
}

export async function deleteVehicleImage(token, id) {
  const response = await apiFetch(`${API_URL}/admin/vehicle-images/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const data = await readJsonResponse(response);
    throw new Error(data?.message ?? "Không thể xóa ảnh");
  }
}

export async function updateVehicleImage(token, id, payload) {
  const response = await apiFetch(`${API_URL}/admin/vehicle-images/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể cập nhật ảnh");
  }

  return data;
}

export async function fetchSiteSettings(token) {
  const response = await apiFetch(`${API_URL}/admin/site-settings`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể tải cấu hình website");
  }

  return data;
}

export async function fetchPublicSiteSettings() {
  const response = await apiFetch(`${API_URL}/site-settings`);
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể tải cấu hình public");
  }

  return data;
}

export async function updateSiteSetting(token, id, payload) {
  const response = await apiFetch(`${API_URL}/admin/site-settings/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể cập nhật cấu hình");
  }

  return data;
}

export async function createSiteSetting(token, payload) {
  const response = await apiFetch(`${API_URL}/admin/site-settings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể tạo cấu hình");
  }

  return data;
}

export async function deleteSiteSetting(token, id) {
  const response = await apiFetch(`${API_URL}/admin/site-settings/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const data = await readJsonResponse(response);
    throw new Error(data?.message ?? "Không thể xóa cấu hình");
  }
}

