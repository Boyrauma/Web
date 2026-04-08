import { useEffect, useMemo, useState } from "react";
import BookingsTab from "./components/BookingsTab";
import DashboardTab from "./components/DashboardTab";
import LoginView from "./components/LoginView";
import ScheduleNotesTab from "./components/ScheduleNotesTab";
import ServicesTab from "./components/ServicesTab";
import SettingsTab from "./components/SettingsTab";
import VehicleCategoriesTab from "./components/VehicleCategoriesTab";
import VehicleMaintenancesTab from "./components/VehicleMaintenancesTab";
import VehiclesTab from "./components/VehiclesTab";
import {
  changeAdminPassword,
  clearToken,
  connectBookingStream,
  createScheduleNote,
  createSiteSetting,
  createVehicleMaintenance,
  createVehicleCategory,
  createService,
  createVehicle,
  deleteBooking,
  deleteScheduleNote,
  deleteSiteSetting,
  deleteVehicleMaintenance,
  deleteVehicleCategory,
  deleteService,
  deleteVehicle,
  deleteVehicleImage,
  fetchAdminBookings,
  fetchAdminDashboard,
  fetchScheduleNotes,
  fetchNotificationLogs,
  fetchAdminServices,
  fetchPublicSiteSettings,
  fetchSiteSettings,
  fetchVehicleMaintenances,
  fetchVehicleCategories,
  fetchVehicles,
  getStoredToken,
  loginAdmin,
  resolveAdminAssetUrl,
  sendTelegramTest,
  storeToken,
  updateBookingStatus,
  updateScheduleNote,
  updateVehicleCategory,
  updateVehicleMaintenance,
  updateService,
  updateSiteSetting,
  uploadSiteLogo,
  updateVehicle,
  updateVehicleImage,
  uploadVehicleImages
} from "./services/api";
import { applyDocumentBranding } from "./utils/branding";
import { slugify } from "./utils/slugify";

const tabs = [
  { id: "dashboard", label: "Dashboard", eyebrow: "Tổng quan" },
  { id: "vehicle-categories", label: "Nhóm xe", eyebrow: "Phân loại" },
  { id: "vehicles", label: "Xe", eyebrow: "Đội xe" },
  { id: "schedule-notes", label: "Lịch xe", eyebrow: "Vận hành" },
  { id: "vehicle-maintenances", label: "Bảo dưỡng xe", eyebrow: "Bảo trì" },
  { id: "bookings", label: "Booking", eyebrow: "Khách hàng" },
  { id: "services", label: "Dịch vụ", eyebrow: "Public site" },
  { id: "settings", label: "Nội dung web", eyebrow: "Branding" }
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
  serviceDate: "",
  nextServiceDate: "",
  odometerKm: "",
  cost: "",
  status: "completed",
  note: ""
};

function getTabDescription(tabId) {
  if (tabId === "dashboard") return "Tổng quan nhanh.";
  if (tabId === "vehicle-categories") return "Phân loại đội xe.";
  if (tabId === "vehicles") return "Quản lý xe và ảnh.";
  if (tabId === "schedule-notes") return "Theo dõi xe đã đặt.";
  if (tabId === "vehicle-maintenances") return "Nhật ký thay dầu, bảo dưỡng.";
  if (tabId === "bookings") return "Xử lý yêu cầu khách.";
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

function toDateInputValue(value) {
  if (!value) return "";

  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [token, setToken] = useState(() => getStoredToken());
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });
  const [authState, setAuthState] = useState({ loading: false, error: "" });
  const [pageError, setPageError] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [scheduleNotes, setScheduleNotes] = useState([]);
  const [vehicleMaintenances, setVehicleMaintenances] = useState([]);
  const [services, setServices] = useState([]);
  const [vehicleCategories, setVehicleCategories] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [siteSettings, setSiteSettings] = useState([]);
  const [notificationLogs, setNotificationLogs] = useState([]);
  const [vehicleFilterCategoryId, setVehicleFilterCategoryId] = useState("all");
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [settingForm, setSettingForm] = useState(settingFormInitial);
  const [scheduleNoteForm, setScheduleNoteForm] = useState(scheduleNoteFormInitial);
  const [editingScheduleNoteId, setEditingScheduleNoteId] = useState("");
  const [maintenanceForm, setMaintenanceForm] = useState(maintenanceFormInitial);
  const [editingMaintenanceId, setEditingMaintenanceId] = useState("");
  const [categoryForm, setCategoryForm] = useState(categoryFormInitial);
  const [editingCategoryId, setEditingCategoryId] = useState("");
  const [serviceForm, setServiceForm] = useState(serviceFormInitial);
  const [editingServiceId, setEditingServiceId] = useState("");
  const [vehicleForm, setVehicleForm] = useState(vehicleFormInitial);
  const [editingVehicleId, setEditingVehicleId] = useState("");
  const [savingService, setSavingService] = useState(false);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingScheduleNote, setSavingScheduleNote] = useState(false);
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [savingSettingId, setSavingSettingId] = useState("");
  const [savingNewSetting, setSavingNewSetting] = useState(false);
  const [savingTelegramSettings, setSavingTelegramSettings] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
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

  useEffect(() => {
    if (token) return;

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
  }, [token]);

  useEffect(() => {
    if (!token) return;

    let ignore = false;

    async function loadAdminData() {
      try {
        const [
          dashboardData,
          bookingData,
          scheduleNoteData,
          maintenanceData,
          serviceData,
          categoryData,
          vehicleData,
          settingData,
          notificationLogData
        ] = await Promise.all([
          fetchAdminDashboard(token),
          fetchAdminBookings(token),
          fetchScheduleNotes(token),
          fetchVehicleMaintenances(token),
          fetchAdminServices(token),
          fetchVehicleCategories(token),
          fetchVehicles(token),
          fetchSiteSettings(token),
          fetchNotificationLogs(token)
        ]);

        if (!ignore) {
          setDashboard(dashboardData);
          setBookings(bookingData);
          setScheduleNotes(scheduleNoteData);
          setVehicleMaintenances(maintenanceData);
          setServices(serviceData);
          setVehicleCategories(categoryData);
          setVehicles(vehicleData);
          setSiteSettings(settingData);
          setNotificationLogs(notificationLogData);
          setSelectedVehicleId((current) => current || vehicleData[0]?.id || "");
          setPageError("");
          setVehicleForm((current) => ({
            ...current,
            categoryId: current.categoryId || categoryData[0]?.id || ""
          }));
        }
      } catch (error) {
        if (!ignore) {
          clearToken();
          setToken(null);
          setPageError(error.message);
        }
      }
    }

    loadAdminData();

    return () => {
      ignore = true;
    };
  }, [token]);

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
      { label: "Booking mới", value: dashboard?.bookingCount ?? "-" },
      { label: "Xe hiện có", value: dashboard?.vehicleCount ?? "-" },
      { label: "Dịch vụ", value: dashboard?.serviceCount ?? "-" },
      { label: "Yêu cầu gần đây", value: bookings.length }
    ],
    [dashboard, bookings.length]
  );

  const settingsMap = useMemo(
    () => Object.fromEntries(siteSettings.map((item) => [item.key, item.value])),
    [siteSettings]
  );
  const adminLogoUrl = settingsMap.logo_url ? resolveAdminAssetUrl(settingsMap.logo_url) : "";

  const activeTabMeta = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  useEffect(() => {
    applyDocumentBranding({
      title: settingsMap.site_name ? `Quản trị ${settingsMap.site_name}` : "Quản trị nhà xe",
      faviconUrl: settingsMap.favicon_url
    });
  }, [settingsMap.favicon_url, settingsMap.site_name]);

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
      return;
    }

    if (event.type === "booking.updated") {
      setBookings((current) =>
        sortBookingsByCreatedAt(
          current.map((booking) => (booking.id === event.booking.id ? event.booking : booking))
        )
      );
      scheduleNotificationLogRefresh(5200);
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
    }
  }

  async function reloadData() {
    if (!token) return;
    const [
      dashboardData,
      bookingData,
      scheduleNoteData,
      maintenanceData,
      serviceData,
      categoryData,
      vehicleData,
      settingData,
      notificationLogData
    ] =
      await Promise.all([
        fetchAdminDashboard(token),
        fetchAdminBookings(token),
        fetchScheduleNotes(token),
        fetchVehicleMaintenances(token),
        fetchAdminServices(token),
        fetchVehicleCategories(token),
        fetchVehicles(token),
        fetchSiteSettings(token),
        fetchNotificationLogs(token)
      ]);

    setDashboard(dashboardData);
    setBookings(bookingData);
    setScheduleNotes(scheduleNoteData);
    setVehicleMaintenances(maintenanceData);
    setServices(serviceData);
    setVehicleCategories(categoryData);
    setVehicles(vehicleData);
    setSiteSettings(settingData);
    setNotificationLogs(notificationLogData);
    setSelectedVehicleId((current) => current || vehicleData[0]?.id || "");
  }

  async function reloadBookingRealtimeData() {
    if (!token) return;

    const [dashboardData, bookingData] = await Promise.all([
      fetchAdminDashboard(token),
      fetchAdminBookings(token)
    ]);

    setDashboard(dashboardData);
    setBookings(bookingData);
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

  function handleLoginChange(event) {
    const { name, value } = event.target;
    setLoginForm((current) => ({ ...current, [name]: value }));
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    setAuthState({ loading: true, error: "" });

    try {
      const data = await loginAdmin(loginForm);
      storeToken(data.token);
      setToken(data.token);
      setAuthState({ loading: false, error: "" });
      notifySuccess("Đăng nhập thành công.");
    } catch (error) {
      setAuthState({ loading: false, error: error.message });
      showToast("error", "Đăng nhập thất bại.", error.message);
    }
  }

  function handleLogout() {
    clearToken();
    setToken(null);
    setDashboard(null);
    setBookings([]);
    setScheduleNotes([]);
    setVehicleMaintenances([]);
    setServices([]);
    setVehicles([]);
    setSiteSettings([]);
    setNotificationLogs([]);
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
      notifySuccess("Đã cập nhật trạng thái booking.");
    } catch (error) {
      notifyError(error, "Không thể cập nhật booking.");
    }
  }

  async function handleDeleteBooking(id) {
    if (!window.confirm("Xóa yêu cầu booking này?")) return;
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

  function openVehicleMaintenancesTab() {
    setActiveTab("vehicle-maintenances");
    resetMaintenanceForm();
  }

  function handleCreateScheduleFromBooking(booking) {
    setActiveTab("schedule-notes");
    setEditingScheduleNoteId("");
    setScheduleNoteForm({
      vehicleId: "",
      bookingRequestId: booking.id,
      title: `Giữ lịch cho ${booking.customerName}`,
      customerName: booking.customerName ?? "",
      phoneNumber: booking.phoneNumber ?? "",
      tripDate: toDateTimeLocalValue(booking.tripDate),
      pickupLocation: booking.pickupLocation ?? "",
      dropoffLocation: booking.dropoffLocation ?? "",
      status: "confirmed",
      note: booking.note ?? ""
    });
  }

  function handleScheduleNoteFormChange(event) {
    const { name, value } = event.target;
    setScheduleNoteForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  function resetScheduleNoteForm() {
    setEditingScheduleNoteId("");
    setScheduleNoteForm(scheduleNoteFormInitial);
  }

  async function handleCreateScheduleNote(event) {
    event.preventDefault();
    setSavingScheduleNote(true);
    setPageError("");

    try {
      if (editingScheduleNoteId) {
        await updateScheduleNote(token, editingScheduleNoteId, {
          ...scheduleNoteForm,
          bookingRequestId: scheduleNoteForm.bookingRequestId || null
        });
      } else {
        await createScheduleNote(token, {
          ...scheduleNoteForm,
          bookingRequestId: scheduleNoteForm.bookingRequestId || null
        });
      }

      resetScheduleNoteForm();
      await reloadData();
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

  async function handleDeleteScheduleNote(id) {
    if (!window.confirm("Xóa lịch xe này?")) return;

    try {
      await deleteScheduleNote(token, id);
      if (editingScheduleNoteId === id) resetScheduleNoteForm();
      await reloadData();
      notifySuccess("Đã xóa lịch xe.");
    } catch (error) {
      notifyError(error, "Không thể xóa lịch xe.");
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
    setMaintenanceForm(maintenanceFormInitial);
  }

  async function handleCreateMaintenance(event) {
    event.preventDefault();
    setSavingMaintenance(true);
    setPageError("");

    try {
      if (editingMaintenanceId) {
        await updateVehicleMaintenance(token, editingMaintenanceId, maintenanceForm);
      } else {
        await createVehicleMaintenance(token, maintenanceForm);
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
      serviceDate: toDateInputValue(item.serviceDate),
      nextServiceDate: toDateInputValue(item.nextServiceDate),
      odometerKm: item.odometerKm ?? "",
      cost: item.cost ?? "",
      status: item.status ?? "completed",
      note: item.note ?? ""
    });
  }

  async function handleDeleteMaintenance(id) {
    if (!window.confirm("Xóa lịch bảo dưỡng này?")) return;

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
    if (!window.confirm("Xóa nhóm xe này? Nếu nhóm đang có xe, dữ liệu liên quan có thể bị xóa theo.")) {
      return;
    }
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
    if (!window.confirm("Xóa dịch vụ này?")) return;
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
    if (!window.confirm("Xóa xe này và toàn bộ ảnh của xe?")) return;
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
  }

  async function handleVehicleImageUpload(vehicleId, files) {
    if (!files?.length) return;
    setUploadingVehicleId(vehicleId);
    setPageError("");
    try {
      await uploadVehicleImages(token, vehicleId, files);
      await reloadData();
      notifySuccess("Tải ảnh lên thành công.");
    } catch (error) {
      notifyError(error, "Không thể tải ảnh lên.");
    } finally {
      setUploadingVehicleId("");
    }
  }

  async function handleDeleteVehicleImage(id) {
    if (!window.confirm("Xóa ảnh này?")) return;
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
    if (!window.confirm(`Xóa cấu hình "${setting.key}"?`)) return;
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
      <div className="pointer-events-none fixed right-4 top-4 z-[90] flex w-full max-w-sm flex-col gap-3">
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

      <div
        className={`grid h-screen w-full ${
          isSidebarCollapsed
            ? "lg:grid-cols-[96px_minmax(0,1fr)]"
            : "lg:grid-cols-[280px_minmax(0,1fr)]"
        }`}
      >
        <aside className="admin-sidebar admin-scrollbar flex h-full flex-col overflow-y-auto px-4 py-5 text-white">
          <p
            className="pl-1 text-left text-xs font-bold uppercase tracking-[0.35em] text-emerald-300"
          >
            Admin Panel
          </p>
          {isSidebarCollapsed ? (
            <div className="admin-title mt-4 flex h-12 items-center justify-start overflow-hidden rounded-2xl bg-white px-3 text-xl font-extrabold text-slate-950">
              {adminLogoUrl ? (
                <img
                  src={adminLogoUrl}
                  alt={settingsMap.site_name ?? "Logo nhà xe"}
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <span>{(settingsMap.site_name ?? "N").charAt(0)}</span>
              )}
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-3 pl-1">
              {adminLogoUrl ? (
                <img
                  src={adminLogoUrl}
                  alt={settingsMap.site_name ?? "Logo nhà xe"}
                  className="h-12 w-auto max-w-[140px] rounded-xl bg-white/95 p-2 object-contain"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl font-extrabold text-slate-950">
                  {(settingsMap.site_name ?? "N").charAt(0)}
                </div>
              )}
              <h1 className="admin-title text-left text-3xl font-extrabold text-white">
                {settingsMap.site_name ?? "Nhà xe"}
              </h1>
            </div>
          )}

          <nav className="mt-8 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`block w-full rounded-[1rem] px-4 py-3.5 text-left transition ${
                  activeTab === tab.id
                    ? "bg-white text-slate-950"
                    : "bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {isSidebarCollapsed ? (
                  <p className="pl-0.5 text-left text-xs font-extrabold uppercase tracking-[0.18em]">
                    {tab.label.slice(0, 3)}
                  </p>
                ) : (
                  <>
                    <p className="pl-0.5 text-left text-[11px] font-bold uppercase tracking-[0.3em] opacity-80">
                      {tab.eyebrow}
                    </p>
                    <p className="mt-1 pl-0.5 text-left text-base font-extrabold">{tab.label}</p>
                  </>
                )}
              </button>
            ))}
          </nav>

          {!isSidebarCollapsed ? (
            <div className="mt-8 rounded-[1rem] border border-white/10 bg-white/5 px-4 py-4 text-left text-white">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">
                Thương hiệu
              </p>
              {adminLogoUrl ? (
                <img
                  src={adminLogoUrl}
                  alt={settingsMap.site_name ?? "Logo nhà xe"}
                  className="mt-4 h-14 w-auto max-w-full rounded-xl bg-white/95 p-2 object-contain"
                />
              ) : null}
              <p className="mt-3 text-lg font-extrabold">
                {settingsMap.site_name ?? "Nhà xe"}
              </p>
              <p className="mt-2 text-sm text-slate-300">
                {settingsMap.hotline ?? "Cập nhật hotline trong Nội dung web"}
              </p>
            </div>
          ) : null}

          <div className={`mt-auto pt-6 ${isSidebarCollapsed ? "space-y-2" : "space-y-3"}`}>
            {passwordState.open && !isSidebarCollapsed ? (
              <form
                onSubmit={handleChangePasswordSubmit}
                className="rounded-[1rem] border border-white/10 bg-white/5 px-4 py-4 text-left"
              >
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">
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
                  <p className="mt-3 text-sm font-semibold text-emerald-300">
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

            <div className={`${isSidebarCollapsed ? "space-y-2" : "grid grid-cols-2 gap-2"}`}>
              <button
                type="button"
                onClick={togglePasswordPanel}
                className="w-full rounded-[1rem] border border-teal-400/20 bg-teal-500/15 px-4 py-3 text-white transition hover:bg-teal-500/20"
              >
                <p className="text-center text-sm font-extrabold">
                  {isSidebarCollapsed ? "Mật khẩu" : "Đổi mật khẩu"}
                </p>
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

        <main className="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-4 lg:p-6">
          <header className="admin-panel shrink-0 rounded-[1.25rem] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed((current) => !current)}
                  className="admin-button-ghost"
                >
                  {isSidebarCollapsed ? "Mở menu" : "Thu gọn"}
                </button>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.35em] text-admin-accent">
                    {activeTabMeta.eyebrow}
                  </p>
                  <h2 className="admin-title mt-3 text-4xl font-extrabold text-admin-ink">
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
            <div className="shrink-0 rounded-[1.5rem] bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {pageError}
            </div>
          ) : null}

          <div className="admin-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
            {activeTab === "dashboard" ? (
              <DashboardTab
                stats={stats}
                bookings={bookings}
                scheduleNotes={scheduleNotes}
                vehicleMaintenances={vehicleMaintenances}
                handleOpenVehicleCategories={openVehicleCategoriesTab}
                handleOpenVehicles={openVehiclesTab}
                handleOpenBookings={openBookingsTab}
                handleOpenScheduleNotes={openScheduleNotesTab}
                handleOpenVehicleMaintenances={openVehicleMaintenancesTab}
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
                bookings={bookings}
                highlightedBookingIds={highlightedBookingIds}
                bookingStatusFilter={bookingStatusFilter}
                handleBookingStatusFilterChange={handleBookingStatusFilterChange}
                handleBookingStatusChange={handleBookingStatusChange}
                handleDeleteBooking={handleDeleteBooking}
                handleCreateScheduleFromBooking={handleCreateScheduleFromBooking}
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
                handleVehicleFormChange={handleVehicleFormChange}
                handleCreateVehicle={handleCreateVehicle}
                resetVehicleForm={resetVehicleForm}
                handleEditVehicle={handleEditVehicle}
                handleDuplicateVehicle={handleDuplicateVehicle}
                handleDeleteVehicle={handleDeleteVehicle}
                handleDeleteVehicleImage={handleDeleteVehicleImage}
                handleSetPrimaryImage={handleSetPrimaryImage}
                handleImageAltTextBlur={handleImageAltTextBlur}
                handleImageSortOrderChange={handleImageSortOrderChange}
                handleVehicleImageUpload={handleVehicleImageUpload}
                handleVehicleFilterChange={handleVehicleFilterChange}
                handleVehicleSearchChange={handleVehicleSearchChange}
                handleSelectVehicle={handleSelectVehicle}
                resolveAdminAssetUrl={resolveAdminAssetUrl}
              />
            ) : null}
            {activeTab === "schedule-notes" ? (
              <ScheduleNotesTab
                notes={scheduleNotes}
                vehicles={vehicles}
                bookings={bookings}
                scheduleNoteForm={scheduleNoteForm}
                editingScheduleNoteId={editingScheduleNoteId}
                savingScheduleNote={savingScheduleNote}
                handleScheduleNoteFormChange={handleScheduleNoteFormChange}
                handleCreateScheduleNote={handleCreateScheduleNote}
                handleEditScheduleNote={handleEditScheduleNote}
                handleDeleteScheduleNote={handleDeleteScheduleNote}
                resetScheduleNoteForm={resetScheduleNoteForm}
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
                handleUploadSiteLogo={handleUploadSiteLogo}
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
        </main>
      </div>
    </div>
  );
}

