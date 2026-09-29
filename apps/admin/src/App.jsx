import { useEffect, useMemo, useState } from "react";
import { useRef } from "react";
import BookingsTab from "./components/BookingsTab";
import ConfirmDialog from "./components/ConfirmDialog";
import CustomersTab from "./components/CustomersTab";
import DataArchiveTab from "./components/DataArchiveTab";
import DispatchCalendarTab from "./components/DispatchCalendarTab";
import DispatchVoucherModal from "./components/DispatchVoucherModal";
import DashboardTab from "./components/DashboardTab";
import DispatchTodayTab from "./components/DispatchTodayTab";
import DriversTab from "./components/DriversTab";
import FinanceOverviewTab, { toExpenseDateInputValue } from "./components/FinanceOverviewTab";
import LoginView from "./components/LoginView";
import MonthlyReportsTab from "./components/MonthlyReportsTab";
import AdminUsersTab from "./components/AdminUsersTab";
import RemindersTab from "./components/RemindersTab";
import ScheduleNotesManager from "./components/ScheduleNotesManager";
import ServicesTab from "./components/ServicesTab";
import SettingsTab from "./components/SettingsTab";
import TripsTab from "./components/TripsTab";
import VehicleCategoriesTab from "./components/VehicleCategoriesTab";
import VehicleMaintenancesTab from "./components/VehicleMaintenancesTab";
import VehicleTripPaymentsTab from "./components/VehicleTripPaymentsTab";
import VehiclesTab from "./components/VehiclesTab";
import {
  changeAdminPassword,
  clearToken,
  connectBookingStream,
  createAdminUser,
  createCustomer,
  createReminder,
  createScheduleNote,
  createSiteSetting,
  createDriver,
  createTrip,
  createTripExpense,
  createVehicleMaintenance,
  createVehicleTripPayment,
  createVehicleCategory,
  createService,
  createVehicle,
  deleteBooking,
  deleteAdminUser,
  deleteCustomer,
  deleteDriver,
  deleteReminder,
  deleteTrip,
  deleteTripExpense,
  deleteScheduleNote,
  deleteSiteSetting,
  deleteVehicleMaintenance,
  deleteVehicleTripPayment,
  deleteVehicleCategory,
  deleteService,
  deleteVehicle,
  deleteVehicleImage,
  fetchAdminBookings,
  fetchAdminBookingPage,
  fetchDashboardBookingHighlights,
  fetchDashboardTripHighlights,
  fetchAdminDashboard,
  fetchActivityLogs,
  fetchAdminUsers,
  fetchCurrentAdminSession,
  fetchCustomers,
  fetchCustomersPage,
  fetchDrivers,
  fetchReminders,
  fetchTrips,
  fetchTripsPage,
  fetchTripExpenses,
  fetchScheduleNotes,
  fetchVehicleTripPayments,
  fetchNotificationLogs,
  fetchAdminServices,
  fetchPublicSiteSettings,
  fetchSiteSettings,
  fetchVehicleMaintenances,
  fetchVehicleCategories,
  fetchVehicles,
  getStoredToken,
  loginAdmin,
  logoutAdmin,
  resolveAdminAssetUrl,
  sendTelegramTest,
  storeToken,
  processDueReminders,
  updateAdminUser,
  updateBooking,
  updateBookingStatus,
  updateCustomer,
  updateDriver,
  updateReminder,
  updateReminderStatus,
  updateTrip,
  updateTripExpense,
  updateScheduleNote,
  updateVehicleCategory,
  updateVehicleMaintenance,
  updateVehicleTripPayment,
  updateService,
  updateSiteSetting,
  uploadSiteLogo,
  uploadHeroBackground,
  updateVehicle,
  updateVehicleImage,
  uploadVehicleImages
} from "./services/api";
import { applyDocumentBranding } from "./utils/branding";
import {
  ROLE_DEFAULT_PERMISSIONS,
  ROLE_LABELS,
  adminHasPermission,
  getAllowedTabIds
} from "./utils/adminPermissions";
import { slugify } from "./utils/slugify";
import ActivityLogsTab from "./components/ActivityLogsTab";

const tabs = [
  { id: "dashboard", label: "Tổng quan" },
  { id: "bookings", label: "Đơn đặt xe" },
  { id: "dispatch-today", label: "Điều phối hôm nay" },
  { id: "schedule-notes", label: "Lịch xe" },
  { id: "dispatch-calendar", label: "Lịch điều phối" },
  { id: "trips", label: "Chuyến đi" },
  { id: "vehicle-trip-payments", label: "Thu tiền chuyến" },
  { id: "finance", label: "Chi phí & lợi nhuận" },
  { id: "monthly-reports", label: "Báo cáo tháng" },
  { id: "customers", label: "Khách hàng" },
  { id: "vehicles", label: "Xe" },
  { id: "drivers", label: "Tài xế" },
  { id: "vehicle-categories", label: "Nhóm xe" },
  { id: "vehicle-maintenances", label: "Bảo dưỡng xe" },
  { id: "services", label: "Dịch vụ" },
  { id: "settings", label: "Nội dung web" },
  { id: "reminders", label: "Nhắc việc" },
  { id: "data-archive", label: "Lưu trữ" },
  { id: "admin-users", label: "Tài khoản admin" },
  { id: "activity-logs", label: "Nhật ký thao tác" }
];

const tabSections = [
  {
    label: "Tổng quan",
    tabIds: ["dashboard"]
  },
  {
    label: "Đơn & điều hành",
    tabIds: [
      "bookings",
      "dispatch-today",
      "schedule-notes",
      "dispatch-calendar",
      "trips"
    ]
  },
  {
    label: "Tài chính",
    tabIds: ["vehicle-trip-payments", "finance", "monthly-reports"]
  },
  {
    label: "Khách & đội xe",
    tabIds: ["customers", "vehicles", "drivers", "vehicle-categories", "vehicle-maintenances"]
  },
  {
    label: "Website",
    tabIds: ["services", "settings"]
  },
  {
    label: "Hệ thống",
    tabIds: ["reminders", "data-archive", "admin-users", "activity-logs"]
  }
];

const serviceFormInitial = {
  title: "",
  description: "",
  icon: "",
  sortOrder: 0,
  isPublished: true
};

const vehicleFormInitial = {
  categoryId: "",
  name: "",
  seatCount: 7,
  shortDescription: "",
  description: "",
  features: "",
  isFeatured: false,
  isPublished: true
};

const driverFormInitial = {
  fullName: "",
  phoneNumber: "",
  status: "available",
  note: "",
  isActive: true
};

const customerFormInitial = {
  fullName: "",
  phoneNumber: "",
  status: "regular",
  note: ""
};

const adminUserFormInitial = {
  fullName: "",
  email: "",
  role: "operator",
  password: "",
  permissions: [...ROLE_DEFAULT_PERMISSIONS.operator],
  isActive: true
};

const tripFormInitial = {
  title: "",
  tripDate: "",
  pickupLocation: "",
  dropoffLocation: "",
  vehicleId: "",
  driverId: "",
  status: "draft",
  note: "",
  bookingIds: []
};

const tripExpenseFormInitial = {
  tripId: "",
  bookingRequestId: "",
  vehicleId: "",
  title: "",
  expenseType: "fuel",
  amount: "",
  expenseDate: "",
  paidBy: "",
  note: ""
};

const reminderFormInitial = {
  title: "",
  reminderType: "manual",
  remindAt: "",
  targetType: "",
  targetId: "",
  bookingRequestId: "",
  scheduleNoteId: "",
  tripId: "",
  vehicleId: "",
  driverId: "",
  status: "pending",
  note: ""
};

const categoryFormInitial = {
  name: "",
  description: "",
  sortOrder: 0,
  isPublished: true
};

const settingFormInitial = {
  key: "",
  value: "",
  group: "branding"
};

const scheduleNoteFormInitial = {
  vehicleId: "",
  bookingRequestId: "",
  title: "",
  customerName: "",
  phoneNumber: "",
  tripDate: "",
  pickupLocation: "",
  dropoffLocation: "",
  status: "scheduled",
  note: ""
};

const maintenanceFormInitial = {
  vehicleId: "",
  title: "",
  maintenanceType: "oil_change",
  licensePlate: "",
  serviceDate: "",
  nextServiceDate: "",
  odometerKm: "",
  cost: "",
  note: ""
};

const tripPaymentFormInitial = {
  scheduleNoteId: "",
  bookingRequestId: "",
  vehicleId: "",
  title: "",
  customerName: "",
  phoneNumber: "",
  tripDate: "",
  pickupLocation: "",
  dropoffLocation: "",
  amount: "",
  paymentStatus: "unpaid",
  note: ""
};
const SESSION_TOKEN = "__session__";
const BOOKING_SCHEDULE_STEP_STATUSES = new Set(["confirmed", "assigned", "scheduled"]);
function isBookingInScheduleStep(status) {
  return BOOKING_SCHEDULE_STEP_STATUSES.has(status);
}

function isFinishedTripPayment(payment) {
  return payment.paymentStatus === "paid" || Boolean(payment.archivedAt);
}

function getTabDescription(tabId) {
  if (tabId === "dashboard") return "Việc cần xử lý và tình hình vận hành hôm nay.";
  if (tabId === "admin-users") return "Tạo tài khoản, gán vai trò và khóa quyền truy cập.";
  if (tabId === "activity-logs") return "Theo dõi tạo, sửa, xóa và đổi trạng thái trong admin.";
  if (tabId === "monthly-reports") return "Biểu đồ tổng hợp công việc theo tháng.";
  if (tabId === "vehicle-categories") return "Phân loại đội xe.";
  if (tabId === "vehicles") return "Quản lý xe và ảnh.";
  if (tabId === "drivers") return "Quản lý tài xế và trạng thái làm việc.";
  if (tabId === "customers") return "Hồ sơ khách, ghi chú và lịch sử đặt xe.";
  if (tabId === "trips") return "Tạo chuyến và gom nhiều booking vào cùng một lịch chạy.";
  if (tabId === "dispatch-today") return "Theo dõi booking trong ngày và phân công nhanh.";
  if (tabId === "dispatch-calendar") return "Xem lịch xe, tài xế và chuyến theo ngày hoặc tuần.";
  if (tabId === "finance") return "Theo dõi doanh thu, chi phí và lợi nhuận tạm tính.";
  if (tabId === "reminders") return "Tạo và theo dõi nhắc việc tự động qua Telegram.";
  if (tabId === "schedule-notes") return "Booking đã xác nhận chờ xếp lịch; từ đây có thể tạo chuyến mà không nhập lại thông tin.";
  if (tabId === "vehicle-trip-payments") return "Ghi nhận khoản thu của chuyến và theo dõi tình trạng thanh toán.";
  if (tabId === "data-archive") return "Lưu trữ chuyến đã hoàn tất để tra cứu theo ngày, xe hoặc khách.";
  if (tabId === "vehicle-maintenances") return "Nhật ký thay dầu, bảo dưỡng.";
  if (tabId === "bookings") return "Tiếp nhận yêu cầu, liên hệ khách và xác nhận trước khi xếp lịch.";
  if (tabId === "services") return "Nội dung dịch vụ public.";
  if (tabId === "settings") return "Branding và nội dung web.";
  return "";
}


function sortBookingsByCreatedAt(items) {
  return [...items].sort(
    (left, right) => new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime()
  );
}

function toDateTimeLocalValue(value) {
  if (!value) return "";

  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toIsoDateTimeLocalValue(value) {
  if (!value) return "";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function toDateInputValue(value) {
  if (!value) return "";

  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDayKey(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLocalDayRange(dayKey) {
  if (!dayKey) return {};
  const start = new Date(`${dayKey}T00:00:00`);
  if (Number.isNaN(start.getTime())) return {};
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { dateStart: start.toISOString(), dateEnd: end.toISOString() };
}

function getDashboardBookingRange() {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const calendarStart = new Date(firstOfMonth);
  calendarStart.setDate(firstOfMonth.getDate() - ((firstOfMonth.getDay() + 6) % 7));
  calendarStart.setHours(0, 0, 0, 0);
  const calendarEnd = new Date(calendarStart);
  calendarEnd.setDate(calendarStart.getDate() + 42);
  return { dateStart: calendarStart.toISOString(), dateEnd: calendarEnd.toISOString() };
}

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [token, setToken] = useState(() => getStoredToken());
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });
  const [authState, setAuthState] = useState({ loading: false, error: "" });
  const [pageError, setPageError] = useState("");
  const [loadingTab, setLoadingTab] = useState("");
  const loadedTabIdsRef = useRef(new Set());
  const tabLoadRequestRef = useRef(0);
  const [dashboard, setDashboard] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [bookingQuery, setBookingQuery] = useState({
    search: "",
    sort: "newest",
    assignment: "all",
    tripDate: "",
    page: 1
  });
  const [bookingPageData, setBookingPageData] = useState({ items: [], total: 0, allTotal: 0, assignedCount: 0, pendingCount: 0, page: 1, pageSize: 10, totalPages: 1 });
  const [bookingPageLoading, setBookingPageLoading] = useState(false);
  const [bookingPageRevision, setBookingPageRevision] = useState(0);
  const [scheduleNotes, setScheduleNotes] = useState([]);
  const [archivedScheduleNotes, setArchivedScheduleNotes] = useState([]);
  const [vehicleTripPayments, setVehicleTripPayments] = useState([]);
  const [archivedVehicleTripPayments, setArchivedVehicleTripPayments] = useState([]);
  const [tripExpenses, setTripExpenses] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [vehicleMaintenances, setVehicleMaintenances] = useState([]);
  const [services, setServices] = useState([]);
  const [vehicleCategories, setVehicleCategories] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerQuery, setCustomerQuery] = useState({ search: "", status: "all", page: 1 });
  const [customerPageData, setCustomerPageData] = useState({ items: [], total: 0, allTotal: 0, vipCount: 0, repeatCount: 0, watchCount: 0, page: 1, pageSize: 10, totalPages: 1 });
  const [customerPageLoading, setCustomerPageLoading] = useState(false);
  const [customerPageRevision, setCustomerPageRevision] = useState(0);
  const [trips, setTrips] = useState([]);
  const [tripQuery, setTripQuery] = useState({ search: "", status: "all", tripDate: "", page: 1 });
  const [tripPageData, setTripPageData] = useState({ items: [], total: 0, allTotal: 0, page: 1, pageSize: 10, totalPages: 1 });
  const [tripPageLoading, setTripPageLoading] = useState(false);
  const [tripPageRevision, setTripPageRevision] = useState(0);
  const [siteSettings, setSiteSettings] = useState([]);
  const [notificationLogs, setNotificationLogs] = useState([]);
  const [vehicleFilterCategoryId, setVehicleFilterCategoryId] = useState("all");
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [vehicleImageUploadType, setVehicleImageUploadType] = useState("exterior");
  const [vehicleImageFilter, setVehicleImageFilter] = useState("all");
  const [settingForm, setSettingForm] = useState(settingFormInitial);
  const [scheduleNoteForm, setScheduleNoteForm] = useState(scheduleNoteFormInitial);
  const [editingScheduleNoteId, setEditingScheduleNoteId] = useState("");
  const [tripPaymentForm, setTripPaymentForm] = useState(tripPaymentFormInitial);
  const [editingTripPaymentId, setEditingTripPaymentId] = useState("");
  const [maintenanceForm, setMaintenanceForm] = useState(maintenanceFormInitial);
  const [editingMaintenanceId, setEditingMaintenanceId] = useState("");
  const [categoryForm, setCategoryForm] = useState(categoryFormInitial);
  const [editingCategoryId, setEditingCategoryId] = useState("");
  const [serviceForm, setServiceForm] = useState(serviceFormInitial);
  const [editingServiceId, setEditingServiceId] = useState("");
  const [vehicleForm, setVehicleForm] = useState(vehicleFormInitial);
  const [editingVehicleId, setEditingVehicleId] = useState("");
  const [driverForm, setDriverForm] = useState(driverFormInitial);
  const [editingDriverId, setEditingDriverId] = useState("");
  const [customerForm, setCustomerForm] = useState(customerFormInitial);
  const [editingCustomerId, setEditingCustomerId] = useState("");
  const [adminUserForm, setAdminUserForm] = useState(adminUserFormInitial);
  const [editingAdminUserId, setEditingAdminUserId] = useState("");
  const [tripForm, setTripForm] = useState(tripFormInitial);
  const [editingTripId, setEditingTripId] = useState("");
  const [tripExpenseForm, setTripExpenseForm] = useState(tripExpenseFormInitial);
  const [editingTripExpenseId, setEditingTripExpenseId] = useState("");
  const [reminderForm, setReminderForm] = useState(reminderFormInitial);
  const [editingReminderId, setEditingReminderId] = useState("");
  const [savingService, setSavingService] = useState(false);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [savingDriver, setSavingDriver] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [savingAdminUser, setSavingAdminUser] = useState(false);
  const [savingTrip, setSavingTrip] = useState(false);
  const [savingTripExpense, setSavingTripExpense] = useState(false);
  const [savingReminder, setSavingReminder] = useState(false);
  const [processingReminders, setProcessingReminders] = useState(false);
  const [dispatchVoucher, setDispatchVoucher] = useState(null);
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingScheduleNote, setSavingScheduleNote] = useState(false);
  const [savingTripPayment, setSavingTripPayment] = useState(false);
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [savingSettingId, setSavingSettingId] = useState("");
  const [savingNewSetting, setSavingNewSetting] = useState(false);
  const [savingTelegramSettings, setSavingTelegramSettings] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHeroBackground, setUploadingHeroBackground] = useState(false);
  const [uploadingVehicleId, setUploadingVehicleId] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordState, setPasswordState] = useState({
    open: false,
    loading: false,
    error: "",
    message: ""
  });
  const [toasts, setToasts] = useState([]);
  const [highlightedBookingIds, setHighlightedBookingIds] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  async function loadAdminTabData(tabId, { force = false } = {}) {
    if (!token || (!force && loadedTabIdsRef.current.has(tabId))) return;

    const requestId = ++tabLoadRequestRef.current;
    setLoadingTab(tabId);
    setPageError("");
    const allowed = (permission) => adminHasPermission(currentAdmin, permission);

    try {
      switch (tabId) {
        case "dashboard": {
          const [dashboardData, bookingData, noteData, paymentData, reminderData, tripData, driverData, vehicleData] = await Promise.all([
            allowed("dashboard.view") ? fetchAdminDashboard(token) : null,
            allowed("bookings.manage") ? fetchDashboardBookingHighlights(token, getDashboardBookingRange()) : [],
            allowed("schedule_notes.manage") ? fetchScheduleNotes(token, "active") : [],
            allowed("payments.manage") ? fetchVehicleTripPayments(token, "active") : [],
            allowed("reminders.manage") ? fetchReminders(token, "all") : [],
            allowed("trips.manage") ? fetchDashboardTripHighlights(token, getDashboardBookingRange()) : [],
            allowed("drivers.manage") ? fetchDrivers(token) : [],
            allowed("vehicles.manage") ? fetchVehicles(token) : []
          ]);
          setDashboard(dashboardData);
          setBookings(bookingData);
          setScheduleNotes(noteData);
          setVehicleTripPayments(paymentData);
          setReminders(reminderData);
          setTrips(tripData);
          setDrivers(driverData);
          setVehicles(vehicleData);
          break;
        }
        case "bookings": {
          const [vehicleData, driverData] = await Promise.all([
            allowed("vehicles.manage") ? fetchVehicles(token) : [],
            allowed("drivers.manage") ? fetchDrivers(token) : []
          ]);
          setVehicles(vehicleData);
          setDrivers(driverData);
          break;
        }
        case "dispatch-today":
        case "dispatch-calendar": {
          const [bookingData, noteData, archivedNoteData, tripData, vehicleData, driverData, paymentData, reminderData] = await Promise.all([
            allowed("bookings.manage") ? fetchAdminBookings(token) : [],
            allowed("schedule_notes.manage") ? fetchScheduleNotes(token, "active") : [],
            tabId === "dispatch-calendar" && allowed("schedule_notes.manage") ? fetchScheduleNotes(token, "archived") : [],
            allowed("trips.manage") ? fetchTrips(token) : [],
            allowed("vehicles.manage") ? fetchVehicles(token) : [],
            allowed("drivers.manage") ? fetchDrivers(token) : [],
            allowed("payments.manage") ? fetchVehicleTripPayments(token, "active") : [],
            allowed("reminders.manage") ? fetchReminders(token, "all") : []
          ]);
          setBookings(bookingData);
          setScheduleNotes(noteData);
          if (tabId === "dispatch-calendar") setArchivedScheduleNotes(archivedNoteData);
          setTrips(tripData);
          setVehicles(vehicleData);
          setDrivers(driverData);
          setVehicleTripPayments(paymentData);
          setReminders(reminderData);
          break;
        }
        case "monthly-reports": {
          const [bookingData, noteData, archivedNoteData, paymentData, archivedPaymentData, expenseData, maintenanceData, tripData] = await Promise.all([
            allowed("bookings.manage") ? fetchAdminBookings(token) : [],
            allowed("schedule_notes.manage") ? fetchScheduleNotes(token, "active") : [],
            allowed("schedule_notes.manage") ? fetchScheduleNotes(token, "archived") : [],
            allowed("payments.manage") ? fetchVehicleTripPayments(token, "active") : [],
            allowed("payments.manage") ? fetchVehicleTripPayments(token, "archived") : [],
            allowed("finance.manage") ? fetchTripExpenses(token) : [],
            allowed("maintenances.manage") ? fetchVehicleMaintenances(token) : [],
            allowed("trips.manage") ? fetchTrips(token) : []
          ]);
          setBookings(bookingData);
          setScheduleNotes(noteData);
          setArchivedScheduleNotes(archivedNoteData);
          setVehicleTripPayments(paymentData);
          setArchivedVehicleTripPayments(archivedPaymentData);
          setTripExpenses(expenseData);
          setVehicleMaintenances(maintenanceData);
          setTrips(tripData);
          break;
        }
        case "admin-users":
          setAdminUsers(allowed("admin_users.manage") ? await fetchAdminUsers(token) : []);
          break;
        case "activity-logs":
          setActivityLogs(allowed("activity_logs.view") ? await fetchActivityLogs(token) : []);
          break;
        case "vehicle-categories":
          setVehicleCategories(allowed("vehicle_categories.manage") ? await fetchVehicleCategories(token) : []);
          break;
        case "vehicles": {
          const [categoryData, vehicleData] = await Promise.all([
            allowed("vehicle_categories.manage") ? fetchVehicleCategories(token) : [],
            allowed("vehicles.manage") ? fetchVehicles(token) : []
          ]);
          setVehicleCategories(categoryData);
          setVehicles(vehicleData);
          setSelectedVehicleId((current) => current || vehicleData[0]?.id || "");
          setVehicleForm((current) => ({ ...current, categoryId: current.categoryId || categoryData[0]?.id || "" }));
          break;
        }
        case "drivers":
          setDrivers(allowed("drivers.manage") ? await fetchDrivers(token) : []);
          break;
        case "customers":
          break;
        case "trips": {
          const [vehicleData, driverData, bookingData] = await Promise.all([
            allowed("vehicles.manage") ? fetchVehicles(token) : [],
            allowed("drivers.manage") ? fetchDrivers(token) : [],
            allowed("bookings.manage") ? fetchAdminBookings(token) : []
          ]);
          setVehicles(vehicleData);
          setDrivers(driverData);
          setBookings(bookingData);
          break;
        }
        case "finance": {
          const [expenseData, tripData, bookingData, paymentData, archivedPaymentData, maintenanceData, vehicleData] = await Promise.all([
            allowed("finance.manage") ? fetchTripExpenses(token) : [],
            allowed("trips.manage") ? fetchTrips(token) : [],
            allowed("bookings.manage") ? fetchAdminBookings(token) : [],
            allowed("payments.manage") ? fetchVehicleTripPayments(token, "active") : [],
            allowed("payments.manage") ? fetchVehicleTripPayments(token, "archived") : [],
            allowed("maintenances.manage") ? fetchVehicleMaintenances(token) : [],
            allowed("vehicles.manage") ? fetchVehicles(token) : []
          ]);
          setTripExpenses(expenseData);
          setTrips(tripData);
          setBookings(bookingData);
          setVehicleTripPayments(paymentData);
          setArchivedVehicleTripPayments(archivedPaymentData);
          setVehicleMaintenances(maintenanceData);
          setVehicles(vehicleData);
          break;
        }
        case "reminders": {
          const [reminderData, bookingData, noteData, tripData, vehicleData, driverData] = await Promise.all([
            allowed("reminders.manage") ? fetchReminders(token, "all") : [],
            allowed("bookings.manage") ? fetchAdminBookings(token) : [],
            allowed("schedule_notes.manage") ? fetchScheduleNotes(token, "active") : [],
            allowed("trips.manage") ? fetchTrips(token) : [],
            allowed("vehicles.manage") ? fetchVehicles(token) : [],
            allowed("drivers.manage") ? fetchDrivers(token) : []
          ]);
          setReminders(reminderData);
          setBookings(bookingData);
          setScheduleNotes(noteData);
          setTrips(tripData);
          setVehicles(vehicleData);
          setDrivers(driverData);
          break;
        }
        case "schedule-notes": {
          const [noteData, archivedNoteData, bookingData, vehicleData, driverData, paymentData, tripData] = await Promise.all([
            allowed("schedule_notes.manage") ? fetchScheduleNotes(token, "active") : [],
            allowed("schedule_notes.manage") ? fetchScheduleNotes(token, "archived") : [],
            allowed("bookings.manage") ? fetchAdminBookings(token) : [],
            allowed("vehicles.manage") ? fetchVehicles(token) : [],
            allowed("drivers.manage") ? fetchDrivers(token) : [],
            allowed("payments.manage") ? fetchVehicleTripPayments(token, "active") : [],
            allowed("trips.manage") ? fetchTrips(token) : []
          ]);
          setScheduleNotes(noteData);
          setArchivedScheduleNotes(archivedNoteData);
          setBookings(bookingData);
          setVehicles(vehicleData);
          setDrivers(driverData);
          setVehicleTripPayments(paymentData);
          setTrips(tripData);
          setScheduleNoteForm((current) => ({ ...current, vehicleId: current.vehicleId || vehicleData[0]?.id || "" }));
          break;
        }
        case "vehicle-trip-payments": {
          const [paymentData, archivedPaymentData, bookingData, noteData, vehicleData] = await Promise.all([
            allowed("payments.manage") ? fetchVehicleTripPayments(token, "active") : [],
            allowed("payments.manage") ? fetchVehicleTripPayments(token, "archived") : [],
            allowed("bookings.manage") ? fetchAdminBookings(token) : [],
            allowed("schedule_notes.manage") ? fetchScheduleNotes(token, "active") : [],
            allowed("vehicles.manage") ? fetchVehicles(token) : []
          ]);
          setVehicleTripPayments(paymentData);
          setArchivedVehicleTripPayments(archivedPaymentData);
          setBookings(bookingData);
          setScheduleNotes(noteData);
          setVehicles(vehicleData);
          setTripPaymentForm((current) => ({ ...current, vehicleId: current.vehicleId || vehicleData[0]?.id || "" }));
          break;
        }
        case "data-archive": {
          const [archivedNoteData, archivedPaymentData, bookingData] = await Promise.all([
            allowed("schedule_notes.manage") ? fetchScheduleNotes(token, "archived") : [],
            allowed("payments.manage") ? fetchVehicleTripPayments(token, "archived") : [],
            allowed("bookings.manage") ? fetchAdminBookings(token) : []
          ]);
          setArchivedScheduleNotes(archivedNoteData);
          setArchivedVehicleTripPayments(archivedPaymentData);
          setBookings(bookingData);
          break;
        }
        case "vehicle-maintenances": {
          const [maintenanceData, vehicleData] = await Promise.all([
            allowed("maintenances.manage") ? fetchVehicleMaintenances(token) : [],
            allowed("vehicles.manage") ? fetchVehicles(token) : []
          ]);
          setVehicleMaintenances(maintenanceData);
          setVehicles(vehicleData);
          setMaintenanceForm((current) => ({ ...current, vehicleId: current.vehicleId || vehicleData[0]?.id || "" }));
          break;
        }
        case "services":
          setServices(allowed("services.manage") ? await fetchAdminServices(token) : []);
          break;
        case "settings": {
          const [settingData, serviceData, notificationLogData] = await Promise.all([
            allowed("settings.manage") ? fetchSiteSettings(token) : [],
            allowed("services.manage") ? fetchAdminServices(token) : [],
            allowed("notifications.manage") ? fetchNotificationLogs(token) : []
          ]);
          setSiteSettings(settingData);
          setServices(serviceData);
          setNotificationLogs(notificationLogData);
          break;
        }
        default:
          break;
      }

      loadedTabIdsRef.current.add(tabId);
    } catch (error) {
      setPageError(error.message ?? "Không thể tải dữ liệu.");
    } finally {
      if (requestId === tabLoadRequestRef.current) setLoadingTab("");
    }
  }

  useEffect(() => {
    let ignore = false;

    async function restoreAdminSession() {
      try {
        const session = await fetchCurrentAdminSession();

        if (!ignore) {
          setToken(session.admin ? SESSION_TOKEN : null);
          setCurrentAdmin(session.admin ?? null);
        }
      } catch {
        if (!ignore) {
          clearToken();
          setToken(null);
          setCurrentAdmin(null);
        }
      } finally {
        if (!ignore) {
          setAuthReady(true);
        }
      }
    }

    restoreAdminSession();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!authReady || token) return;

    let ignore = false;

    async function loadPublicSettings() {
      try {
        const settingData = await fetchPublicSiteSettings();
        if (!ignore) {
          setSiteSettings(settingData);
        }
      } catch {
        if (!ignore) {
          setPageError("");
        }
      }
    }

    loadPublicSettings();

    return () => {
      ignore = true;
    };
  }, [authReady, token]);

  useEffect(() => {
    if (!token) {
      loadedTabIdsRef.current = new Set();
      setLoadingTab("");
      return;
    }

    void loadAdminTabData(activeTab);
  }, [token, activeTab, currentAdmin]);

  useEffect(() => {
    if (!token || activeTab !== "bookings" || !adminHasPermission(currentAdmin, "bookings.manage")) return undefined;

    let ignore = false;
    const timer = window.setTimeout(async () => {
      setBookingPageLoading(true);
      try {
        const dateRange = getLocalDayRange(bookingQuery.tripDate);
        const result = await fetchAdminBookingPage(token, {
          page: bookingQuery.page,
          pageSize: 10,
          status: bookingStatusFilter,
          assignment: bookingQuery.assignment,
          search: bookingQuery.search,
          sort: bookingQuery.sort,
          ...dateRange
        });
        if (!ignore) {
          setBookingPageData(result);
          setPageError("");
        }
      } catch (error) {
        if (!ignore) setPageError(error.message ?? "Không thể tải trang booking.");
      } finally {
        if (!ignore) setBookingPageLoading(false);
      }
    }, bookingQuery.search ? 250 : 0);

    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [token, activeTab, currentAdmin, bookingStatusFilter, bookingQuery, bookingPageRevision]);

  useEffect(() => {
    if (!token || activeTab !== "customers" || !adminHasPermission(currentAdmin, "customers.manage")) return undefined;
    let ignore = false;
    const timer = window.setTimeout(async () => {
      setCustomerPageLoading(true);
      try {
        const result = await fetchCustomersPage(token, customerQuery);
        if (!ignore) {
          setCustomerPageData(result);
          setCustomers(result.items);
          setPageError("");
        }
      } catch (error) {
        if (!ignore) setPageError(error.message ?? "Không thể tải danh sách khách hàng.");
      } finally {
        if (!ignore) setCustomerPageLoading(false);
      }
    }, customerQuery.search ? 250 : 0);
    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [token, activeTab, currentAdmin, customerQuery, customerPageRevision]);

  useEffect(() => {
    if (!token || activeTab !== "trips" || !adminHasPermission(currentAdmin, "trips.manage")) return undefined;
    let ignore = false;
    const timer = window.setTimeout(async () => {
      setTripPageLoading(true);
      try {
        const dateRange = getLocalDayRange(tripQuery.tripDate);
        const result = await fetchTripsPage(token, {
          page: tripQuery.page,
          pageSize: 10,
          status: tripQuery.status,
          search: tripQuery.search,
          ...dateRange
        });
        if (!ignore) {
          setTripPageData(result);
          setPageError("");
        }
      } catch (error) {
        if (!ignore) setPageError(error.message ?? "Không thể tải danh sách chuyến đi.");
      } finally {
        if (!ignore) setTripPageLoading(false);
      }
    }, tripQuery.search ? 250 : 0);
    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [token, activeTab, currentAdmin, tripQuery, tripPageRevision]);

  useEffect(() => {
    if (!token) return undefined;

    const disconnect = connectBookingStream(token, {
      onMessage: (event) => {
        applyBookingRealtimeEvent(event);
      },
      onError: async () => {
        try {
          await reloadBookingRealtimeData();
        } catch {}
      }
    });

    return () => {
      disconnect?.();
    };
  }, [token]);
  const stats = useMemo(
    () => [
      { label: "Đơn mới", value: dashboard?.bookingCount ?? "-" },
      { label: "Xe hiện có", value: dashboard?.vehicleCount ?? "-" },
      { label: "Tài xế", value: dashboard?.driverCount ?? drivers.length },
      { label: "Đơn chờ xử lý", value: dashboard?.pendingBookingCount ?? bookings.length },
      { label: "Chuyến đi", value: dashboard?.tripCount ?? trips.length }
    ],
    [dashboard, drivers.length, bookings.length, trips.length]
  );

  const settingsMap = useMemo(
    () => Object.fromEntries(siteSettings.map((item) => [item.key, item.value])),
    [siteSettings]
  );
  const allScheduleNotes = useMemo(
    () => [...scheduleNotes, ...archivedScheduleNotes],
    [archivedScheduleNotes, scheduleNotes]
  );
  const scheduleNoteByBookingId = useMemo(
    () =>
      new Map(
        allScheduleNotes.filter((note) => note.bookingRequestId).map((note) => [note.bookingRequestId, note])
      ),
    [allScheduleNotes]
  );
  const scheduleNoteById = useMemo(
    () => new Map(allScheduleNotes.map((note) => [note.id, note])),
    [allScheduleNotes]
  );
  const bookingById = useMemo(
    () => new Map(bookings.map((booking) => [booking.id, booking])),
    [bookings]
  );
  const allVehicleTripPayments = useMemo(
    () => [...vehicleTripPayments, ...archivedVehicleTripPayments],
    [archivedVehicleTripPayments, vehicleTripPayments]
  );
  const tripPaymentByBookingId = useMemo(
    () =>
      new Map(
        allVehicleTripPayments
          .filter((payment) => payment.bookingRequestId)
          .map((payment) => [payment.bookingRequestId, payment])
      ),
    [allVehicleTripPayments]
  );
  const finishedTripPaymentScheduleNoteIds = useMemo(
    () =>
      new Set(
        allVehicleTripPayments
          .filter((payment) => payment.scheduleNoteId && isFinishedTripPayment(payment))
          .map((payment) => payment.scheduleNoteId)
      ),
    [allVehicleTripPayments]
  );
  const finishedTripPaymentBookingIds = useMemo(
    () =>
      new Set(
        allVehicleTripPayments
          .filter((payment) => payment.bookingRequestId && isFinishedTripPayment(payment))
          .map((payment) => payment.bookingRequestId)
      ),
    [allVehicleTripPayments]
  );
  const archivedBookingItems = useMemo(
    () =>
      bookings.filter(
        (booking) => booking.status === "completed" && !scheduleNoteByBookingId.has(booking.id)
      ),
    [bookings, scheduleNoteByBookingId]
  );
  const scheduleQueueBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          isBookingInScheduleStep(booking.status) &&
          !booking.tripId &&
          !scheduleNoteByBookingId.has(booking.id) &&
          !tripPaymentByBookingId.has(booking.id)
      ),
    [bookings, scheduleNoteByBookingId, tripPaymentByBookingId]
  );
  const todayKey = useMemo(() => getDayKey(new Date()), []);
  const dispatchTodayBookings = useMemo(
    () =>
      bookings
        .filter((booking) => {
          if (!booking.tripDate) return false;
          if (["completed", "canceled", "cancelled"].includes(booking.status)) return false;
          return getDayKey(booking.tripDate) === todayKey;
        })
        .sort(
          (left, right) =>
            new Date(left.tripDate ?? left.createdAt ?? 0).getTime() -
            new Date(right.tripDate ?? right.createdAt ?? 0).getTime()
        ),
    [bookings, todayKey]
  );
  const dispatchPendingBookings = useMemo(
    () =>
      dispatchTodayBookings.filter(
        (booking) =>
          !booking.assignedVehicleId ||
          !booking.assignedDriverId ||
          ["new", "contacted", "called_back", "confirmed"].includes(booking.status)
      ),
    [dispatchTodayBookings]
  );
  const dispatchBusyVehicleIds = useMemo(
    () =>
      new Set(
        dispatchTodayBookings
          .map((booking) => booking.assignedVehicleId)
          .filter(Boolean)
      ),
    [dispatchTodayBookings]
  );
  const dispatchBusyVehicles = useMemo(
    () => vehicles.filter((vehicle) => dispatchBusyVehicleIds.has(vehicle.id)),
    [dispatchBusyVehicleIds, vehicles]
  );
  const dispatchReadyVehicles = useMemo(
    () =>
      vehicles.filter(
        (vehicle) => !dispatchBusyVehicleIds.has(vehicle.id) && vehicle.isPublished !== false
      ),
    [dispatchBusyVehicleIds, vehicles]
  );
  const dispatchAvailableDrivers = useMemo(
    () => drivers.filter((driver) => driver.isActive && driver.status === "available"),
    [drivers]
  );
  const dispatchAssignedDrivers = useMemo(
    () => drivers.filter((driver) => driver.isActive && driver.status === "assigned"),
    [drivers]
  );
  const tripAssignableBookings = useMemo(
    () =>
      bookings
        .filter((booking) => {
          if (!booking.tripDate) return false;
          if (["completed", "canceled", "cancelled"].includes(booking.status)) return false;
          return !booking.tripId || booking.tripId === editingTripId;
        })
        .sort(
          (left, right) =>
            new Date(left.tripDate ?? left.createdAt ?? 0).getTime() -
            new Date(right.tripDate ?? right.createdAt ?? 0).getTime()
        ),
    [bookings, editingTripId]
  );
  const scheduleListNotes = useMemo(
    () =>
      scheduleNotes.filter((note) => {
        if (note.status !== "scheduled") return false;
        if (finishedTripPaymentScheduleNoteIds.has(note.id)) return false;
        if (note.bookingRequestId && finishedTripPaymentBookingIds.has(note.bookingRequestId)) return false;

        return true;
      }),
    [finishedTripPaymentBookingIds, finishedTripPaymentScheduleNoteIds, scheduleNotes]
  );
  const paymentFlowScheduleItems = useMemo(
    () =>
      scheduleNotes.filter((note) => {
        if (note.status !== "completed") return false;
        if (finishedTripPaymentScheduleNoteIds.has(note.id)) return false;
        if (note.bookingRequestId && finishedTripPaymentBookingIds.has(note.bookingRequestId)) return false;

        return true;
      }),
    [finishedTripPaymentBookingIds, finishedTripPaymentScheduleNoteIds, scheduleNotes]
  );
  const paymentFlowBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.status === "completed" &&
          !scheduleNoteByBookingId.has(booking.id) &&
          !finishedTripPaymentBookingIds.has(booking.id)
      ),
    [bookings, finishedTripPaymentBookingIds, scheduleNoteByBookingId]
  );
  const activeVehicleTripPayments = useMemo(
    () =>
      vehicleTripPayments.filter((payment) => {
        if (isFinishedTripPayment(payment)) return false;

        const linkedNote = payment.scheduleNoteId ? scheduleNoteById.get(payment.scheduleNoteId) : null;
        const linkedBooking = payment.bookingRequestId ? bookingById.get(payment.bookingRequestId) : null;

        if (!linkedNote) {
          if (!linkedBooking) {
            return payment.paymentStatus !== "paid";
          }

          return linkedBooking.status === "completed" && payment.paymentStatus !== "paid";
        }

        if (linkedNote.status === "cancelled") return false;
        if (linkedNote.status === "completed") return payment.paymentStatus !== "paid";

        return false;
      }),
    [bookingById, scheduleNoteById, vehicleTripPayments]
  );
  const adminLogoUrl = settingsMap.logo_url ? resolveAdminAssetUrl(settingsMap.logo_url) : "";
  const adminSiteName = settingsMap.site_name ?? "Nhà xe";
  const adminBrandLine =
    adminSiteName.startsWith("Nhà xe ") ? adminSiteName.slice("Nhà xe ".length) : adminSiteName;

  const currentRole = currentAdmin?.role ?? "super_admin";
  const allowedTabIds = getAllowedTabIds(currentAdmin, tabs);
  const visibleTabs = tabs.filter((tab) => allowedTabIds.includes(tab.id));
  const visibleTabSections = useMemo(() => {
    const visibleTabById = new Map(visibleTabs.map((tab) => [tab.id, tab]));
    const groupedTabIds = new Set(tabSections.flatMap((section) => section.tabIds));
    const sections = tabSections
      .map((section) => ({
        label: section.label,
        tabs: section.tabIds.map((tabId) => visibleTabById.get(tabId)).filter(Boolean)
      }))
      .filter((section) => section.tabs.length);
    const remainingTabs = visibleTabs.filter((tab) => !groupedTabIds.has(tab.id));

    return remainingTabs.length
      ? [...sections, { label: "Khác", tabs: remainingTabs }]
      : sections;
  }, [visibleTabs]);
  const activeTabMeta = visibleTabs.find((tab) => tab.id === activeTab) ?? visibleTabs[0] ?? tabs[0];

  useEffect(() => {
    applyDocumentBranding({
      title: settingsMap.site_name ? `Quản trị ${settingsMap.site_name}` : "Quản trị nhà xe",
      faviconUrl: settingsMap.favicon_url
    });
  }, [settingsMap.favicon_url, settingsMap.site_name]);

  useEffect(() => {
    if (!visibleTabs.length) return;

    if (!visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [activeTab, visibleTabs]);

  function showToast(type, title, description = "") {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((current) => [...current, { id, type, title, description }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  }

  function dismissToast(id) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function requestConfirmation({
    title,
    message,
    confirmLabel = "Xác nhận",
    variant = "danger"
  }) {
    return new Promise((resolve) => {
      setConfirmation({ title, message, confirmLabel, variant, resolve });
    });
  }

  function resolveConfirmation(confirmed) {
    const pendingConfirmation = confirmation;
    setConfirmation(null);
    pendingConfirmation?.resolve(confirmed);
  }

  function handleAdminTabSelect(tabId) {
    setActiveTab(tabId);
    setSidebarOpen(false);
  }

  function notifyError(error, fallbackTitle = "Không thể hoàn tất thao tác.") {
    const message = error?.message ?? "Đã xảy ra lỗi không xác định.";
    setPageError(message);
    showToast("error", fallbackTitle, message);
  }

  function notifySuccess(title, description = "") {
    setPageError("");
    showToast("success", title, description);
  }

  function highlightBooking(bookingId) {
    if (!bookingId) return;

    setHighlightedBookingIds((current) =>
      current.includes(bookingId) ? current : [...current, bookingId]
    );

    window.setTimeout(() => {
      setHighlightedBookingIds((current) => current.filter((id) => id !== bookingId));
    }, 5000);
  }

  function applyBookingRealtimeEvent(event) {
    if (!event?.type || !event.booking?.id) return;
    setBookingPageRevision((revision) => revision + 1);

    if (event.type === "booking.created") {
      setBookings((current) =>
        sortBookingsByCreatedAt([
          event.booking,
          ...current.filter((booking) => booking.id !== event.booking.id)
        ])
      );
      setDashboard((current) =>
        current
          ? {
              ...current,
              bookingCount: (current.bookingCount ?? 0) + 1
            }
          : current
      );
      highlightBooking(event.booking.id);
      notifySuccess(
        "Có booking mới.",
        event.booking.customerName
          ? `${event.booking.customerName} vừa gửi yêu cầu đặt xe.`
          : "Một khách hàng vừa gửi yêu cầu đặt xe."
      );
      scheduleNotificationLogRefresh();
      scheduleCustomerRefresh();
      return;
    }

    if (event.type === "booking.updated") {
      setBookings((current) =>
        sortBookingsByCreatedAt(
          current.map((booking) => (booking.id === event.booking.id ? event.booking : booking))
        )
      );
      scheduleNotificationLogRefresh(5200);
      scheduleCustomerRefresh(800);
      return;
    }

    if (event.type === "booking.deleted") {
      setBookings((current) => current.filter((booking) => booking.id !== event.booking.id));
      setDashboard((current) =>
        current
          ? {
              ...current,
              bookingCount: Math.max((current.bookingCount ?? 1) - 1, 0)
            }
          : current
      );
      scheduleNotificationLogRefresh(1200);
      scheduleCustomerRefresh(800);
    }
  }

  async function reloadData() {
    if (!token) return;
    loadedTabIdsRef.current = new Set();
    if (activeTab === "bookings") setBookingPageRevision((revision) => revision + 1);
    if (activeTab === "customers") setCustomerPageRevision((revision) => revision + 1);
    if (activeTab === "trips") setTripPageRevision((revision) => revision + 1);
    await loadAdminTabData(activeTab, { force: true });
  }

  async function reloadBookingRealtimeData() {
    if (!token) return;

    const [dashboardData, activityLogData, bookingData, customerData, reminderData] = await Promise.all([
      adminHasPermission(currentAdmin, "dashboard.view")
        ? fetchAdminDashboard(token)
        : Promise.resolve(null),
      adminHasPermission(currentAdmin, "activity_logs.view")
        ? fetchActivityLogs(token, { limit: 50 })
        : Promise.resolve([]),
      adminHasPermission(currentAdmin, "bookings.manage")
        ? fetchAdminBookings(token)
        : Promise.resolve([]),
      adminHasPermission(currentAdmin, "customers.manage")
        ? fetchCustomers(token)
        : Promise.resolve([]),
      adminHasPermission(currentAdmin, "reminders.manage")
        ? fetchReminders(token, "all")
        : Promise.resolve([])
    ]);

    setDashboard(dashboardData);
    setActivityLogs(activityLogData);
    setBookings(bookingData);
    setCustomers(customerData);
    setReminders(reminderData);
  }

  async function reloadNotificationLogs() {
    if (!token) return;

    const notificationLogData = await fetchNotificationLogs(token);
    setNotificationLogs(notificationLogData);
  }

  function scheduleNotificationLogRefresh(delay = 1800) {
    window.setTimeout(() => {
      void reloadNotificationLogs().catch(() => {});
    }, delay);
  }

  function scheduleCustomerRefresh(delay = 600) {
    if (!token || !adminHasPermission(currentAdmin, "customers.manage")) return;

    window.setTimeout(() => {
      if (loadedTabIdsRef.current.has("customers")) {
        setCustomerPageRevision((revision) => revision + 1);
      }
    }, delay);
  }

  function handleLoginChange(event) {
    const { name, value } = event.target;
    setLoginForm((current) => ({ ...current, [name]: value }));
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    setAuthState({ loading: true, error: "" });

    try {
      const data = await loginAdmin(loginForm);
      storeToken(null);
      setToken(data.admin ? SESSION_TOKEN : null);
      setCurrentAdmin(data.admin ?? null);
      setAuthReady(true);
      setAuthState({ loading: false, error: "" });
      notifySuccess("Đăng nhập thành công.");
    } catch (error) {
      setAuthState({ loading: false, error: error.message });
      showToast("error", "Đăng nhập thất bại.", error.message);
    }
  }

  async function handleLogout() {
    try {
      await logoutAdmin();
    } catch {}

    clearToken();
    loadedTabIdsRef.current = new Set();
    setLoadingTab("");
    setBookingPageLoading(false);
    setCustomerPageLoading(false);
    setTripPageLoading(false);
    setToken(null);
    setCurrentAdmin(null);
    setDashboard(null);
    setAdminUsers([]);
    setActivityLogs([]);
    setBookings([]);
    setBookingPageData({ items: [], total: 0, allTotal: 0, assignedCount: 0, pendingCount: 0, page: 1, pageSize: 10, totalPages: 1 });
    setScheduleNotes([]);
    setArchivedScheduleNotes([]);
    setVehicleTripPayments([]);
    setArchivedVehicleTripPayments([]);
    setTripExpenses([]);
    setReminders([]);
    setVehicleMaintenances([]);
    setServices([]);
    setVehicles([]);
    setDrivers([]);
    setCustomers([]);
    setCustomerPageData({ items: [], total: 0, allTotal: 0, vipCount: 0, repeatCount: 0, watchCount: 0, page: 1, pageSize: 10, totalPages: 1 });
    setTrips([]);
    setTripPageData({ items: [], total: 0, allTotal: 0, page: 1, pageSize: 10, totalPages: 1 });
    setBookingQuery({ search: "", sort: "newest", assignment: "all", tripDate: "", page: 1 });
    setCustomerQuery({ search: "", status: "all", page: 1 });
    setTripQuery({ search: "", status: "all", tripDate: "", page: 1 });
    setSiteSettings([]);
    setNotificationLogs([]);
    setAdminUserForm(adminUserFormInitial);
    setEditingAdminUserId("");
    setCustomerForm(customerFormInitial);
    setEditingCustomerId("");
    setTripExpenseForm(tripExpenseFormInitial);
    setEditingTripExpenseId("");
    setReminderForm(reminderFormInitial);
    setEditingReminderId("");
  }

  function handlePasswordFormChange(event) {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
  }

  function togglePasswordPanel() {
    setPasswordState((current) => ({
      ...current,
      open: !current.open,
      error: "",
      message: ""
    }));
  }

  async function handleChangePasswordSubmit(event) {
    event.preventDefault();
    setPasswordState((current) => ({
      ...current,
      loading: true,
      error: "",
      message: ""
    }));

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordState((current) => ({
        ...current,
        loading: false,
        error: "Mật khẩu mới không khớp."
      }));
      showToast("error", "Đổi mật khẩu thất bại.", "Mật khẩu mới không khớp.");
      return;
    }

    try {
      const data = await changeAdminPassword(token, passwordForm);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setPasswordState((current) => ({
        ...current,
        loading: false,
        message: data.message ?? "Đổi mật khẩu thành công."
      }));
      notifySuccess("Đổi mật khẩu thành công.");
    } catch (error) {
      setPasswordState((current) => ({
        ...current,
        loading: false,
        error: error.message
      }));
      showToast("error", "Đổi mật khẩu thất bại.", error.message);
    }
  }

  async function handleBookingStatusChange(id, status) {
    try {
      await updateBookingStatus(token, id, status);
      await reloadData();
      scheduleNotificationLogRefresh(5200);
      if (isBookingInScheduleStep(status)) {
        setActiveTab("schedule-notes");
        notifySuccess("Đã cập nhật booking và chuyển sang Lịch xe.");
        return;
      }
      if (status === "completed") {
        setActiveTab("vehicle-trip-payments");
        notifySuccess("Đã cập nhật booking và chuyển sang Tiền xe.");
        return;
      }
      notifySuccess("Đã cập nhật trạng thái booking.");
    } catch (error) {
      notifyError(error, "Không thể cập nhật booking.");
    }
  }

  async function handleInlineUpdateBooking(id, payload) {
    setPageError("");

    try {
      await updateBooking(token, id, {
        customerName: payload.customerName.trim(),
        phoneNumber: payload.phoneNumber.trim(),
        pickupLocation: payload.pickupLocation.trim(),
        dropoffLocation: payload.dropoffLocation.trim(),
        tripDate: payload.tripDate || "",
        note: payload.note ?? "",
        internalNote: payload.internalNote ?? "",
        cancelReason: payload.cancelReason ?? "",
        assignedVehicleId: payload.assignedVehicleId ?? "",
        assignedDriverId: payload.assignedDriverId ?? "",
        status: payload.status
      });
      await reloadData();
      scheduleNotificationLogRefresh(5200);
      if (isBookingInScheduleStep(payload.status)) {
        setActiveTab("schedule-notes");
        notifySuccess("Đã cập nhật booking và chuyển sang Lịch xe.");
        return;
      }
      if (payload.status === "completed") {
        setActiveTab("vehicle-trip-payments");
        notifySuccess("Đã cập nhật booking và chuyển sang Tiền xe.");
        return;
      }
      notifySuccess("Đã cập nhật booking.");
    } catch (error) {
      notifyError(error, "Không thể cập nhật booking.");
      throw error;
    }
  }

  async function handleDeleteBooking(id) {
    const confirmed = await requestConfirmation({
      title: "Xóa yêu cầu booking?",
      message: "Booking sẽ bị xóa khỏi hệ thống và không thể khôi phục từ trang quản trị.",
      confirmLabel: "Xóa booking"
    });
    if (!confirmed) return;
    try {
      await deleteBooking(token, id);
      await reloadData();
      scheduleNotificationLogRefresh(1200);
      notifySuccess("Đã xóa booking.");
    } catch (error) {
      notifyError(error, "Không thể xóa booking.");
    }
  }

  function handleBookingStatusFilterChange(value) {
    setBookingStatusFilter(value);
    setBookingQuery((current) => ({ ...current, page: 1 }));
  }

  function handleBookingQueryChange(field, value) {
    if (field === "reset") {
      setBookingStatusFilter("all");
      setBookingQuery({ search: "", sort: "newest", assignment: "all", tripDate: "", page: 1 });
      return;
    }

    setBookingQuery((current) => ({
      ...current,
      [field]: value,
      page: field === "page" ? value : 1
    }));
  }

  function handleCustomerQueryChange(field, value) {
    setCustomerQuery((current) => field === "reset"
      ? { search: "", status: "all", page: 1 }
      : { ...current, [field]: value, page: field === "page" ? value : 1 });
  }

  function handleTripQueryChange(field, value) {
    setTripQuery((current) => field === "reset"
      ? { search: "", status: "all", tripDate: "", page: 1 }
      : { ...current, [field]: value, page: field === "page" ? value : 1 });
  }

  function retryActiveTabLoad() {
    setPageError("");
    if (activeTab === "bookings") {
      setBookingPageRevision((revision) => revision + 1);
    } else if (activeTab === "customers") {
      setCustomerPageRevision((revision) => revision + 1);
    } else if (activeTab === "trips") {
      setTripPageRevision((revision) => revision + 1);
    } else {
      void loadAdminTabData(activeTab, { force: true });
    }
  }

  async function fetchAllFilteredTripRecords() {
    if (!token) return [];
    const dateRange = getLocalDayRange(tripQuery.tripDate);
    const records = [];
    let page = 1;
    let totalPages = 1;
    try {
      do {
        const result = await fetchTripsPage(token, {
          page,
          pageSize: 50,
          status: tripQuery.status,
          search: tripQuery.search,
          ...dateRange
        });
        records.push(...result.items);
        totalPages = result.totalPages;
        page += 1;
      } while (page <= totalPages);
      return records;
    } catch (error) {
      notifyError(error, "Không thể xuất danh sách chuyến đi.");
      return [];
    }
  }

  async function fetchAllFilteredBookingRecords() {
    if (!token) return [];
    const dateRange = getLocalDayRange(bookingQuery.tripDate);
    const records = [];
    let page = 1;
    let totalPages = 1;

    try {
      do {
        const result = await fetchAdminBookingPage(token, {
          page,
          pageSize: 50,
          status: bookingStatusFilter,
          assignment: bookingQuery.assignment,
          search: bookingQuery.search,
          sort: bookingQuery.sort,
          ...dateRange
        });
        records.push(...result.items);
        totalPages = result.totalPages;
        page += 1;
      } while (page <= totalPages);
    } catch (error) {
      notifyError(error, "Không thể xuất danh sách booking.");
      return [];
    }

    return records;
  }

  function handleAdminUserFormChange(event) {
    const { name, value, type, checked } = event.target;
    setAdminUserForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : name === "role"
            ? value
            : value
    }));
  }

  function handleAdminUserRoleChange(role) {
    setAdminUserForm((current) => ({
      ...current,
      role,
      permissions: [...(ROLE_DEFAULT_PERMISSIONS[role] ?? [])]
    }));
  }

  function handleAdminUserPermissionToggle(permission) {
    setAdminUserForm((current) => {
      const nextPermissions = current.permissions.includes(permission)
        ? current.permissions.filter((item) => item !== permission)
        : [...current.permissions, permission];

      return {
        ...current,
        permissions: nextPermissions
      };
    });
  }

  function handleApplyAdminUserPermissionPreset(role) {
    setAdminUserForm((current) => ({
      ...current,
      permissions: [...(ROLE_DEFAULT_PERMISSIONS[role] ?? [])]
    }));
  }

  function resetAdminUserForm() {
    setEditingAdminUserId("");
    setAdminUserForm(adminUserFormInitial);
  }

  function handleEditAdminUser(adminUser) {
    setActiveTab("admin-users");
    setEditingAdminUserId(adminUser.id);
    setAdminUserForm({
      fullName: adminUser.fullName ?? "",
      email: adminUser.email ?? "",
      role: adminUser.role ?? "operator",
      password: "",
      permissions: [...(adminUser.permissions ?? ROLE_DEFAULT_PERMISSIONS[adminUser.role] ?? [])],
      isActive: Boolean(adminUser.isActive)
    });
  }

  async function handleCreateAdminUser(event) {
    event.preventDefault();
    setSavingAdminUser(true);
    setPageError("");

    try {
      const payload = {
        fullName: adminUserForm.fullName.trim(),
        email: adminUserForm.email.trim(),
        role: adminUserForm.role,
        password: adminUserForm.password,
        permissions: adminUserForm.permissions,
        isActive: adminUserForm.isActive
      };

      if (editingAdminUserId) {
        await updateAdminUser(token, editingAdminUserId, payload);
      } else {
        await createAdminUser(token, payload);
      }

      resetAdminUserForm();
      await reloadData();
      notifySuccess(editingAdminUserId ? "Đã cập nhật tài khoản admin." : "Đã tạo tài khoản admin mới.");
    } catch (error) {
      notifyError(error, "Không thể lưu tài khoản admin.");
    } finally {
      setSavingAdminUser(false);
    }
  }

  async function handleDeleteAdminUser(id) {
    const confirmed = await requestConfirmation({
      title: "Xóa tài khoản quản trị?",
      message: "Tài khoản này sẽ mất quyền đăng nhập. Nhật ký thao tác đã ghi vẫn được giữ lại.",
      confirmLabel: "Xóa tài khoản"
    });
    if (!confirmed) return;

    try {
      if (editingAdminUserId === id) {
        resetAdminUserForm();
      }

      await deleteAdminUser(token, id);
      await reloadData();
      notifySuccess("Đã xóa tài khoản admin.");
    } catch (error) {
      notifyError(error, "Không thể xóa tài khoản admin.");
    }
  }

  async function handleToggleAdminUserActive(adminUser) {
    const nextIsActive = !adminUser.isActive;
    const actionLabel = nextIsActive ? "mở khóa" : "khóa";

    const confirmed = await requestConfirmation({
      title: `${nextIsActive ? "Mở khóa" : "Khóa"} tài khoản?`,
      message: `Xác nhận ${actionLabel} tài khoản "${adminUser.fullName}".`,
      confirmLabel: nextIsActive ? "Mở khóa" : "Khóa tài khoản",
      variant: "warning"
    });
    if (!confirmed) return;

    try {
      await updateAdminUser(token, adminUser.id, {
        fullName: adminUser.fullName,
        email: adminUser.email,
        role: adminUser.role,
        password: "",
        permissions: adminUser.permissions,
        isActive: nextIsActive
      });

      await reloadData();
      notifySuccess(
        nextIsActive ? "Đã mở khóa tài khoản admin." : "Đã khóa tài khoản admin."
      );
    } catch (error) {
      notifyError(error, `Không thể ${actionLabel} tài khoản admin.`);
    }
  }

  async function handleResetAdminUserPassword(adminUser) {
    const nextPassword = window.prompt(
      `Nhập mật khẩu mới cho tài khoản "${adminUser.fullName}" (tối thiểu 8 ký tự):`,
      ""
    );

    if (nextPassword === null) {
      return;
    }

    if (nextPassword.trim().length < 8) {
      notifyError(
        new Error("Mật khẩu mới phải có ít nhất 8 ký tự."),
        "Không thể đặt lại mật khẩu."
      );
      return;
    }

    try {
      await updateAdminUser(token, adminUser.id, {
        fullName: adminUser.fullName,
        email: adminUser.email,
        role: adminUser.role,
        password: nextPassword.trim(),
        permissions: adminUser.permissions,
        isActive: adminUser.isActive
      });

      await reloadData();
      notifySuccess("Đã đặt lại mật khẩu tài khoản admin.");
    } catch (error) {
      notifyError(error, "Không thể đặt lại mật khẩu admin.");
    }
  }

  function handleDriverFormChange(event) {
    const { name, value, type, checked } = event.target;
    setDriverForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  function resetDriverForm() {
    setEditingDriverId("");
    setDriverForm(driverFormInitial);
  }

  function handleEditDriver(driver) {
    setActiveTab("drivers");
    setEditingDriverId(driver.id);
    setDriverForm({
      fullName: driver.fullName ?? "",
      phoneNumber: driver.phoneNumber ?? "",
      status: driver.status ?? "available",
      note: driver.note ?? "",
      isActive: Boolean(driver.isActive)
    });
  }

  async function handleCreateDriver(event) {
    event.preventDefault();
    setSavingDriver(true);
    setPageError("");

    try {
      const payload = {
        fullName: driverForm.fullName.trim(),
        phoneNumber: driverForm.phoneNumber.trim(),
        status: driverForm.status,
        note: driverForm.note?.trim() || "",
        isActive: driverForm.isActive
      };

      if (editingDriverId) {
        await updateDriver(token, editingDriverId, payload);
      } else {
        await createDriver(token, payload);
      }

      resetDriverForm();
      await reloadData();
      notifySuccess(editingDriverId ? "Đã cập nhật tài xế." : "Đã tạo tài xế mới.");
    } catch (error) {
      notifyError(error, "Không thể lưu tài xế.");
    } finally {
      setSavingDriver(false);
    }
  }

  async function handleDeleteDriver(id) {
    const confirmed = await requestConfirmation({
      title: "Xóa tài xế?",
      message: "Hồ sơ tài xế sẽ bị xóa. Hãy kiểm tra các chuyến đang được phân công trước khi tiếp tục.",
      confirmLabel: "Xóa tài xế"
    });
    if (!confirmed) return;
    try {
      if (editingDriverId === id) resetDriverForm();
      await deleteDriver(token, id);
      await reloadData();
      notifySuccess("Đã xóa tài xế.");
    } catch (error) {
      notifyError(error, "Không thể xóa tài xế.");
    }
  }

  function handleCustomerFormChange(event) {
    const { name, value } = event.target;
    setCustomerForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  function resetCustomerForm() {
    setEditingCustomerId("");
    setCustomerForm(customerFormInitial);
  }

  function handleEditCustomer(customer) {
    setActiveTab("customers");
    setEditingCustomerId(customer.profileId ?? "");
    setCustomerForm({
      fullName: customer.fullName ?? "",
      phoneNumber: customer.phoneNumber ?? "",
      status: customer.status ?? "regular",
      note: customer.note ?? ""
    });
  }

  async function handleCreateCustomer(event) {
    event.preventDefault();
    setSavingCustomer(true);
    setPageError("");

    try {
      const payload = {
        fullName: customerForm.fullName.trim(),
        phoneNumber: customerForm.phoneNumber.trim(),
        status: customerForm.status,
        note: customerForm.note?.trim() || ""
      };

      if (editingCustomerId) {
        await updateCustomer(token, editingCustomerId, payload);
      } else {
        await createCustomer(token, payload);
      }

      resetCustomerForm();
      await reloadData();
      notifySuccess(editingCustomerId ? "Đã cập nhật khách hàng." : "Đã lưu hồ sơ khách hàng.");
    } catch (error) {
      notifyError(error, "Không thể lưu khách hàng.");
    } finally {
      setSavingCustomer(false);
    }
  }

  async function handleDeleteCustomer(customer) {
    if (!customer.profileId) return;
    const confirmed = await requestConfirmation({
      title: "Xóa hồ sơ khách hàng?",
      message: `Hồ sơ "${customer.fullName}" sẽ bị xóa, nhưng lịch sử booking vẫn được giữ.`,
      confirmLabel: "Xóa hồ sơ"
    });
    if (!confirmed) return;

    try {
      if (editingCustomerId === customer.profileId) resetCustomerForm();
      await deleteCustomer(token, customer.profileId);
      await reloadData();
      notifySuccess("Đã xóa hồ sơ khách hàng.");
    } catch (error) {
      notifyError(error, "Không thể xóa hồ sơ khách hàng.");
    }
  }

  function handleTripFormChange(event) {
    const { name, value } = event.target;
    setTripForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  function handleTripBookingToggle(bookingId) {
    setTripForm((current) => ({
      ...current,
      bookingIds: current.bookingIds.includes(bookingId)
        ? current.bookingIds.filter((id) => id !== bookingId)
        : [...current.bookingIds, bookingId]
    }));
  }

  function resetTripForm() {
    setEditingTripId("");
    setTripForm(tripFormInitial);
  }

  function handleEditTrip(trip) {
    setActiveTab("trips");
    setEditingTripId(trip.id);
    setTripForm({
      title: trip.title ?? "",
      tripDate: toDateTimeLocalValue(trip.tripDate),
      pickupLocation: trip.pickupLocation ?? "",
      dropoffLocation: trip.dropoffLocation ?? "",
      vehicleId: trip.vehicleId ?? "",
      driverId: trip.driverId ?? "",
      status: trip.status ?? "draft",
      note: trip.note ?? "",
      bookingIds: trip.bookings?.map((booking) => booking.id) ?? []
    });
  }

  async function handleCreateTrip(event) {
    event.preventDefault();
    setSavingTrip(true);
    setPageError("");

    try {
      const payload = {
        title: tripForm.title.trim(),
        tripDate: toIsoDateTimeLocalValue(tripForm.tripDate),
        pickupLocation: tripForm.pickupLocation.trim(),
        dropoffLocation: tripForm.dropoffLocation.trim(),
        vehicleId: tripForm.vehicleId || "",
        driverId: tripForm.driverId || "",
        status: tripForm.status,
        note: tripForm.note?.trim() || "",
        bookingIds: tripForm.bookingIds
      };

      if (editingTripId) {
        await updateTrip(token, editingTripId, payload);
      } else {
        await createTrip(token, payload);
      }

      resetTripForm();
      await reloadData();
      notifySuccess(editingTripId ? "Đã cập nhật chuyến đi." : "Đã tạo chuyến đi mới.");
    } catch (error) {
      notifyError(error, "Không thể lưu chuyến đi.");
    } finally {
      setSavingTrip(false);
    }
  }

  async function handleTripNextStep(trip) {
    if (trip.status === "completed") {
      if ((trip.bookings ?? []).length <= 1) {
        handleCreateTripPaymentFromTrip(trip);
      } else {
        setActiveTab("vehicle-trip-payments");
        resetTripPaymentForm();
        notifySuccess("Đã mở danh sách thu tiền cho các booking trong chuyến.");
      }
      return;
    }
    if (trip.status === "canceled") return;

    const nextStatus = {
      draft: "confirmed",
      confirmed: "in_progress",
      in_progress: "completed"
    }[trip.status];
    if (!nextStatus) return;
    if (trip.status === "draft" && (!trip.vehicleId || !trip.driverId)) {
      handleEditTrip(trip);
      showToast("error", "Chưa thể xác nhận chuyến", "Hãy chọn đủ xe và tài xế trước.");
      return;
    }

    try {
      await updateTrip(token, trip.id, {
        title: trip.title,
        tripDate: trip.tripDate || "",
        pickupLocation: trip.pickupLocation || "",
        dropoffLocation: trip.dropoffLocation || "",
        vehicleId: trip.vehicleId || "",
        driverId: trip.driverId || "",
        status: nextStatus,
        note: trip.note || "",
        bookingIds: (trip.bookings ?? []).map((booking) => booking.id)
      });
      await reloadData();
      if (nextStatus === "completed") setActiveTab("vehicle-trip-payments");
      notifySuccess(
        nextStatus === "completed"
          ? "Đã hoàn tất chuyến. Tiếp tục ghi nhận tiền xe."
          : nextStatus === "in_progress"
            ? "Chuyến đã bắt đầu."
            : "Chuyến đã xác nhận."
      );
    } catch (error) {
      notifyError(error, "Không thể chuyển chuyến sang bước tiếp theo.");
    }
  }

  async function handleDeleteTrip(id) {
    const confirmed = await requestConfirmation({
      title: "Xóa chuyến đi?",
      message: "Chuyến đi và thông tin phân công liên quan sẽ bị xóa khỏi danh sách.",
      confirmLabel: "Xóa chuyến"
    });
    if (!confirmed) return;
    try {
      if (editingTripId === id) resetTripForm();
      await deleteTrip(token, id);
      await reloadData();
      notifySuccess("Đã xóa chuyến đi.");
    } catch (error) {
      notifyError(error, "Không thể xóa chuyến đi.");
    }
  }

  function openVehicleCategoriesTab() {
    setActiveTab("vehicle-categories");
    resetCategoryForm();
  }

  function openVehiclesTab() {
    setActiveTab("vehicles");
    setEditingVehicleId("");
    setVehicleSearch("");
    setVehicleForm({
      ...vehicleFormInitial,
      categoryId: vehicleCategories[0]?.id || ""
    });
  }

  function openBookingsTab() {
    setActiveTab("bookings");
    setBookingStatusFilter("new");
  }

  function openScheduleNotesTab() {
    setActiveTab("schedule-notes");
    resetScheduleNoteForm();
  }

  function openRemindersTab() {
    setActiveTab("reminders");
    resetReminderForm();
  }

  function openTripsTab() {
    setActiveTab("trips");
    resetTripForm();
  }

  function handleOpenTripVoucher(trip) {
    setDispatchVoucher({ type: "trip", item: trip });
  }

  function handleOpenBookingVoucher(booking) {
    setDispatchVoucher({ type: "booking", item: booking });
  }

  function handleCreateTripFromBooking(booking) {
    setActiveTab("trips");
    setEditingTripId("");
    setTripForm({
      ...tripFormInitial,
      title: booking.customerName?.trim() ? `Chuyến - ${booking.customerName.trim()}` : "Chuyến từ booking",
      tripDate: toDateTimeLocalValue(booking.tripDate),
      pickupLocation: booking.pickupLocation ?? "",
      dropoffLocation: booking.dropoffLocation ?? "",
      vehicleId: booking.assignedVehicleId ?? "",
      driverId: booking.assignedDriverId ?? "",
      bookingIds: [booking.id]
    });
  }

  function handleCloseDispatchVoucher() {
    setDispatchVoucher(null);
  }

  function openVehicleTripPaymentsTab() {
    setActiveTab("vehicle-trip-payments");
    resetTripPaymentForm();
  }

  function openVehicleMaintenancesTab() {
    setActiveTab("vehicle-maintenances");
    resetMaintenanceForm();
  }

  function handleScheduleNoteFormChange(event) {
    const { name, value } = event.target;

    if (name === "bookingRequestId") {
      const selectedBooking = bookings.find((booking) => booking.id === value);

      setScheduleNoteForm((current) => {
        if (!selectedBooking) {
          return {
            ...current,
            bookingRequestId: value
          };
        }

        return {
          ...current,
          bookingRequestId: value,
          title: selectedBooking.customerName
            ? `Giữ lịch cho ${selectedBooking.customerName}`
            : current.title,
          customerName: selectedBooking.customerName ?? "",
          phoneNumber: selectedBooking.phoneNumber ?? "",
          tripDate: toDateTimeLocalValue(selectedBooking.tripDate),
          pickupLocation: selectedBooking.pickupLocation ?? "",
          dropoffLocation: selectedBooking.dropoffLocation ?? "",
          note: selectedBooking.note ?? current.note
        };
      });

      return;
    }

    setScheduleNoteForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  function resetScheduleNoteForm() {
    setEditingScheduleNoteId("");
    setScheduleNoteForm({
      ...scheduleNoteFormInitial,
      vehicleId: vehicles[0]?.id || ""
    });
  }

  async function handleCreateScheduleNote(event) {
    event.preventDefault();
    setSavingScheduleNote(true);
    setPageError("");

    try {
      const payload = {
        ...scheduleNoteForm,
        bookingRequestId: scheduleNoteForm.bookingRequestId || null,
        title:
          scheduleNoteForm.title.trim() ||
          (scheduleNoteForm.customerName.trim()
            ? `Giữ lịch cho ${scheduleNoteForm.customerName.trim()}`
            : "Ghi chú lịch xe")
      };

      if (editingScheduleNoteId) {
        await updateScheduleNote(token, editingScheduleNoteId, payload);
      } else {
        await createScheduleNote(token, payload);
      }

      resetScheduleNoteForm();
      await reloadData();
      if (payload.status === "completed") {
        setActiveTab("vehicle-trip-payments");
        notifySuccess("Đã lưu lịch xe và chuyển sang Tiền xe.");
        return;
      }
      notifySuccess(
        editingScheduleNoteId ? "Đã cập nhật lịch note." : "Đã tạo lịch note mới."
      );
    } catch (error) {
      notifyError(error, "Không thể lưu lịch note.");
    } finally {
      setSavingScheduleNote(false);
    }
  }

  function handleEditScheduleNote(note) {
    setActiveTab("schedule-notes");
    setEditingScheduleNoteId(note.id);
    setScheduleNoteForm({
      vehicleId: note.vehicleId,
      bookingRequestId: note.bookingRequestId ?? "",
      title: note.title ?? "",
      customerName: note.customerName ?? note.bookingRequest?.customerName ?? "",
      phoneNumber: note.phoneNumber ?? note.bookingRequest?.phoneNumber ?? "",
      tripDate: toDateTimeLocalValue(note.tripDate),
      pickupLocation: note.pickupLocation ?? note.bookingRequest?.pickupLocation ?? "",
      dropoffLocation: note.dropoffLocation ?? note.bookingRequest?.dropoffLocation ?? "",
      status: note.status ?? "scheduled",
      note: note.note ?? ""
    });
  }

  async function handleInlineUpdateScheduleNote(id, payload) {
    setPageError("");

    try {
      await updateScheduleNote(token, id, {
        ...payload,
        bookingRequestId: payload.bookingRequestId || null,
        title:
          payload.title.trim() ||
          (payload.customerName.trim()
            ? `Giữ lịch cho ${payload.customerName.trim()}`
            : "Ghi chú lịch xe")
      });
      if (editingScheduleNoteId === id) resetScheduleNoteForm();
      await reloadData();
      if (payload.status === "completed") {
        setActiveTab("vehicle-trip-payments");
        notifySuccess("Đã hoàn thành chuyến và chuyển sang Tiền xe.");
        return;
      }
      notifySuccess("Đã cập nhật lịch xe.");
    } catch (error) {
      notifyError(error, "Không thể cập nhật lịch xe.");
      throw error;
    }
  }

  function buildScheduleNotePayload(note, overrides = {}) {
    const customerName =
      overrides.customerName ?? note.customerName ?? note.bookingRequest?.customerName ?? "";

    return {
      vehicleId: overrides.vehicleId ?? note.vehicleId ?? vehicles[0]?.id ?? "",
      bookingRequestId: overrides.bookingRequestId ?? note.bookingRequestId ?? "",
      title:
        overrides.title ??
        note.title ??
        (customerName.trim() ? `Giữ lịch cho ${customerName.trim()}` : "Ghi chú lịch xe"),
      customerName,
      phoneNumber: overrides.phoneNumber ?? note.phoneNumber ?? note.bookingRequest?.phoneNumber ?? "",
      tripDate: overrides.tripDate ?? toDateTimeLocalValue(note.tripDate),
      pickupLocation:
        overrides.pickupLocation ?? note.pickupLocation ?? note.bookingRequest?.pickupLocation ?? "",
      dropoffLocation:
        overrides.dropoffLocation ?? note.dropoffLocation ?? note.bookingRequest?.dropoffLocation ?? "",
      status: overrides.status ?? note.status ?? "scheduled",
      note: overrides.note ?? note.note ?? ""
    };
  }

  async function syncScheduleStatusFromPayment(payload) {
    if (!payload.scheduleNoteId || !payload.scheduleStatus) return;

    const currentNote = scheduleNoteById.get(payload.scheduleNoteId);
    if (!currentNote || currentNote.status === payload.scheduleStatus) return;

    await updateScheduleNote(
      token,
      payload.scheduleNoteId,
      buildScheduleNotePayload(currentNote, {
        customerName: payload.customerName,
        phoneNumber: payload.phoneNumber,
        tripDate: payload.tripDate,
        pickupLocation: payload.pickupLocation,
        dropoffLocation: payload.dropoffLocation,
        note: payload.note,
        status: payload.scheduleStatus
      })
    );
  }

  async function handleDeleteScheduleNote(id) {
    const confirmed = await requestConfirmation({
      title: "Chuyển lịch xe khỏi danh sách?",
      message: "Lịch xe sẽ không còn ở danh sách hiện tại nhưng dữ liệu vẫn được giữ trong mục Dữ liệu.",
      confirmLabel: "Chuyển khỏi danh sách",
      variant: "warning"
    });
    if (!confirmed) return;

    try {
      await deleteScheduleNote(token, id);
      if (editingScheduleNoteId === id) resetScheduleNoteForm();
      await reloadData();
      notifySuccess("Đã chuyển lịch xe sang mục Dữ liệu.");
    } catch (error) {
      notifyError(error, "Không thể chuyển lịch xe sang mục Dữ liệu.");
    }
  }

  function handleCreateTripPaymentFromTrip(trip) {
    setActiveTab("vehicle-trip-payments");
    setEditingTripPaymentId("");
    setTripPaymentForm({
      scheduleNoteId: "",
      bookingRequestId: trip.bookings?.length === 1 ? trip.bookings[0].id : "",
      vehicleId: trip.vehicleId ?? vehicles[0]?.id ?? "",
      title: trip.title?.trim() ? `Tiền xe - ${trip.title.trim()}` : "Tiền xe",
      customerName:
        trip.bookings?.length === 1
          ? trip.bookings[0].customerName ?? ""
          : trip.title ?? "",
      phoneNumber:
        trip.bookings?.length === 1
          ? trip.bookings[0].phoneNumber ?? ""
          : "",
      tripDate: toDateTimeLocalValue(trip.tripDate),
      pickupLocation: trip.pickupLocation ?? "",
      dropoffLocation: trip.dropoffLocation ?? "",
      amount: "",
      paymentStatus: "unpaid",
      note: trip.note ?? ""
    });
  }

  function handleTripPaymentFormChange(event) {
    const { name, value } = event.target;

    if (name === "bookingRequestId") {
      const selectedBooking = bookings.find((booking) => booking.id === value);
      const linkedScheduleNote =
        scheduleNotes.find((note) => note.bookingRequestId === value) ?? null;

      setTripPaymentForm((current) => {
        if (!selectedBooking) {
          return {
            ...current,
            bookingRequestId: value,
            scheduleNoteId: ""
          };
        }

        return {
          ...current,
          bookingRequestId: value,
          scheduleNoteId: linkedScheduleNote?.id ?? "",
          vehicleId: linkedScheduleNote?.vehicleId ?? selectedBooking.assignedVehicleId ?? current.vehicleId,
          title: selectedBooking.customerName?.trim()
            ? `Tiền xe - ${selectedBooking.customerName.trim()}`
            : current.title,
          customerName: selectedBooking.customerName ?? "",
          phoneNumber: selectedBooking.phoneNumber ?? "",
          tripDate: toDateTimeLocalValue(selectedBooking.tripDate),
          pickupLocation: selectedBooking.pickupLocation ?? "",
          dropoffLocation: selectedBooking.dropoffLocation ?? "",
          note: current.note || linkedScheduleNote?.note || selectedBooking.note || ""
        };
      });

      return;
    }

    setTripPaymentForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  function resetTripPaymentForm() {
    setEditingTripPaymentId("");
    setTripPaymentForm({
      ...tripPaymentFormInitial,
      vehicleId: vehicles[0]?.id || ""
    });
  }

  async function handleCreateTripPayment(event) {
    event.preventDefault();
    setSavingTripPayment(true);
    setPageError("");

    try {
      const payload = {
        ...tripPaymentForm,
        tripDate: toIsoDateTimeLocalValue(tripPaymentForm.tripDate),
        scheduleNoteId: tripPaymentForm.scheduleNoteId || null,
        bookingRequestId: tripPaymentForm.bookingRequestId || null,
        title:
          tripPaymentForm.title.trim() ||
          (tripPaymentForm.customerName.trim()
            ? `Tiền xe ${tripPaymentForm.customerName.trim()}`
            : "Tiền xe"),
        amount: tripPaymentForm.amount === "" ? "" : Number(tripPaymentForm.amount)
      };

      if (editingTripPaymentId) {
        await updateVehicleTripPayment(token, editingTripPaymentId, payload);
      } else {
        await createVehicleTripPayment(token, payload);
      }

      resetTripPaymentForm();
      await reloadData();
      if (payload.paymentStatus === "paid") {
        setActiveTab("data-archive");
        notifySuccess("Đã thu tiền và chuyển chuyến sang Dữ liệu.");
        return;
      }
      notifySuccess(
        editingTripPaymentId ? "Đã cập nhật phiếu tiền xe." : "Đã lưu phiếu tiền xe."
      );
    } catch (error) {
      notifyError(error, "Không thể lưu phiếu tiền xe.");
    } finally {
      setSavingTripPayment(false);
    }
  }

  function handleEditTripPayment(payment) {
    setActiveTab("vehicle-trip-payments");
    setEditingTripPaymentId(payment.id);
    setTripPaymentForm({
      scheduleNoteId: payment.scheduleNoteId ?? "",
      bookingRequestId: payment.bookingRequestId ?? payment.scheduleNote?.bookingRequestId ?? "",
      vehicleId: payment.vehicleId,
      title: payment.title ?? "",
      customerName:
        payment.customerName ??
        payment.scheduleNote?.customerName ??
        payment.bookingRequest?.customerName ??
        "",
      phoneNumber:
        payment.phoneNumber ??
        payment.scheduleNote?.phoneNumber ??
        payment.bookingRequest?.phoneNumber ??
        "",
      tripDate: toDateTimeLocalValue(payment.tripDate),
      pickupLocation:
        payment.pickupLocation ??
        payment.scheduleNote?.pickupLocation ??
        payment.bookingRequest?.pickupLocation ??
        "",
      dropoffLocation:
        payment.dropoffLocation ??
        payment.scheduleNote?.dropoffLocation ??
        payment.bookingRequest?.dropoffLocation ??
        "",
      amount: payment.amount ?? "",
      paymentStatus: payment.paymentStatus ?? "unpaid",
      note: payment.note ?? ""
    });
  }

  async function handleInlineUpdateTripPayment(id, payload) {
    setPageError("");

    try {
      const { scheduleStatus, ...paymentPayload } = payload;
      const normalizedPayload = {
        ...paymentPayload,
        tripDate: toIsoDateTimeLocalValue(paymentPayload.tripDate),
        scheduleNoteId: paymentPayload.scheduleNoteId || null,
        bookingRequestId: paymentPayload.bookingRequestId || null,
        title:
          paymentPayload.title.trim() ||
          (paymentPayload.customerName.trim()
            ? `Tiền xe ${paymentPayload.customerName.trim()}`
            : "Tiền xe"),
        amount: paymentPayload.amount === "" ? "" : Number(paymentPayload.amount)
      };

      await updateVehicleTripPayment(token, id, normalizedPayload);
      await syncScheduleStatusFromPayment(payload);
      if (editingTripPaymentId === id) resetTripPaymentForm();
      await reloadData();
      if (normalizedPayload.paymentStatus === "paid") {
        setActiveTab("data-archive");
        notifySuccess("Đã thu tiền và chuyển chuyến sang Dữ liệu.");
        return;
      }
      notifySuccess("Đã cập nhật phiếu tiền xe.");
    } catch (error) {
      notifyError(error, "Không thể cập nhật phiếu tiền xe.");
      throw error;
    }
  }

  async function handleCreateInlineTripPayment(payload) {
    setPageError("");

    try {
      const { scheduleStatus, ...paymentPayload } = payload;
      const normalizedPayload = {
        ...paymentPayload,
        tripDate: toIsoDateTimeLocalValue(paymentPayload.tripDate),
        scheduleNoteId: paymentPayload.scheduleNoteId || null,
        bookingRequestId: paymentPayload.bookingRequestId || null,
        title:
          paymentPayload.title.trim() ||
          (paymentPayload.customerName.trim()
            ? `Tiền xe ${paymentPayload.customerName.trim()}`
            : "Tiền xe"),
        amount: paymentPayload.amount === "" ? "" : Number(paymentPayload.amount)
      };

      await createVehicleTripPayment(token, normalizedPayload);
      await syncScheduleStatusFromPayment(payload);
      await reloadData();
      if (normalizedPayload.paymentStatus === "paid") {
        setActiveTab("data-archive");
        notifySuccess("Đã thu tiền và chuyển chuyến sang Dữ liệu.");
        return;
      }
      notifySuccess("Đã lưu phiếu tiền xe.");
    } catch (error) {
      notifyError(error, "Không thể lưu phiếu tiền xe.");
      throw error;
    }
  }

  async function handleDeleteTripPayment(id) {
    const confirmed = await requestConfirmation({
      title: "Chuyển phiếu tiền xe khỏi danh sách?",
      message: "Phiếu sẽ không còn ở danh sách hiện tại nhưng dữ liệu vẫn được giữ trong mục Dữ liệu.",
      confirmLabel: "Chuyển khỏi danh sách",
      variant: "warning"
    });
    if (!confirmed) return;

    try {
      await deleteVehicleTripPayment(token, id);
      if (editingTripPaymentId === id) resetTripPaymentForm();
      await reloadData();
      notifySuccess("Đã chuyển phiếu tiền xe sang mục Dữ liệu.");
    } catch (error) {
      notifyError(error, "Không thể chuyển phiếu tiền xe sang mục Dữ liệu.");
    }
  }

  function handleExpenseFormChange(event) {
    const { name, value } = event.target;

    if (name === "tripId") {
      const selectedTrip = trips.find((trip) => trip.id === value);
      setTripExpenseForm((current) => ({
        ...current,
        tripId: value,
        vehicleId: selectedTrip?.vehicleId ?? current.vehicleId,
        expenseDate: selectedTrip?.tripDate ? toExpenseDateInputValue(selectedTrip.tripDate) : current.expenseDate
      }));
      return;
    }

    if (name === "bookingRequestId") {
      const selectedBooking = bookings.find((booking) => booking.id === value);
      setTripExpenseForm((current) => ({
        ...current,
        bookingRequestId: value,
        vehicleId: selectedBooking?.assignedVehicleId ?? current.vehicleId,
        expenseDate: selectedBooking?.tripDate ? toExpenseDateInputValue(selectedBooking.tripDate) : current.expenseDate
      }));
      return;
    }

    setTripExpenseForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  function resetTripExpenseForm() {
    setEditingTripExpenseId("");
    setTripExpenseForm(tripExpenseFormInitial);
  }

  function handleEditExpense(expense) {
    setActiveTab("finance");
    setEditingTripExpenseId(expense.id);
    setTripExpenseForm({
      tripId: expense.tripId ?? "",
      bookingRequestId: expense.bookingRequestId ?? "",
      vehicleId: expense.vehicleId ?? "",
      title: expense.title ?? "",
      expenseType: expense.expenseType ?? "other",
      amount: expense.amount ?? "",
      expenseDate: toExpenseDateInputValue(expense.expenseDate),
      paidBy: expense.paidBy ?? "",
      note: expense.note ?? ""
    });
  }

  async function handleCreateExpense(event) {
    event.preventDefault();
    setSavingTripExpense(true);
    setPageError("");

    try {
      const payload = {
        ...tripExpenseForm,
        tripId: tripExpenseForm.tripId || null,
        bookingRequestId: tripExpenseForm.bookingRequestId || null,
        vehicleId: tripExpenseForm.vehicleId || null,
        title: tripExpenseForm.title.trim() || "Chi phí chuyến đi",
        amount: tripExpenseForm.amount === "" ? 0 : Number(tripExpenseForm.amount),
        expenseDate: tripExpenseForm.expenseDate || "",
        paidBy: tripExpenseForm.paidBy.trim(),
        note: tripExpenseForm.note.trim()
      };

      if (editingTripExpenseId) {
        await updateTripExpense(token, editingTripExpenseId, payload);
      } else {
        await createTripExpense(token, payload);
      }

      resetTripExpenseForm();
      await reloadData();
      notifySuccess(editingTripExpenseId ? "Đã cập nhật chi phí." : "Đã thêm chi phí chuyến.");
    } catch (error) {
      notifyError(error, "Không thể lưu chi phí.");
    } finally {
      setSavingTripExpense(false);
    }
  }

  async function handleDeleteExpense(id) {
    const confirmed = await requestConfirmation({
      title: "Xóa khoản chi phí?",
      message: "Khoản chi phí sẽ bị xóa và số liệu lợi nhuận có thể thay đổi.",
      confirmLabel: "Xóa chi phí"
    });
    if (!confirmed) return;

    try {
      if (editingTripExpenseId === id) resetTripExpenseForm();
      await deleteTripExpense(token, id);
      await reloadData();
      notifySuccess("Đã xóa chi phí.");
    } catch (error) {
      notifyError(error, "Không thể xóa chi phí.");
    }
  }

  function handleReminderFormChange(event) {
    const { name, value } = event.target;
    setReminderForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  function handleReminderTargetChange(event) {
    const { name, value } = event.target;

    if (name === "targetType") {
      setReminderForm((current) => ({
        ...current,
        targetType: value,
        targetId: "",
        bookingRequestId: "",
        scheduleNoteId: "",
        tripId: "",
        vehicleId: "",
        driverId: ""
      }));
      return;
    }

    setReminderForm((current) => {
      const next = {
        ...current,
        [name]: value
      };

      if (name === "bookingRequestId") {
        const booking = bookings.find((item) => item.id === value);
        next.targetId = value;
        next.title = booking?.customerName ? `Gọi ${booking.customerName}` : next.title;
        next.remindAt = booking?.tripDate ? toDateTimeLocalValue(booking.tripDate) : next.remindAt;
        next.vehicleId = booking?.assignedVehicleId ?? next.vehicleId;
        next.driverId = booking?.assignedDriverId ?? next.driverId;
      }

      if (name === "tripId") {
        const trip = trips.find((item) => item.id === value);
        next.targetId = value;
        next.title = trip?.title ? `Kiểm tra ${trip.title}` : next.title;
        next.remindAt = trip?.tripDate ? toDateTimeLocalValue(trip.tripDate) : next.remindAt;
        next.vehicleId = trip?.vehicleId ?? next.vehicleId;
        next.driverId = trip?.driverId ?? next.driverId;
      }

      if (name === "scheduleNoteId") {
        const note = allScheduleNotes.find((item) => item.id === value);
        next.targetId = value;
        next.title = note?.title ? `Kiểm tra ${note.title}` : next.title;
        next.remindAt = note?.tripDate ? toDateTimeLocalValue(note.tripDate) : next.remindAt;
        next.vehicleId = note?.vehicleId ?? next.vehicleId;
      }

      if (name === "vehicleId" || name === "driverId") {
        next.targetId = value;
      }

      return next;
    });
  }

  function resetReminderForm() {
    setEditingReminderId("");
    setReminderForm({
      ...reminderFormInitial,
      remindAt: toDateTimeLocalValue(new Date(Date.now() + 60 * 60 * 1000))
    });
  }

  function handleEditReminder(reminder) {
    setActiveTab("reminders");
    setEditingReminderId(reminder.id);
    setReminderForm({
      title: reminder.title ?? "",
      reminderType: reminder.reminderType ?? "manual",
      remindAt: toDateTimeLocalValue(reminder.remindAt),
      targetType: reminder.targetType ?? "",
      targetId: reminder.targetId ?? "",
      bookingRequestId: reminder.bookingRequestId ?? "",
      scheduleNoteId: reminder.scheduleNoteId ?? "",
      tripId: reminder.tripId ?? "",
      vehicleId: reminder.vehicleId ?? "",
      driverId: reminder.driverId ?? "",
      status: reminder.status ?? "pending",
      note: reminder.note ?? ""
    });
  }

  async function handleCreateReminder(event) {
    event.preventDefault();
    setSavingReminder(true);
    setPageError("");

    try {
      const payload = {
        ...reminderForm,
        bookingRequestId: reminderForm.bookingRequestId || null,
        scheduleNoteId: reminderForm.scheduleNoteId || null,
        tripId: reminderForm.tripId || null,
        vehicleId: reminderForm.vehicleId || null,
        driverId: reminderForm.driverId || null,
        targetType: reminderForm.targetType || null,
        targetId: reminderForm.targetId || null,
        title: reminderForm.title.trim(),
        remindAt: reminderForm.remindAt || "",
        note: reminderForm.note.trim()
      };

      if (editingReminderId) {
        await updateReminder(token, editingReminderId, payload);
      } else {
        await createReminder(token, payload);
      }

      resetReminderForm();
      await reloadData();
      notifySuccess(editingReminderId ? "Đã cập nhật nhắc việc." : "Đã tạo nhắc việc.");
    } catch (error) {
      notifyError(error, "Không thể lưu nhắc việc.");
    } finally {
      setSavingReminder(false);
    }
  }

  async function handleReminderStatus(id, status) {
    try {
      await updateReminderStatus(token, id, status);
      await reloadData();
      notifySuccess("Đã cập nhật trạng thái nhắc việc.");
    } catch (error) {
      notifyError(error, "Không thể cập nhật nhắc việc.");
    }
  }

  async function handleProcessDueReminders() {
    setProcessingReminders(true);
    setPageError("");

    try {
      const result = await processDueReminders(token);
      await reloadData();
      notifySuccess(
        "Đã chạy nhắc việc đến hạn.",
        `Gửi thành công ${result.sentCount ?? 0}, lỗi ${result.failedCount ?? 0}.`
      );
    } catch (error) {
      notifyError(error, "Không thể chạy nhắc việc.");
    } finally {
      setProcessingReminders(false);
    }
  }

  async function handleDeleteReminder(id) {
    const confirmed = await requestConfirmation({
      title: "Xóa nhắc việc?",
      message: "Nhắc việc này sẽ bị xóa và không còn được xử lý tự động.",
      confirmLabel: "Xóa nhắc việc"
    });
    if (!confirmed) return;

    try {
      if (editingReminderId === id) resetReminderForm();
      await deleteReminder(token, id);
      await reloadData();
      notifySuccess("Đã xóa nhắc việc.");
    } catch (error) {
      notifyError(error, "Không thể xóa nhắc việc.");
    }
  }

  function handleMaintenanceFormChange(event) {
    const { name, value } = event.target;
    setMaintenanceForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  function resetMaintenanceForm() {
    setEditingMaintenanceId("");
    setMaintenanceForm({
      ...maintenanceFormInitial,
      vehicleId: vehicles[0]?.id || ""
    });
  }

  async function handleCreateMaintenance(event) {
    event.preventDefault();
    setSavingMaintenance(true);
    setPageError("");

    try {
      const payload = {
        ...maintenanceForm,
        title:
          maintenanceForm.title.trim() ||
          (maintenanceForm.note.trim() ? "Ghi chú bảo dưỡng" : "Bảo dưỡng xe"),
        serviceDate: maintenanceForm.serviceDate || "",
        status: "completed"
      };

      if (editingMaintenanceId) {
        await updateVehicleMaintenance(token, editingMaintenanceId, payload);
      } else {
        await createVehicleMaintenance(token, payload);
      }

      resetMaintenanceForm();
      await reloadData();
      notifySuccess(
        editingMaintenanceId ? "Đã cập nhật bảo dưỡng xe." : "Đã tạo lịch bảo dưỡng mới."
      );
    } catch (error) {
      notifyError(error, "Không thể lưu bảo dưỡng xe.");
    } finally {
      setSavingMaintenance(false);
    }
  }

  function handleEditMaintenance(item) {
    setActiveTab("vehicle-maintenances");
    setEditingMaintenanceId(item.id);
    setMaintenanceForm({
      vehicleId: item.vehicleId,
      title: item.title ?? "",
      maintenanceType: item.maintenanceType ?? "oil_change",
      licensePlate: item.licensePlate ?? "",
      serviceDate: toDateInputValue(item.serviceDate),
      nextServiceDate: toDateInputValue(item.nextServiceDate),
      odometerKm: item.odometerKm ?? "",
      cost: item.cost ?? "",
      note: item.note ?? ""
    });
  }

  async function handleDeleteMaintenance(id) {
    const confirmed = await requestConfirmation({
      title: "Xóa lịch bảo dưỡng?",
      message: "Thông tin bảo dưỡng này sẽ bị xóa khỏi lịch sử quản lý xe.",
      confirmLabel: "Xóa bảo dưỡng"
    });
    if (!confirmed) return;

    try {
      await deleteVehicleMaintenance(token, id);
      if (editingMaintenanceId === id) resetMaintenanceForm();
      await reloadData();
      notifySuccess("Đã xóa lịch bảo dưỡng.");
    } catch (error) {
      notifyError(error, "Không thể xóa lịch bảo dưỡng.");
    }
  }
  function handleServiceFormChange(event) {
    const { name, value, type, checked } = event.target;
    setServiceForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : name === "sortOrder" ? Number(value) : value
    }));
  }

  function handleCategoryFormChange(event) {
    const { name, value, type, checked } = event.target;
    setCategoryForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : name === "sortOrder" ? Number(value) : value
    }));
  }

  async function handleCreateCategory(event) {
    event.preventDefault();
    setSavingCategory(true);
    setPageError("");
    try {
      if (editingCategoryId) {
        await updateVehicleCategory(token, editingCategoryId, {
          ...categoryForm,
          slug: slugify(categoryForm.name)
        });
      } else {
        await createVehicleCategory(token, {
          ...categoryForm,
          slug: slugify(categoryForm.name)
        });
        }
        setCategoryForm(categoryFormInitial);
        setEditingCategoryId("");
        await reloadData();
        notifySuccess(editingCategoryId ? "Đã cập nhật nhóm xe." : "Đã tạo nhóm xe mới.");
      } catch (error) {
        notifyError(error, "Không thể lưu nhóm xe.");
      } finally {
        setSavingCategory(false);
      }
  }

  function handleEditCategory(category) {
    setActiveTab("vehicle-categories");
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name,
      description: category.description ?? "",
      sortOrder: category.sortOrder ?? 0,
      isPublished: category.isPublished ?? true
    });
  }

  function handleQuickCreateVehicle(category) {
    const inferredSeatCount = Number(category.name.match(/\d+/)?.[0] ?? 4);
    setActiveTab("vehicles");
    setEditingVehicleId("");
    setVehicleFilterCategoryId(category.id);
    setVehicleSearch("");
    setVehicleForm({
      ...vehicleFormInitial,
      categoryId: category.id,
      seatCount: inferredSeatCount
    });
  }

  function resetCategoryForm() {
    setEditingCategoryId("");
    setCategoryForm(categoryFormInitial);
  }

  async function handleDeleteCategory(id) {
    const confirmed = await requestConfirmation({
      title: "Xóa nhóm xe?",
      message: "Nếu nhóm đang có xe, các xe và dữ liệu liên quan có thể bị xóa theo.",
      confirmLabel: "Xóa nhóm xe"
    });
    if (!confirmed) return;
    try {
      await deleteVehicleCategory(token, id);
      if (editingCategoryId === id) resetCategoryForm();
      await reloadData();
      notifySuccess("Đã xóa nhóm xe.");
    } catch (error) {
      notifyError(error, "Không thể xóa nhóm xe.");
    }
  }

  async function handleCreateService(event) {
    event.preventDefault();
    setSavingService(true);
    setPageError("");
    try {
      if (editingServiceId) {
        await updateService(token, editingServiceId, {
          ...serviceForm,
          slug: slugify(serviceForm.title)
        });
      } else {
        await createService(token, {
          ...serviceForm,
          slug: slugify(serviceForm.title)
        });
        }
        setServiceForm(serviceFormInitial);
        setEditingServiceId("");
        await reloadData();
        notifySuccess(editingServiceId ? "Đã cập nhật dịch vụ." : "Đã tạo dịch vụ mới.");
      } catch (error) {
        notifyError(error, "Không thể lưu dịch vụ.");
      } finally {
        setSavingService(false);
      }
  }

  function handleEditService(service) {
    setActiveTab("services");
    setEditingServiceId(service.id);
    setServiceForm({
      title: service.title,
      description: service.description ?? "",
      icon: service.icon ?? "",
      sortOrder: service.sortOrder ?? 0,
      isPublished: service.isPublished ?? true
    });
  }

  function resetServiceForm() {
    setEditingServiceId("");
    setServiceForm(serviceFormInitial);
  }

  async function handleDeleteService(id) {
    const confirmed = await requestConfirmation({
      title: "Xóa dịch vụ?",
      message: "Dịch vụ này sẽ không còn xuất hiện trên website.",
      confirmLabel: "Xóa dịch vụ"
    });
    if (!confirmed) return;
    try {
      await deleteService(token, id);
      await reloadData();
      notifySuccess("Đã xóa dịch vụ.");
    } catch (error) {
      notifyError(error, "Không thể xóa dịch vụ.");
    }
  }


  function handleVehicleFormChange(event) {
    const { name, value, type, checked } = event.target;
    if (name === "categoryId") {
      const selectedCategory = vehicleCategories.find((category) => category.id === value);
      const inferredSeatCount = Number(selectedCategory?.name.match(/\d+/)?.[0] ?? 4);
      setVehicleForm((current) => ({
        ...current,
        categoryId: value,
        seatCount: current.name ? current.seatCount : inferredSeatCount
      }));
      return;
    }

    setVehicleForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : name === "seatCount" ? Number(value) : value
    }));
  }

  async function handleCreateVehicle(event) {
    event.preventDefault();
    setSavingVehicle(true);
    setPageError("");
    try {
      const payload = {
        ...vehicleForm,
        slug: slugify(vehicleForm.name),
        features: vehicleForm.features
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      };

      if (editingVehicleId) {
        await updateVehicle(token, editingVehicleId, payload);
      } else {
        await createVehicle(token, payload);
      }

      setVehicleForm({
        ...vehicleFormInitial,
        categoryId: vehicleCategories[0]?.id || ""
      });
      setEditingVehicleId("");
      await reloadData();
      notifySuccess(editingVehicleId ? "Đã cập nhật xe." : "Đã tạo xe mới.");
    } catch (error) {
      notifyError(error, "Không thể lưu xe.");
    } finally {
      setSavingVehicle(false);
    }
  }

  async function handleDeleteVehicle(id) {
    const confirmed = await requestConfirmation({
      title: "Xóa xe và toàn bộ ảnh?",
      message: "Xe, bộ ảnh và các dữ liệu phụ thuộc có thể bị xóa. Thao tác này không thể hoàn tác trong admin.",
      confirmLabel: "Xóa xe"
    });
    if (!confirmed) return;
    try {
      await deleteVehicle(token, id);
      setSelectedVehicleId((current) => (current === id ? "" : current));
      await reloadData();
      notifySuccess("Đã xóa xe.");
    } catch (error) {
      notifyError(error, "Không thể xóa xe.");
    }
  }
  function handleEditVehicle(vehicle) {
    setActiveTab("vehicles");
    setEditingVehicleId(vehicle.id);
    setSelectedVehicleId(vehicle.id);
    setVehicleForm({
      categoryId: vehicle.categoryId,
      name: vehicle.name,
      seatCount: vehicle.seatCount,
      shortDescription: vehicle.shortDescription ?? "",
      description: vehicle.description ?? "",
      features: (vehicle.features ?? []).join(", "),
      isFeatured: vehicle.isFeatured,
      isPublished: vehicle.isPublished
    });
  }

  function handleDuplicateVehicle(vehicle) {
    setActiveTab("vehicles");
    setEditingVehicleId("");
    setVehicleFilterCategoryId(vehicle.categoryId);
    setVehicleForm({
      categoryId: vehicle.categoryId,
      name: `${vehicle.name} copy`,
      seatCount: vehicle.seatCount,
      shortDescription: vehicle.shortDescription ?? "",
      description: vehicle.description ?? "",
      features: (vehicle.features ?? []).join(", "),
      isFeatured: false,
      isPublished: false
    });
  }

  function resetVehicleForm() {
    setEditingVehicleId("");
    setVehicleForm({
      ...vehicleFormInitial,
      categoryId: vehicleCategories[0]?.id || ""
    });
  }

  function handleVehicleFilterChange(categoryId) {
    setVehicleFilterCategoryId(categoryId);
    setSelectedVehicleId("");
  }

  function handleVehicleSearchChange(value) {
    setVehicleSearch(value);
    setSelectedVehicleId("");
  }

  function handleSelectVehicle(vehicleId) {
    setSelectedVehicleId(vehicleId);
    setVehicleImageFilter("all");
  }

  async function handleVehicleImageUpload(vehicleId, files, imageType = "exterior") {
    if (!files?.length) return;
    setUploadingVehicleId(vehicleId);
    setPageError("");
    try {
      await uploadVehicleImages(token, vehicleId, files, imageType);
      await reloadData();
      notifySuccess("Tải ảnh lên thành công.");
    } catch (error) {
      notifyError(error, "Không thể tải ảnh lên.");
    } finally {
      setUploadingVehicleId("");
    }
  }

  async function handleDeleteVehicleImage(id) {
    const confirmed = await requestConfirmation({
      title: "Xóa ảnh xe?",
      message: "Ảnh sẽ bị gỡ khỏi thư viện của xe.",
      confirmLabel: "Xóa ảnh"
    });
    if (!confirmed) return;
    try {
      await deleteVehicleImage(token, id);
      await reloadData();
      notifySuccess("Đã xóa ảnh xe.");
    } catch (error) {
      notifyError(error, "Không thể xóa ảnh xe.");
    }
  }

  async function handleSetPrimaryImage(id) {
    try {
      await updateVehicleImage(token, id, { isPrimary: true });
      await reloadData();
      notifySuccess("Đã đặt ảnh đại diện.");
    } catch (error) {
      notifyError(error, "Không thể cập nhật ảnh.");
    }
  }

  async function handleImageTypeChange(id, imageType) {
    try {
      await updateVehicleImage(token, id, { imageType });
      await reloadData();
      notifySuccess(
        imageType === "interior" ? "Đã chuyển sang ảnh nội thất." : "Đã chuyển sang ảnh ngoại thất."
      );
    } catch (error) {
      notifyError(error, "Không thể cập nhật loại ảnh.");
    }
  }

  async function handleImageSortOrderChange(id, sortOrder) {
    try {
      await updateVehicleImage(token, id, { sortOrder: Number(sortOrder) });
      await reloadData();
      notifySuccess("Đã cập nhật thứ tự ảnh.");
    } catch (error) {
      notifyError(error, "Không thể cập nhật thứ tự ảnh.");
    }
  }

  async function handleImageAltTextBlur(id, altText) {
    try {
      await updateVehicleImage(token, id, { altText });
      await reloadData();
      notifySuccess("Đã cập nhật mô tả ảnh.");
    } catch (error) {
      notifyError(error, "Không thể cập nhật mô tả ảnh.");
    }
  }

  function handleSettingValueChange(id, value) {
    setSiteSettings((current) => current.map((item) => (item.id === id ? { ...item, value } : item)));
  }

  function handleSettingFormChange(event) {
    const { name, value } = event.target;
    setSettingForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSaveSetting(setting) {
    setSavingSettingId(setting.id);
    setPageError("");
    try {
      await updateSiteSetting(token, setting.id, {
        key: setting.key,
        value: setting.value,
        group: setting.group
      });
      await reloadData();
      notifySuccess("Đã cập nhật nội dung website.");
    } catch (error) {
      notifyError(error, "Không thể cập nhật nội dung website.");
    } finally {
      setSavingSettingId("");
    }
  }

  async function handleCreateSetting(event) {
    event.preventDefault();
    setSavingNewSetting(true);
    setPageError("");
    try {
      await createSiteSetting(token, settingForm);
      setSettingForm(settingFormInitial);
      await reloadData();
      notifySuccess("Đã tạo cấu hình mới.");
    } catch (error) {
      notifyError(error, "Không thể tạo cấu hình.");
    } finally {
      setSavingNewSetting(false);
    }
  }

  async function handleDeleteSetting(setting) {
    const confirmed = await requestConfirmation({
      title: "Xóa cấu hình website?",
      message: `Cấu hình "${setting.key}" sẽ bị xóa và có thể làm thay đổi nội dung hiển thị.`,
      confirmLabel: "Xóa cấu hình"
    });
    if (!confirmed) return;
    try {
      await deleteSiteSetting(token, setting.id);
      await reloadData();
      notifySuccess("Đã xóa cấu hình.");
    } catch (error) {
      notifyError(error, "Không thể xóa cấu hình.");
    }
  }

  async function handleUploadSiteLogo(file) {
    if (!file) return;

    setUploadingLogo(true);
    setPageError("");

    try {
      const uploadResult = await uploadSiteLogo(token, file);
      const existing = siteSettings.find((setting) => setting.key === "logo_url");
      const payload = {
        key: "logo_url",
        value: uploadResult.imageUrl,
        group: "branding"
      };

      if (existing) {
        await updateSiteSetting(token, existing.id, payload);
      } else {
        await createSiteSetting(token, payload);
      }

      await reloadData();
      notifySuccess("Đã cập nhật logo nhà xe.");
    } catch (error) {
      notifyError(error, "Không thể tải logo lên.");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleUploadHeroBackground(file) {
    if (!file) return;

    setUploadingHeroBackground(true);
    setPageError("");

    try {
      const uploadResult = await uploadHeroBackground(token, file);
      const existing = siteSettings.find((setting) => setting.key === "hero_background_url");
      const payload = {
        key: "hero_background_url",
        value: uploadResult.imageUrl,
        group: "homepage"
      };

      if (existing) {
        await updateSiteSetting(token, existing.id, payload);
      } else {
        await createSiteSetting(token, payload);
      }

      await reloadData();
      notifySuccess("Đã cập nhật ảnh nền hero.");
    } catch (error) {
      notifyError(error, "Không thể tải ảnh nền hero lên.");
    } finally {
      setUploadingHeroBackground(false);
    }
  }

  async function handleSaveTelegramSettings(telegramSettings) {
    setSavingTelegramSettings(true);
    setPageError("");

    const storedBotToken =
      siteSettings.find((setting) => setting.key === "telegram_bot_token")?.value ?? "";
    const resolvedBotToken = telegramSettings.botToken?.trim() || storedBotToken;
    const resolvedDefaultChatIds = telegramSettings.defaultChatIds?.trim() ?? "";

    if (telegramSettings.enabled && (!resolvedBotToken || !resolvedDefaultChatIds)) {
      setSavingTelegramSettings(false);
      notifyError(
        new Error("Khi bật Telegram, bạn cần có bot token và ít nhất một nhóm nhận mặc định."),
        "Thiếu cấu hình Telegram."
      );
      return;
    }
    const entries = [
      { key: "telegram_enabled", value: String(Boolean(telegramSettings.enabled)), group: "notifications" },
      { key: "telegram_bot_token", value: resolvedBotToken, group: "notifications" },
      { key: "telegram_chat_id", value: resolvedDefaultChatIds, group: "notifications" },
      {
        key: "telegram_chat_id_system",
        value: telegramSettings.systemChatIds ?? "",
        group: "notifications"
      },
      {
        key: "telegram_chat_id_booking_created",
        value: telegramSettings.bookingCreatedChatIds ?? "",
        group: "notifications"
      },
      {
        key: "telegram_chat_id_booking_updated",
        value: telegramSettings.bookingUpdatedChatIds ?? "",
        group: "notifications"
      },
      {
        key: "telegram_chat_id_booking_deleted",
        value: telegramSettings.bookingDeletedChatIds ?? "",
        group: "notifications"
      },
      {
        key: "telegram_notify_booking_created",
        value: String(Boolean(telegramSettings.notifyBookingCreated)),
        group: "notifications"
      },
      {
        key: "telegram_notify_booking_updated",
        value: String(Boolean(telegramSettings.notifyBookingUpdated)),
        group: "notifications"
      },
      {
        key: "telegram_notify_booking_deleted",
        value: String(Boolean(telegramSettings.notifyBookingDeleted)),
        group: "notifications"
      }
    ];

    try {
      for (const entry of entries) {
        const existing = siteSettings.find((setting) => setting.key === entry.key);

        if (existing) {
          await updateSiteSetting(token, existing.id, entry);
        } else {
          await createSiteSetting(token, entry);
        }
      }

      await reloadData();
      notifySuccess("Đã lưu cấu hình Telegram.");
    } catch (error) {
      notifyError(error, "Không thể lưu cấu hình Telegram.");
    } finally {
      setSavingTelegramSettings(false);
    }
  }

  async function handleTelegramTest() {
    setTestingTelegram(true);
    setPageError("");

    try {
      const data = await sendTelegramTest(token);
      await reloadNotificationLogs();
      notifySuccess("Đã gửi tin nhắn test Telegram.", data.message ?? "");
    } catch (error) {
      notifyError(error, "Không thể gửi test Telegram.");
    } finally {
      setTestingTelegram(false);
    }
  }

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-admin-sand px-6 text-admin-ink">
        <div className="rounded-[2rem] border border-admin-line bg-white px-8 py-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <p className="mt-4 text-base font-semibold text-slate-600">
            Đang kiểm tra phiên đăng nhập...
          </p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <LoginView
        siteName={settingsMap.site_name}
        siteTagline={settingsMap.site_tagline}
        logoUrl={adminLogoUrl}
        loginForm={loginForm}
        authState={authState}
        handleLoginChange={handleLoginChange}
        handleLoginSubmit={handleLoginSubmit}
      />
    );
  }

  return (
    <div className="admin-shell bg-admin-sand text-admin-ink">
      <ConfirmDialog
        open={Boolean(confirmation)}
        title={confirmation?.title}
        message={confirmation?.message}
        confirmLabel={confirmation?.confirmLabel}
        variant={confirmation?.variant}
        onConfirm={() => resolveConfirmation(true)}
        onCancel={() => resolveConfirmation(false)}
      />

      <div className="pointer-events-none fixed left-4 right-4 top-4 z-[90] flex flex-col gap-3 sm:left-auto sm:w-full sm:max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`admin-toast pointer-events-auto ${
              toast.type === "success" ? "admin-toast-success" : "admin-toast-error"
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold">{toast.title}</p>
              {toast.description ? (
                <p className="mt-1 text-sm leading-6 text-slate-600">{toast.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 rounded-full px-2 py-1 text-sm font-bold text-slate-500 transition hover:bg-black/5 hover:text-slate-900"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Đóng menu quản trị"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[1px] lg:hidden"
        />
      ) : null}

      <div className="grid h-screen w-full lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside
          id="admin-navigation"
          className={`admin-sidebar admin-scrollbar fixed inset-y-0 left-0 z-50 flex h-full w-[min(20rem,86vw)] flex-col overflow-y-auto px-4 py-5 text-white transition-transform duration-200 lg:static lg:z-auto lg:w-auto lg:translate-x-0 ${
            sidebarOpen ? "visible translate-x-0" : "invisible -translate-x-full lg:visible"
          }`}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/20 lg:hidden"
            aria-label="Đóng menu"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
          <div className="mt-4 pl-1 text-left">
              {adminBrandLine !== adminSiteName ? (
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-300">
                  Nhà xe
                </p>
              ) : null}
              <h1 className="admin-title mt-1 whitespace-nowrap text-left text-[1.75rem] font-extrabold leading-none text-white">
                {adminBrandLine}
              </h1>
              <p className="mt-3 inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-200">
                {ROLE_LABELS[currentRole] ?? currentRole}
              </p>
          </div>

          <nav className="mt-8 space-y-5">
            {visibleTabSections.map((section) => (
              <div key={section.label}>
                <p className="px-4 text-[0.68rem] font-extrabold uppercase tracking-[0.24em] text-slate-500">
                  {section.label}
                </p>
                <div className="mt-2 space-y-1.5">
                  {section.tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleAdminTabSelect(tab.id)}
                      className={`block w-full rounded-[1rem] px-4 py-3 text-left transition ${
                        activeTab === tab.id
                          ? "bg-white text-slate-950 shadow-[0_14px_40px_rgba(15,23,42,0.18)]"
                          : "bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <p className="pl-0.5 text-left text-sm font-extrabold">{tab.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-auto space-y-3 pt-6">
            {passwordState.open ? (
              <form
                onSubmit={handleChangePasswordSubmit}
                className="rounded-[1rem] border border-white/10 bg-white/5 px-4 py-4 text-left"
              >
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-300">
                  Tài khoản
                </p>
                <p className="mt-2 text-sm font-bold text-white">Đổi mật khẩu</p>
                <div className="mt-4 space-y-3">
                  <input
                    className="admin-field !border-white/10 !bg-white !text-slate-950"
                    type="password"
                    name="currentPassword"
                    placeholder="Mật khẩu hiện tại"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordFormChange}
                  />
                  <input
                    className="admin-field !border-white/10 !bg-white !text-slate-950"
                    type="password"
                    name="newPassword"
                    placeholder="Mật khẩu mới"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordFormChange}
                  />
                  <input
                    className="admin-field !border-white/10 !bg-white !text-slate-950"
                    type="password"
                    name="confirmPassword"
                    placeholder="Nhập lại mật khẩu mới"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordFormChange}
                  />
                </div>
                {passwordState.error ? (
                  <p className="mt-3 text-sm font-semibold text-rose-300">
                    {passwordState.error}
                  </p>
                ) : null}
                {passwordState.message ? (
                  <p className="mt-3 text-sm font-semibold text-slate-200">
                    {passwordState.message}
                  </p>
                ) : null}
                <div className="mt-4 flex gap-2">
                  <button
                    type="submit"
                    className="admin-button-primary flex-1 !rounded-[0.9rem]"
                    disabled={passwordState.loading}
                  >
                    {passwordState.loading ? "Đang lưu" : "Lưu"}
                  </button>
                  <button
                    type="button"
                    onClick={togglePasswordPanel}
                    className="admin-button-ghost flex-1 !rounded-[0.9rem] !border-white/15 !bg-transparent !text-white"
                  >
                    Đóng
                  </button>
                </div>
              </form>
            ) : null}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={togglePasswordPanel}
                className="w-full rounded-[1rem] border border-teal-400/20 bg-teal-500/15 px-4 py-3 text-white transition hover:bg-teal-500/20"
              >
                <p className="text-center text-sm font-extrabold">Đổi mật khẩu</p>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-[1rem] border border-rose-400/20 bg-rose-500/15 px-4 py-3 text-white transition hover:bg-rose-500/20"
              >
                <p className="text-center text-sm font-extrabold">
                  Đăng xuất
                </p>
              </button>
            </div>
          </div>
        </aside>

        <main className="flex h-full min-h-0 flex-col gap-3 overflow-hidden p-3 sm:gap-4 sm:p-4 lg:p-6">
          <header className="admin-panel shrink-0 rounded-[1.25rem] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.9rem] border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-teal-400 hover:bg-teal-50 hover:text-teal-800 lg:hidden"
                  aria-label="Mở menu quản trị"
                  aria-controls="admin-navigation"
                  aria-expanded={sidebarOpen}
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
                  </svg>
                </button>
                <div className="min-w-0">
                  <h2 className="admin-title text-2xl font-extrabold text-admin-ink sm:text-3xl lg:text-4xl">
                    {activeTabMeta.label}
                  </h2>
                  {getTabDescription(activeTab) ? (
                    <p className="mt-2 text-sm font-medium text-admin-steel">
                      {getTabDescription(activeTab)}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </header>

          {pageError ? (
            <div className="flex shrink-0 items-center justify-between gap-3 rounded-[1.5rem] bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              <span>{pageError}</span>
              {token ? (
                <button type="button" onClick={retryActiveTabLoad} className="shrink-0 underline">
                  Thử tải lại
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="admin-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
            {loadingTab === activeTab ? (
              <div className="admin-card rounded-2xl p-8 text-center text-sm font-semibold text-slate-600">
                Đang tải dữ liệu mục này…
              </div>
            ) : null}
            <div className={loadingTab === activeTab ? "hidden" : ""}>
              {activeTab === "dashboard" ? (
                <DashboardTab
                  stats={stats}
                  bookings={bookings}
                  scheduleNotes={scheduleNotes}
                  trips={trips}
                  drivers={drivers}
                  pendingBookings={dispatchPendingBookings}
                  assignedDrivers={dispatchAssignedDrivers}
                  busyVehicles={dispatchBusyVehicles}
                  payments={activeVehicleTripPayments}
                  reminders={reminders}
                  handleOpenBookings={openBookingsTab}
                  handleOpenScheduleNotes={openScheduleNotesTab}
                  handleOpenTrips={openTripsTab}
                  handleOpenVehicleTripPayments={openVehicleTripPaymentsTab}
                />
              ) : null}
            {activeTab === "admin-users" ? (
              <AdminUsersTab
                adminUsers={adminUsers}
                adminUserForm={adminUserForm}
                editingAdminUserId={editingAdminUserId}
                savingAdminUser={savingAdminUser}
                currentAdmin={currentAdmin}
                handleAdminUserFormChange={handleAdminUserFormChange}
                handleAdminUserRoleChange={handleAdminUserRoleChange}
                handleAdminUserPermissionToggle={handleAdminUserPermissionToggle}
                handleApplyAdminUserPermissionPreset={handleApplyAdminUserPermissionPreset}
                handleCreateAdminUser={handleCreateAdminUser}
                handleEditAdminUser={handleEditAdminUser}
                handleDeleteAdminUser={handleDeleteAdminUser}
                handleToggleAdminUserActive={handleToggleAdminUserActive}
                handleResetAdminUserPassword={handleResetAdminUserPassword}
                resetAdminUserForm={resetAdminUserForm}
              />
            ) : null}
            {activeTab === "activity-logs" ? (
              <ActivityLogsTab activityLogs={activityLogs} />
            ) : null}
            {activeTab === "monthly-reports" ? (
              <MonthlyReportsTab
                bookings={bookings}
                notes={allScheduleNotes}
                payments={[...vehicleTripPayments, ...archivedVehicleTripPayments]}
                expenses={tripExpenses}
                maintenances={vehicleMaintenances}
                trips={trips}
              />
            ) : null}
            {activeTab === "vehicle-categories" ? (
              <VehicleCategoriesTab
                editingCategoryId={editingCategoryId}
                categoryForm={categoryForm}
                savingCategory={savingCategory}
                vehicleCategories={vehicleCategories}
                handleQuickCreateVehicle={handleQuickCreateVehicle}
                handleCategoryFormChange={handleCategoryFormChange}
                handleCreateCategory={handleCreateCategory}
                handleEditCategory={handleEditCategory}
                handleDeleteCategory={handleDeleteCategory}
                resetCategoryForm={resetCategoryForm}
              />
            ) : null}
            {activeTab === "bookings" ? (
                <BookingsTab
                    bookings={bookingPageData.items}
                    bookingPageData={bookingPageData}
                    bookingQuery={bookingQuery}
                    bookingPageLoading={bookingPageLoading}
                    onBookingQueryChange={handleBookingQueryChange}
                    fetchAllFilteredBookings={fetchAllFilteredBookingRecords}
                    handleBookingStatusChange={handleBookingStatusChange}
                    vehicles={vehicles}
                    drivers={drivers}
                    highlightedBookingIds={highlightedBookingIds}
                    bookingStatusFilter={bookingStatusFilter}
                    handleBookingStatusFilterChange={handleBookingStatusFilterChange}
                    handleInlineUpdateBooking={handleInlineUpdateBooking}
                  handleDeleteBooking={handleDeleteBooking}
                />
            ) : null}
            {activeTab === "services" ? (
              <ServicesTab
                editingServiceId={editingServiceId}
                serviceForm={serviceForm}
                savingService={savingService}
                services={services}
                handleServiceFormChange={handleServiceFormChange}
                handleCreateService={handleCreateService}
                handleEditService={handleEditService}
                handleDeleteService={handleDeleteService}
                resetServiceForm={resetServiceForm}
              />
            ) : null}
            {activeTab === "vehicles" ? (
              <VehiclesTab
                editingVehicleId={editingVehicleId}
                selectedVehicleId={selectedVehicleId}
                vehicleFilterCategoryId={vehicleFilterCategoryId}
                vehicleSearch={vehicleSearch}
                vehicleForm={vehicleForm}
                vehicleCategories={vehicleCategories}
                savingVehicle={savingVehicle}
                vehicles={vehicles}
                uploadingVehicleId={uploadingVehicleId}
                vehicleImageUploadType={vehicleImageUploadType}
                vehicleImageFilter={vehicleImageFilter}
                setVehicleImageUploadType={setVehicleImageUploadType}
                setVehicleImageFilter={setVehicleImageFilter}
                handleVehicleFormChange={handleVehicleFormChange}
                handleCreateVehicle={handleCreateVehicle}
                resetVehicleForm={resetVehicleForm}
                handleEditVehicle={handleEditVehicle}
                handleDuplicateVehicle={handleDuplicateVehicle}
                handleDeleteVehicle={handleDeleteVehicle}
                handleDeleteVehicleImage={handleDeleteVehicleImage}
                handleSetPrimaryImage={handleSetPrimaryImage}
                handleImageTypeChange={handleImageTypeChange}
                handleImageAltTextBlur={handleImageAltTextBlur}
                handleImageSortOrderChange={handleImageSortOrderChange}
                handleVehicleImageUpload={handleVehicleImageUpload}
                handleVehicleFilterChange={handleVehicleFilterChange}
                handleVehicleSearchChange={handleVehicleSearchChange}
                handleSelectVehicle={handleSelectVehicle}
                resolveAdminAssetUrl={resolveAdminAssetUrl}
              />
            ) : null}
            {activeTab === "drivers" ? (
              <DriversTab
                drivers={drivers}
                driverForm={driverForm}
                editingDriverId={editingDriverId}
                savingDriver={savingDriver}
                handleDriverFormChange={handleDriverFormChange}
                handleCreateDriver={handleCreateDriver}
                handleEditDriver={handleEditDriver}
                handleDeleteDriver={handleDeleteDriver}
                resetDriverForm={resetDriverForm}
              />
            ) : null}
            {activeTab === "customers" ? (
              <CustomersTab
                customers={customerPageData.items}
                customerPageData={customerPageData}
                customerQuery={customerQuery}
                customerPageLoading={customerPageLoading}
                onCustomerQueryChange={handleCustomerQueryChange}
                customerForm={customerForm}
                editingCustomerId={editingCustomerId}
                savingCustomer={savingCustomer}
                handleCustomerFormChange={handleCustomerFormChange}
                handleCreateCustomer={handleCreateCustomer}
                handleEditCustomer={handleEditCustomer}
                handleDeleteCustomer={handleDeleteCustomer}
                resetCustomerForm={resetCustomerForm}
              />
            ) : null}
            {activeTab === "trips" ? (
              <TripsTab
                trips={tripPageData.items}
                tripPageData={tripPageData}
                tripQuery={tripQuery}
                tripPageLoading={tripPageLoading}
                onTripQueryChange={handleTripQueryChange}
                fetchAllFilteredTrips={fetchAllFilteredTripRecords}
                vehicles={vehicles}
                drivers={drivers}
                tripForm={tripForm}
                editingTripId={editingTripId}
                savingTrip={savingTrip}
                tripAssignableBookings={tripAssignableBookings}
                handleTripFormChange={handleTripFormChange}
                handleTripBookingToggle={handleTripBookingToggle}
                handleCreateTrip={handleCreateTrip}
                handleEditTrip={handleEditTrip}
                handleDeleteTrip={handleDeleteTrip}
                handleTripNextStep={handleTripNextStep}
                handleOpenTripVoucher={handleOpenTripVoucher}
                resetTripForm={resetTripForm}
              />
            ) : null}
            {activeTab === "dispatch-today" ? (
              <DispatchTodayTab
                todayBookings={dispatchTodayBookings}
                pendingBookings={dispatchPendingBookings}
                trips={trips}
                reminders={reminders}
                payments={vehicleTripPayments}
                busyVehicles={dispatchBusyVehicles}
                readyVehicles={dispatchReadyVehicles}
                availableDrivers={dispatchAvailableDrivers}
                assignedDrivers={dispatchAssignedDrivers}
                handleOpenBookings={openBookingsTab}
                handleOpenScheduleNotes={openScheduleNotesTab}
                handleOpenBookingVoucher={handleOpenBookingVoucher}
              />
            ) : null}
            {activeTab === "dispatch-calendar" ? (
              <DispatchCalendarTab
                bookings={bookings}
                trips={trips}
                scheduleNotes={allScheduleNotes}
                vehicles={vehicles}
                drivers={drivers}
                handleOpenBookings={openBookingsTab}
                handleOpenScheduleNotes={openScheduleNotesTab}
                handleOpenTrips={openTripsTab}
              />
            ) : null}
            {activeTab === "finance" ? (
              <FinanceOverviewTab
                payments={[...vehicleTripPayments, ...archivedVehicleTripPayments]}
                expenses={tripExpenses}
                trips={trips}
                vehicles={vehicles}
                bookings={bookings}
                expenseForm={tripExpenseForm}
                editingExpenseId={editingTripExpenseId}
                savingExpense={savingTripExpense}
                handleExpenseFormChange={handleExpenseFormChange}
                handleCreateExpense={handleCreateExpense}
                handleEditExpense={handleEditExpense}
                handleDeleteExpense={handleDeleteExpense}
                resetExpenseForm={resetTripExpenseForm}
              />
            ) : null}
            {activeTab === "reminders" ? (
              <RemindersTab
                reminders={reminders}
                bookings={bookings}
                trips={trips}
                scheduleNotes={allScheduleNotes}
                vehicles={vehicles}
                drivers={drivers}
                reminderForm={reminderForm}
                editingReminderId={editingReminderId}
                savingReminder={savingReminder}
                processingReminders={processingReminders}
                handleReminderFormChange={handleReminderFormChange}
                handleReminderTargetChange={handleReminderTargetChange}
                handleCreateReminder={handleCreateReminder}
                handleEditReminder={handleEditReminder}
                handleDeleteReminder={handleDeleteReminder}
                handleReminderStatus={handleReminderStatus}
                handleProcessDueReminders={handleProcessDueReminders}
                resetReminderForm={resetReminderForm}
              />
            ) : null}
            {activeTab === "schedule-notes" ? (
              <ScheduleNotesManager
                  notes={scheduleListNotes}
                  vehicles={vehicles}
                  drivers={drivers}
                  bookings={scheduleQueueBookings}
                  payments={vehicleTripPayments}
                  scheduleNoteForm={scheduleNoteForm}
                editingScheduleNoteId={editingScheduleNoteId}
                  savingScheduleNote={savingScheduleNote}
                  handleScheduleNoteFormChange={handleScheduleNoteFormChange}
                  handleCreateScheduleNote={handleCreateScheduleNote}
                  handleEditScheduleNote={handleEditScheduleNote}
                  handleInlineUpdateScheduleNote={handleInlineUpdateScheduleNote}
                  handleInlineUpdateBooking={handleInlineUpdateBooking}
                  handleCreateTripFromBooking={handleCreateTripFromBooking}
                  handleDeleteScheduleNote={handleDeleteScheduleNote}
                  resetScheduleNoteForm={resetScheduleNoteForm}
                handleDeleteBooking={handleDeleteBooking}
              />
            ) : null}
            {activeTab === "vehicle-trip-payments" ? (
              <VehicleTripPaymentsTab
                  payments={activeVehicleTripPayments}
                  linkedPayments={[...vehicleTripPayments, ...archivedVehicleTripPayments]}
                  scheduleNotes={paymentFlowScheduleItems}
                  bookings={paymentFlowBookings}
                  vehicles={vehicles}
                tripPaymentForm={tripPaymentForm}
                editingTripPaymentId={editingTripPaymentId}
                  savingTripPayment={savingTripPayment}
                  handleTripPaymentFormChange={handleTripPaymentFormChange}
                  handleCreateTripPayment={handleCreateTripPayment}
                  handleCreateInlineTripPayment={handleCreateInlineTripPayment}
                  handleEditTripPayment={handleEditTripPayment}
                  handleInlineUpdateTripPayment={handleInlineUpdateTripPayment}
                handleDeleteTripPayment={handleDeleteTripPayment}
                resetTripPaymentForm={resetTripPaymentForm}
                handleDeleteBooking={handleDeleteBooking}
                handleDeleteScheduleNote={handleDeleteScheduleNote}
              />
            ) : null}
            {activeTab === "data-archive" ? (
              <DataArchiveTab
                  bookings={archivedBookingItems}
                  notes={scheduleNotes}
                  archivedNotes={archivedScheduleNotes}
                  payments={vehicleTripPayments}
                  archivedPayments={archivedVehicleTripPayments}
                />
            ) : null}
            {activeTab === "vehicle-maintenances" ? (
              <VehicleMaintenancesTab
                maintenances={vehicleMaintenances}
                vehicles={vehicles}
                maintenanceForm={maintenanceForm}
                editingMaintenanceId={editingMaintenanceId}
                savingMaintenance={savingMaintenance}
                handleMaintenanceFormChange={handleMaintenanceFormChange}
                handleCreateMaintenance={handleCreateMaintenance}
                handleEditMaintenance={handleEditMaintenance}
                handleDeleteMaintenance={handleDeleteMaintenance}
                resetMaintenanceForm={resetMaintenanceForm}
              />
            ) : null}
            {activeTab === "settings" ? (
              <SettingsTab
                siteSettings={siteSettings}
                notificationLogs={notificationLogs}
                logoUrl={adminLogoUrl}
                savingSettingId={savingSettingId}
                savingTelegramSettings={savingTelegramSettings}
                settingForm={settingForm}
                savingNewSetting={savingNewSetting}
                testingTelegram={testingTelegram}
                uploadingLogo={uploadingLogo}
                uploadingHeroBackground={uploadingHeroBackground}
                handleUploadSiteLogo={handleUploadSiteLogo}
                handleUploadHeroBackground={handleUploadHeroBackground}
                handleSettingValueChange={handleSettingValueChange}
                handleSaveSetting={handleSaveSetting}
                handleSaveTelegramSettings={handleSaveTelegramSettings}
                handleSettingFormChange={handleSettingFormChange}
                handleCreateSetting={handleCreateSetting}
                handleDeleteSetting={handleDeleteSetting}
                handleTelegramTest={handleTelegramTest}
              />
            ) : null}
            </div>
          </div>
        </main>
      </div>

      <DispatchVoucherModal
        voucher={dispatchVoucher}
        onClose={handleCloseDispatchVoucher}
      />
    </div>
  );
}

