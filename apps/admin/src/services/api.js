const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api";
const TOKEN_KEY = "dinhdung_admin_token";
const API_BASE_URL = API_URL.replace(/\/api\/?$/, "");

async function readJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("API tr� v� d� li�u kh�ng h�p l�. H�y ki�m tra l�i c�u h�nh /api v� reverse proxy.");
  }
}

export function resolveAdminAssetUrl(path) {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return `${API_BASE_URL}${path}`;
}

export async function sendTelegramTest(token) {
  const response = await fetch(`${API_URL}/admin/notifications/telegram/test`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Kh�ng th� g�i test Telegram");
  }

  return data;
}

export async function uploadSiteLogo(token, file) {
  const formData = new FormData();
  formData.append("logo", file);

  const response = await fetch(`${API_URL}/admin/site-assets/logo`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Kh�ng th� t�i logo l�n");
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

  const response = await fetch(`${API_URL}/admin/notifications/logs?${searchParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Kh�ng th� t�i nh�t k� Telegram");
  }

  return data;
}

export function getStoredToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export async function loginAdmin(payload) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "ng nh�p th�t b�i");
  }

  return data;
}

export async function changeAdminPassword(token, payload) {
  const response = await fetch(`${API_URL}/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Kh�ng th� �i m�t kh�u");
  }

  return data;
}

export async function fetchAdminDashboard(token) {
  const response = await fetch(`${API_URL}/admin/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Kh�ng th� t�i dashboard");
  }

  return data;
}

export async function fetchAdminBookings(token) {
  const response = await fetch(`${API_URL}/admin/booking-requests`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Kh�ng th� t�i booking");
  }

  return data;
}

export function connectBookingStream(token, { onMessage, onError }) {
  const streamUrl = `${API_URL}/admin/booking-events?token=${encodeURIComponent(token)}`;
  const eventSource = new EventSource(streamUrl);

  eventSource.addEventListener("booking", (event) => {
    try {
      const payload = JSON.parse(event.data);
      onMessage?.(payload);
    } catch (error) {
      onError?.(error);
    }
  });

  eventSource.onerror = (error) => {
    onError?.(error);
  };

  return () => {
    eventSource.close();
  };
}

export async function updateBookingStatus(token, id, status) {
  const response = await fetch(`${API_URL}/admin/booking-requests/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Kh�ng th� c�p nh�t booking");
  }

  return data;
}

export async function deleteBooking(token, id) {
  const response = await fetch(`${API_URL}/admin/booking-requests/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const data = await readJsonResponse(response);
    throw new Error(data?.message ?? "Kh�ng th� x�a booking");
  }
}

export async function fetchScheduleNotes(token) {
  const response = await fetch(`${API_URL}/admin/schedule-notes`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Kh�ng th� t�i l�ch note");
  }

  return data;
}

export async function createScheduleNote(token, payload) {
  const response = await fetch(`${API_URL}/admin/schedule-notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Kh�ng th� t�o l�ch note");
  }

  return data;
}

export async function updateScheduleNote(token, id, payload) {
  const response = await fetch(`${API_URL}/admin/schedule-notes/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Kh�ng th� c�p nh�t l�ch note");
  }

  return data;
}

export async function deleteScheduleNote(token, id) {
  const response = await fetch(`${API_URL}/admin/schedule-notes/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const data = await readJsonResponse(response);
    throw new Error(data?.message ?? "Kh�ng th� x�a l�ch note");
  }
}

export async function fetchVehicleMaintenances(token) {
  const response = await fetch(`${API_URL}/admin/vehicle-maintenances`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Kh�ng th� t�i b�o d��ng xe");
  }

  return data;
}

export async function createVehicleMaintenance(token, payload) {
  const response = await fetch(`${API_URL}/admin/vehicle-maintenances`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Kh�ng th� t�o l�ch b�o d��ng");
  }

  return data;
}

export async function updateVehicleMaintenance(token, id, payload) {
  const response = await fetch(`${API_URL}/admin/vehicle-maintenances/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Kh�ng th� c�p nh�t b�o d��ng");
  }

  return data;
}

export async function deleteVehicleMaintenance(token, id) {
  const response = await fetch(`${API_URL}/admin/vehicle-maintenances/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const data = await readJsonResponse(response);
    throw new Error(data?.message ?? "Kh�ng th� x�a b�o d��ng");
  }
}

export async function fetchAdminServices(token) {
  const response = await fetch(`${API_URL}/admin/services`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Kh�ng th� t�i d�ch v�");
  }

  return data;
}

export async function createService(token, payload) {
  const response = await fetch(`${API_URL}/admin/services`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Kh�ng th� t�o d�ch v�");
  }

  return data;
}

export async function updateService(token, id, payload) {
  const response = await fetch(`${API_URL}/admin/services/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Kh�ng th� c�p nh�t d�ch v�");
  }

  return data;
}

export async function deleteService(token, id) {
  const response = await fetch(`${API_URL}/admin/services/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const data = await readJsonResponse(response);
    throw new Error(data?.message ?? "Kh�ng th� x�a d�ch v�");
  }
}

export async function fetchVehicleCategories(token) {
  const response = await fetch(`${API_URL}/admin/vehicle-categories`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Kh�ng th� t�i nh�m xe");
  }

  return data;
}

export async function createVehicleCategory(token, payload) {
  const response = await fetch(`${API_URL}/admin/vehicle-categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Kh�ng th� t�o nh�m xe");
  }

  return data;
}

export async function updateVehicleCategory(token, id, payload) {
  const response = await fetch(`${API_URL}/admin/vehicle-categories/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Kh�ng th� c�p nh�t nh�m xe");
  }

  return data;
}

export async function deleteVehicleCategory(token, id) {
  const response = await fetch(`${API_URL}/admin/vehicle-categories/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const data = await readJsonResponse(response);
    throw new Error(data?.message ?? "Kh�ng th� x�a nh�m xe");
  }
}

export async function fetchVehicles(token) {
  const response = await fetch(`${API_URL}/admin/vehicles`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Kh�ng th� t�i xe");
  }

  return data;
}

export async function createVehicle(token, payload) {
  const response = await fetch(`${API_URL}/admin/vehicles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Kh�ng th� t�o xe");
  }

  return data;
}

export async function updateVehicle(token, id, payload) {
  const response = await fetch(`${API_URL}/admin/vehicles/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Kh�ng th� c�p nh�t xe");
  }

  return data;
}

export async function deleteVehicle(token, id) {
  const response = await fetch(`${API_URL}/admin/vehicles/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const data = await readJsonResponse(response);
    throw new Error(data?.message ?? "Kh�ng th� x�a xe");
  }
}

export async function uploadVehicleImages(token, vehicleId, files) {
  const formData = new FormData();

  for (const file of files) {
    formData.append("images", file);
  }

  const response = await fetch(`${API_URL}/admin/vehicles/${vehicleId}/images`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Kh�ng th� upload �nh");
  }

  return data;
}

export async function deleteVehicleImage(token, id) {
  const response = await fetch(`${API_URL}/admin/vehicle-images/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const data = await readJsonResponse(response);
    throw new Error(data?.message ?? "Kh�ng th� x�a �nh");
  }
}

export async function updateVehicleImage(token, id, payload) {
  const response = await fetch(`${API_URL}/admin/vehicle-images/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Kh�ng th� c�p nh�t �nh");
  }

  return data;
}

export async function fetchSiteSettings(token) {
  const response = await fetch(`${API_URL}/admin/site-settings`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Kh�ng th� t�i c�u h�nh website");
  }

  return data;
}

export async function fetchPublicSiteSettings() {
  const response = await fetch(`${API_URL}/site-settings`);
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Kh�ng th� t�i c�u h�nh public");
  }

  return data;
}

export async function updateSiteSetting(token, id, payload) {
  const response = await fetch(`${API_URL}/admin/site-settings/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Kh�ng th� c�p nh�t c�u h�nh");
  }

  return data;
}

export async function createSiteSetting(token, payload) {
  const response = await fetch(`${API_URL}/admin/site-settings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Kh�ng th� t�o c�u h�nh");
  }

  return data;
}

export async function deleteSiteSetting(token, id) {
  const response = await fetch(`${API_URL}/admin/site-settings/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const data = await readJsonResponse(response);
    throw new Error(data?.message ?? "Kh�ng th� x�a c�u h�nh");
  }
}
