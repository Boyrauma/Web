export const ROLE_LABELS = {
  super_admin: "Super Admin",
  operator: "Điều hành",
  accountant: "Kế toán",
  content_editor: "Biên tập nội dung"
};

export const ROLE_OPTIONS = [
  { value: "all", label: "Tất cả vai trò" },
  { value: "super_admin", label: ROLE_LABELS.super_admin },
  { value: "operator", label: ROLE_LABELS.operator },
  { value: "accountant", label: ROLE_LABELS.accountant },
  { value: "content_editor", label: ROLE_LABELS.content_editor }
];

export const ROLE_DEFAULT_PERMISSIONS = {
  super_admin: [
    "dashboard.view",
    "admin_users.manage",
    "activity_logs.view",
    "reports.view",
    "vehicle_categories.manage",
    "vehicles.manage",
    "drivers.manage",
    "customers.manage",
    "trips.manage",
    "dispatch.view",
    "finance.manage",
    "reminders.manage",
    "schedule_notes.manage",
    "payments.manage",
    "data_archive.view",
    "maintenances.manage",
    "bookings.manage",
    "services.manage",
    "settings.manage",
    "notifications.manage"
  ],
  operator: [
    "dashboard.view",
    "vehicles.manage",
    "drivers.manage",
    "customers.manage",
    "trips.manage",
    "dispatch.view",
    "finance.manage",
    "reminders.manage",
    "schedule_notes.manage",
    "payments.manage",
    "data_archive.view",
    "maintenances.manage",
    "bookings.manage"
  ],
  accountant: [
    "dashboard.view",
    "reports.view",
    "finance.manage",
    "payments.manage",
    "data_archive.view"
  ],
  content_editor: [
    "dashboard.view",
    "vehicle_categories.manage",
    "vehicles.manage",
    "services.manage",
    "settings.manage"
  ]
};

export const PERMISSION_GROUPS = [
  {
    label: "Tổng quan và quản trị",
    items: [
      { value: "dashboard.view", label: "Xem dashboard" },
      { value: "admin_users.manage", label: "Quản lý tài khoản admin" },
      { value: "activity_logs.view", label: "Xem nhật ký thao tác" },
      { value: "notifications.manage", label: "Xem và test thông báo" },
      { value: "reports.view", label: "Xem báo cáo tháng" }
    ]
  },
  {
    label: "Điều hành",
    items: [
      { value: "bookings.manage", label: "Quản lý booking" },
      { value: "customers.manage", label: "Quản lý khách hàng" },
      { value: "drivers.manage", label: "Quản lý tài xế" },
      { value: "trips.manage", label: "Quản lý chuyến đi" },
      { value: "dispatch.view", label: "Xem điều phối hôm nay" },
      { value: "finance.manage", label: "Quản lý chi phí và lợi nhuận" },
      { value: "reminders.manage", label: "Quản lý nhắc việc" },
      { value: "schedule_notes.manage", label: "Quản lý lịch xe" },
      { value: "payments.manage", label: "Quản lý tiền xe" },
      { value: "maintenances.manage", label: "Quản lý bảo dưỡng xe" },
      { value: "data_archive.view", label: "Xem dữ liệu lưu trữ" }
    ]
  },
  {
    label: "Nội dung và đội xe",
    items: [
      { value: "vehicle_categories.manage", label: "Quản lý nhóm xe" },
      { value: "vehicles.manage", label: "Quản lý xe và ảnh xe" },
      { value: "services.manage", label: "Quản lý dịch vụ" },
      { value: "settings.manage", label: "Quản lý nội dung web" }
    ]
  }
];

export const TAB_PERMISSION_MAP = {
  dashboard: "dashboard.view",
  "admin-users": "admin_users.manage",
  "activity-logs": "activity_logs.view",
  "monthly-reports": "reports.view",
  "vehicle-categories": "vehicle_categories.manage",
  vehicles: "vehicles.manage",
  drivers: "drivers.manage",
  customers: "customers.manage",
  trips: "trips.manage",
  "dispatch-today": "dispatch.view",
  "dispatch-calendar": "dispatch.view",
  finance: "finance.manage",
  reminders: "reminders.manage",
  "schedule-notes": "schedule_notes.manage",
  "vehicle-trip-payments": "payments.manage",
  "data-archive": "data_archive.view",
  "vehicle-maintenances": "maintenances.manage",
  bookings: "bookings.manage",
  services: "services.manage",
  settings: "settings.manage"
};

export function normalizePermissions(permissions = []) {
  return [...new Set(Array.isArray(permissions) ? permissions.filter(Boolean) : [])];
}

export function resolvePermissions(role, permissions = []) {
  if (role === "super_admin") {
    return [...(ROLE_DEFAULT_PERMISSIONS.super_admin ?? [])];
  }

  const normalized = normalizePermissions(permissions);
  return normalized.length ? normalized : [...(ROLE_DEFAULT_PERMISSIONS[role] ?? [])];
}

export function adminHasPermission(admin, permission) {
  return resolvePermissions(admin?.role, admin?.permissions).includes(permission);
}

export function getAllowedTabIds(admin, tabs) {
  const permissions = resolvePermissions(admin?.role, admin?.permissions);
  return tabs
    .filter((tab) => {
      const requiredPermission = TAB_PERMISSION_MAP[tab.id];
      return !requiredPermission || permissions.includes(requiredPermission);
    })
    .map((tab) => tab.id);
}
