import { useMemo, useState } from "react";

const entityTypeOptions = [
  { value: "all", label: "Tất cả đối tượng" },
  { value: "booking", label: "Booking" },
  { value: "driver", label: "Tài xế" },
  { value: "trip", label: "Chuyến đi" }
];

const actionOptions = [
  { value: "all", label: "Tất cả thao tác" },
  { value: "create", label: "Tạo mới" },
  { value: "update", label: "Cập nhật" },
  { value: "delete", label: "Xóa" },
  { value: "status_change", label: "Đổi trạng thái" }
];

function formatDateTime(value) {
  if (!value) return "Chưa có thời gian";

  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function toDateKey(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function escapeCsvValue(value) {
  const normalizedValue = String(value ?? "").replace(/"/g, "\"\"");
  return `"${normalizedValue}"`;
}

function downloadCsv(filename, rows) {
  const csvContent = `\uFEFF${rows.map((row) => row.map(escapeCsvValue).join(",")).join("\n")}`;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getActionClass(action) {
  if (action === "create") return "bg-emerald-50 text-emerald-700";
  if (action === "update") return "bg-sky-50 text-sky-700";
  if (action === "delete") return "bg-rose-50 text-rose-700";
  if (action === "status_change") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function getActionLabel(action) {
  return actionOptions.find((item) => item.value === action)?.label ?? action;
}

function renderMetadataBadges(metadata) {
  if (!metadata || typeof metadata !== "object") return null;

  return Object.entries(metadata)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .slice(0, 4)
    .map(([key, value]) => (
      <span key={key} className="admin-pill bg-slate-100 text-slate-700">
        {key}: {String(value)}
      </span>
    ));
}

function stringifyMetadata(metadata) {
  if (!metadata || typeof metadata !== "object") return "";

  return Object.entries(metadata)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" | ");
}

export default function ActivityLogsTab({ activityLogs }) {
  const [searchValue, setSearchValue] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const filteredLogs = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return activityLogs.filter((log) => {
      if (entityTypeFilter !== "all" && log.entityType !== entityTypeFilter) {
        return false;
      }

      if (actionFilter !== "all" && log.action !== actionFilter) {
        return false;
      }

      if (dateFilter && toDateKey(log.createdAt) !== dateFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        log.entityLabel,
        log.description,
        log.admin?.fullName,
        log.entityType,
        log.action,
        stringifyMetadata(log.metadata)
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [actionFilter, activityLogs, dateFilter, entityTypeFilter, searchValue]);

  function handleExportCsv() {
    const rows = [
      ["Thoi gian", "Nguoi thao tac", "Doi tuong", "Thao tac", "Ten doi tuong", "Mo ta", "Chi tiet"],
      ...filteredLogs.map((log) => [
        formatDateTime(log.createdAt),
        log.admin?.fullName || "Hệ thống",
        entityTypeOptions.find((item) => item.value === log.entityType)?.label ?? log.entityType,
        getActionLabel(log.action),
        log.entityLabel || "",
        log.description || "",
        stringifyMetadata(log.metadata)
      ])
    ];

    downloadCsv(`activity-logs-${dateFilter || "all"}-${Date.now()}.csv`, rows);
  }

  return (
    <section className="mt-8 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">
            Tổng log
          </p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">{activityLogs.length}</p>
        </div>
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">
            Đang hiển thị
          </p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">{filteredLogs.length}</p>
        </div>
      </div>

      <section className="admin-card rounded-[1.25rem] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="admin-title text-2xl font-extrabold text-admin-ink">Nhật ký thao tác</h3>
            <p className="mt-2 text-sm text-admin-steel">
              Theo dõi ai đã tạo, sửa, xóa hoặc đổi trạng thái trong phần điều hành.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="admin-pill bg-slate-100 text-slate-700">{filteredLogs.length} mục</span>
            <button type="button" className="admin-button-ghost" onClick={handleExportCsv}>
              Xuất CSV
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-[1rem] border border-slate-200 bg-slate-50/80 p-4">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_220px_220px] xl:items-end">
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Tìm trong log</span>
              <input
                className="admin-field"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Người thao tác, booking, tài xế, chuyến đi..."
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Đối tượng</span>
              <select
                className="admin-select"
                value={entityTypeFilter}
                onChange={(event) => setEntityTypeFilter(event.target.value)}
              >
                {entityTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Thao tác</span>
              <select
                className="admin-select"
                value={actionFilter}
                onChange={(event) => setActionFilter(event.target.value)}
              >
                {actionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Ngày thao tác</span>
              <input
                className="admin-field"
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {filteredLogs.map((log) => (
            <article
              key={log.id}
              className="rounded-[1.15rem] border border-slate-200 bg-slate-50/70 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-lg font-extrabold text-admin-ink">
                      {log.entityLabel || "Không có tên đối tượng"}
                    </p>
                    <span className={`admin-pill ${getActionClass(log.action)}`}>
                      {getActionLabel(log.action)}
                    </span>
                    <span className="admin-pill bg-slate-100 text-slate-700">
                      {entityTypeOptions.find((item) => item.value === log.entityType)?.label ?? log.entityType}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-admin-steel">
                    {log.description || "Không có mô tả"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDateTime(log.createdAt)} • {log.admin?.fullName || "Hệ thống"}
                  </p>
                </div>
              </div>

              {renderMetadataBadges(log.metadata)?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">{renderMetadataBadges(log.metadata)}</div>
              ) : null}
            </article>
          ))}

          {!filteredLogs.length ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-admin-steel">
              Không có log nào khớp với bộ lọc hiện tại.
            </div>
          ) : null}
        </div>
      </section>
    </section>
  );
}
