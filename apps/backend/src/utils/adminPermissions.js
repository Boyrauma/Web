export const ALL_ADMIN_PERMISSIONS = [
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
];

export const ROLE_DEFAULT_PERMISSIONS = {
  super_admin: [...ALL_ADMIN_PERMISSIONS],
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

export function normalizeAdminPermissions(permissions = []) {
  if (!Array.isArray(permissions)) {
    return [];
  }

  return [...new Set(permissions.filter((permission) => ALL_ADMIN_PERMISSIONS.includes(permission)))];
}

export function resolveAdminPermissions(role, permissions = []) {
  if (role === "super_admin") {
    return [...ALL_ADMIN_PERMISSIONS];
  }

  const normalized = normalizeAdminPermissions(permissions);

  if (normalized.length) {
    return normalized;
  }

  return [...(ROLE_DEFAULT_PERMISSIONS[role] ?? [])];
}

export function adminHasPermission(admin, permission) {
  const effectivePermissions = resolveAdminPermissions(admin?.role, admin?.permissions);
  return effectivePermissions.includes(permission);
}
