const API_URL = import.meta.env.VITE_API_URL ?? "/api";
const API_BASE_URL = API_URL.replace(/\/api\/?$/, "");

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

export function resolveAssetUrl(path) {
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

export async function fetchSiteSettings() {
  const response = await fetch(`${API_URL}/site-settings`, {
    cache: "no-store",
    headers: {
      Accept: "application/json"
    }
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể tải cấu hình website.");
  }

  return data;
}

export async function fetchServices() {
  const response = await fetch(`${API_URL}/services`, {
    cache: "no-store",
    headers: {
      Accept: "application/json"
    }
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể tải dịch vụ.");
  }

  return data;
}

export async function fetchVehicleCategories() {
  const response = await fetch(`${API_URL}/vehicle-categories`, {
    cache: "no-store",
    headers: {
      Accept: "application/json"
    }
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể tải danh sách xe.");
  }

  return data;
}

export async function fetchVehicleBySlug(slug) {
  const response = await fetch(`${API_URL}/vehicles/${slug}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json"
    }
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể tải chi tiết xe.");
  }

  return data;
}

export async function fetchBookingCaptcha() {
  const response = await fetch(`${API_URL}/booking-captcha`, {
    cache: "no-store",
    headers: {
      Accept: "application/json"
    }
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message ?? "Không thể tải captcha lúc này.");
  }

  return data;
}

export async function createBookingRequest(payload) {
  const response = await fetch(`${API_URL}/booking-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);

  if (!response.ok) {
    if (data?.message === "Invalid booking payload") {
      throw new Error("Vui lòng nhập đầy đủ thông tin liên hệ hợp lệ.");
    }
    if (data?.message === "Xác thực captcha không hợp lệ. Vui lòng thử lại.") {
      throw new Error(data.message);
    }
    if (data?.message === "Xác thực chống bot không hợp lệ. Vui lòng thử lại.") {
      throw new Error(data.message);
    }

    throw new Error(data?.message ?? "Không thể gửi yêu cầu lúc này.");
  }

  return data;
}
