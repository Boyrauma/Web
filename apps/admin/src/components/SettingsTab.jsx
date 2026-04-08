import { useEffect, useMemo, useState } from "react";

const COMMON_FIELDS = [
  { key: "site_name", label: "Tên nhà xe", group: "branding", type: "text" },
  { key: "site_tagline", label: "Tagline", group: "branding", type: "text" },
  { key: "browser_title", label: "Tiêu đề trình duyệt", group: "branding", type: "text" },
  { key: "favicon_url", label: "Đường dẫn favicon", group: "branding", type: "text" },
  { key: "footer_text", label: "Nội dung footer", group: "branding", type: "textarea" },
  { key: "hotline", label: "Hotline", group: "contact", type: "text" },
  { key: "zalo", label: "Link Zalo", group: "contact", type: "text" },
  { key: "address", label: "Địa chỉ", group: "contact", type: "textarea" },
  { key: "hero_title", label: "Tiêu đề hero", group: "homepage", type: "text" },
  { key: "hero_subtitle", label: "Mô tả hero", group: "homepage", type: "textarea" }
];

const TELEGRAM_EVENT_OPTIONS = [
  { value: "all", label: "Tất cả sự kiện" },
  { value: "booking.created", label: "Booking mới" },
  { value: "booking.updated", label: "Booking cập nhật" },
  { value: "booking.deleted", label: "Booking bị xóa" },
  { value: "telegram.test", label: "Test kết nối" }
];

const TELEGRAM_STATUS_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "sent", label: "Gửi thành công" },
  { value: "failed", label: "Gửi lỗi" },
  { value: "skipped", label: "Bỏ qua" }
];

function renderField(field, value, onChange) {
  if (field.type === "textarea") {
    return (
      <textarea
        className="admin-field admin-textarea"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <input
      className="admin-field"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function buildTelegramForm(siteSettings) {
  const settingMap = Object.fromEntries(siteSettings.map((item) => [item.key, item.value]));
  const storedToken = settingMap.telegram_bot_token ?? "";

  return {
    enabled: String(settingMap.telegram_enabled ?? "false").toLowerCase() === "true",
    botToken: "",
    hasSavedBotToken: Boolean(storedToken),
    defaultChatIds: settingMap.telegram_chat_id ?? "",
    systemChatIds: settingMap.telegram_chat_id_system ?? "",
    bookingCreatedChatIds: settingMap.telegram_chat_id_booking_created ?? "",
    bookingUpdatedChatIds: settingMap.telegram_chat_id_booking_updated ?? "",
    bookingDeletedChatIds: settingMap.telegram_chat_id_booking_deleted ?? "",
    notifyBookingCreated:
      String(settingMap.telegram_notify_booking_created ?? "true").toLowerCase() === "true",
    notifyBookingUpdated:
      String(settingMap.telegram_notify_booking_updated ?? "true").toLowerCase() === "true",
    notifyBookingDeleted:
      String(settingMap.telegram_notify_booking_deleted ?? "false").toLowerCase() === "true"
  };
}

function formatLogTime(value) {
  if (!value) return "Chưa rõ";
  return new Date(value).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function getLogStatusLabel(status) {
  if (status === "sent") return "Thành công";
  if (status === "failed") return "Lỗi";
  if (status === "skipped") return "Bỏ qua";
  return status;
}

function getLogStatusClass(status) {
  if (status === "sent") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "failed") return "bg-rose-50 text-rose-700 border-rose-200";
  if (status === "skipped") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function getEventLabel(eventType) {
  return TELEGRAM_EVENT_OPTIONS.find((item) => item.value === eventType)?.label ?? eventType;
}

function TelegramToggleCard({ title, description, checked, onChange, children }) {
  return (
    <div className="rounded-[1rem] border border-slate-200 bg-slate-50/80 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-admin-accent">{title}</p>
          <p className="mt-2 text-sm text-admin-steel">{description}</p>
        </div>
        <input type="checkbox" checked={checked} onChange={onChange} className="mt-1" />
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

export default function SettingsTab({
  siteSettings,
  notificationLogs,
  logoUrl,
  savingSettingId,
  savingTelegramSettings,
  settingForm,
  savingNewSetting,
  testingTelegram,
  uploadingLogo,
  handleUploadSiteLogo,
  handleSettingValueChange,
  handleSaveSetting,
  handleSaveTelegramSettings,
  handleSettingFormChange,
  handleCreateSetting,
  handleDeleteSetting,
  handleTelegramTest
}) {
  const settingMap = useMemo(
    () => Object.fromEntries(siteSettings.map((item) => [item.key, item])),
    [siteSettings]
  );
  const [telegramForm, setTelegramForm] = useState(() => buildTelegramForm(siteSettings));
  const [logEventFilter, setLogEventFilter] = useState("all");
  const [logStatusFilter, setLogStatusFilter] = useState("all");

  useEffect(() => {
    setTelegramForm(buildTelegramForm(siteSettings));
  }, [siteSettings]);

  const commonSettings = COMMON_FIELDS.map((field) => ({
    ...field,
    setting: settingMap[field.key]
  })).filter((item) => item.setting);

  const advancedSettings = siteSettings.filter(
    (setting) =>
      !COMMON_FIELDS.some((field) => field.key === setting.key) &&
      !setting.key.startsWith("telegram_") &&
      setting.key !== "logo_url"
  );

  const filteredLogs = useMemo(
    () =>
      notificationLogs.filter((log) => {
        const matchEvent = logEventFilter === "all" ? true : log.eventType === logEventFilter;
        const matchStatus = logStatusFilter === "all" ? true : log.status === logStatusFilter;
        return matchEvent && matchStatus;
      }),
    [logEventFilter, logStatusFilter, notificationLogs]
  );

  function updateTelegramField(key, value) {
    setTelegramForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  return (
    <section className="mt-8 space-y-6">
      <div className="admin-card rounded-[1.25rem] p-6">
        <div>
          <h3 className="admin-title text-2xl font-extrabold text-admin-ink">Nội dung website</h3>
          <p className="mt-2 text-sm text-admin-steel">
            Khu vực chính cho các nội dung quan trọng của website theo cách dễ hiểu, không cần biết kỹ thuật.
          </p>
        </div>

        <div className="mt-6 rounded-[1rem] border border-slate-200 bg-slate-50/80 p-5">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-admin-accent">Logo nhà xe</p>
              <p className="mt-2 text-sm text-admin-steel">
                Tải logo ảnh để dùng đồng bộ ở website public và trang quản trị. Nếu chưa có, hệ thống sẽ tự dùng tên nhà xe dạng chữ.
              </p>
              <label className="mt-4 inline-flex cursor-pointer items-center rounded-[1rem] bg-admin-ink px-4 py-3 text-sm font-bold text-white transition hover:opacity-90">
                {uploadingLogo ? "Đang tải logo..." : "Chọn logo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingLogo}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleUploadSiteLogo(file);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>

            <div className="flex h-28 w-full max-w-[280px] items-center justify-center overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white p-4">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo nhà xe" className="h-full w-full object-contain" />
              ) : (
                <p className="text-center text-sm font-semibold text-admin-steel">Chưa có logo ảnh</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          {commonSettings.map(({ key, label, setting, ...field }) => (
            <div key={key} className="rounded-[1rem] border border-slate-200 bg-slate-50/80 p-5">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-admin-accent">{label}</p>
              <div className="mt-3">
                {renderField(field, setting.value, (value) => handleSettingValueChange(setting.id, value))}
              </div>
              <button
                type="button"
                onClick={() => handleSaveSetting(setting)}
                className="admin-button-primary mt-4"
                disabled={savingSettingId === setting.id}
              >
                {savingSettingId === setting.id ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-card rounded-[1.25rem] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="admin-title text-2xl font-extrabold text-admin-ink">Thông báo Telegram</h3>
            <p className="mt-2 text-sm text-admin-steel">
              Quản lý bot, nhóm nhận theo từng loại sự kiện, chống spam cập nhật và kiểm tra lịch sử gửi ngay trong admin.
            </p>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.22em] text-admin-steel">
            Vận hành realtime
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <div className="rounded-[1rem] border border-slate-200 bg-slate-50/80 p-5">
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-admin-accent">Bật Telegram</span>
            <div className="mt-4 flex items-center gap-3">
              <input
                type="checkbox"
                checked={telegramForm.enabled}
                onChange={(event) => updateTelegramField("enabled", event.target.checked)}
              />
              <span className="text-sm font-semibold text-admin-ink">
                Kích hoạt thông báo Telegram cho vận hành booking
              </span>
            </div>
          </div>

          <div className="rounded-[1rem] border border-slate-200 bg-slate-50/80 p-5">
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-admin-accent">Bot token</span>
            <input
              className="admin-field mt-3"
              type="password"
              value={telegramForm.botToken}
              onChange={(event) => updateTelegramField("botToken", event.target.value)}
              placeholder={telegramForm.hasSavedBotToken ? "Để trống để giữ token đang lưu" : "123456789:AA..."}
            />
            <p className="mt-3 text-sm text-admin-steel">
              {telegramForm.hasSavedBotToken
                ? "Token cũ đang được giữ an toàn. Chỉ nhập lại khi bạn muốn thay token mới."
                : "Bot token chỉ dùng ở backend. Sau khi lưu thành công, bạn không cần nhập lại mỗi lần sửa cấu hình."}
            </p>
          </div>

          <div className="rounded-[1rem] border border-slate-200 bg-slate-50/80 p-5 xl:col-span-2">
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-admin-accent">Nhóm nhận mặc định</span>
            <textarea
              className="admin-field admin-textarea mt-3"
              value={telegramForm.defaultChatIds}
              onChange={(event) => updateTelegramField("defaultChatIds", event.target.value)}
              placeholder={"-1001234567890\n-1009876543210"}
            />
            <p className="mt-3 text-sm text-admin-steel">
              Đây là nhóm nhận chính. Các sự kiện chưa có nhóm riêng sẽ dùng danh sách này. Có thể nhập nhiều chat ID, mỗi dòng một ID hoặc ngăn cách bằng dấu phẩy.
            </p>
          </div>

          <div className="rounded-[1rem] border border-slate-200 bg-slate-50/80 p-5 xl:col-span-2">
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-admin-accent">Nhóm nhận hệ thống / test</span>
            <textarea
              className="admin-field admin-textarea mt-3"
              value={telegramForm.systemChatIds}
              onChange={(event) => updateTelegramField("systemChatIds", event.target.value)}
              placeholder="Để trống nếu muốn dùng nhóm mặc định"
            />
            <p className="mt-3 text-sm text-admin-steel">
              Dùng cho tin test hoặc các cảnh báo hệ thống sau này. Nếu để trống, bot sẽ gửi về nhóm mặc định.
            </p>
          </div>

          <TelegramToggleCard
            title="Booking mới"
            description="Gửi ngay khi khách tạo booking từ website public."
            checked={telegramForm.notifyBookingCreated}
            onChange={(event) => updateTelegramField("notifyBookingCreated", event.target.checked)}
          >
            <textarea
              className="admin-field admin-textarea"
              value={telegramForm.bookingCreatedChatIds}
              onChange={(event) => updateTelegramField("bookingCreatedChatIds", event.target.value)}
              placeholder="Để trống nếu muốn dùng nhóm mặc định"
            />
          </TelegramToggleCard>

          <TelegramToggleCard
            title="Booking cập nhật"
            description="Gửi khi trạng thái booking đổi. Hệ thống tự gom các cập nhật gần nhau để tránh spam."
            checked={telegramForm.notifyBookingUpdated}
            onChange={(event) => updateTelegramField("notifyBookingUpdated", event.target.checked)}
          >
            <textarea
              className="admin-field admin-textarea"
              value={telegramForm.bookingUpdatedChatIds}
              onChange={(event) => updateTelegramField("bookingUpdatedChatIds", event.target.value)}
              placeholder="Để trống nếu muốn dùng nhóm mặc định"
            />
          </TelegramToggleCard>

          <TelegramToggleCard
            title="Booking bị xóa"
            description="Gửi khi một booking bị xóa khỏi hệ thống để tránh mất dấu dữ liệu."
            checked={telegramForm.notifyBookingDeleted}
            onChange={(event) => updateTelegramField("notifyBookingDeleted", event.target.checked)}
          >
            <textarea
              className="admin-field admin-textarea"
              value={telegramForm.bookingDeletedChatIds}
              onChange={(event) => updateTelegramField("bookingDeletedChatIds", event.target.value)}
              placeholder="Để trống nếu muốn dùng nhóm mặc định"
            />
          </TelegramToggleCard>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleSaveTelegramSettings(telegramForm)}
            className="admin-button-primary"
            disabled={savingTelegramSettings}
          >
            {savingTelegramSettings ? "Đang lưu..." : "Lưu cấu hình Telegram"}
          </button>
          <button
            type="button"
            onClick={handleTelegramTest}
            className="admin-button-secondary"
            disabled={testingTelegram}
          >
            {testingTelegram ? "Đang gửi..." : "Gửi test Telegram"}
          </button>
        </div>
      </div>

      <div className="admin-card rounded-[1.25rem] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="admin-title text-2xl font-extrabold text-admin-ink">Nhật ký Telegram</h3>
            <p className="mt-2 text-sm text-admin-steel">
              Theo dõi các lần gửi gần nhất để biết bot đang gửi tới đâu, thành công hay lỗi.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              className="admin-field min-w-[180px]"
              value={logEventFilter}
              onChange={(event) => setLogEventFilter(event.target.value)}
            >
              {TELEGRAM_EVENT_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            <select
              className="admin-field min-w-[180px]"
              value={logStatusFilter}
              onChange={(event) => setLogStatusFilter(event.target.value)}
            >
              {TELEGRAM_STATUS_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {filteredLogs.length ? (
            filteredLogs.map((log) => (
              <div key={log.id} className="rounded-[1rem] border border-slate-200 bg-slate-50/80 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-base font-extrabold text-admin-ink">{getEventLabel(log.eventType)}</p>
                      <span className={`rounded-full border px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em] ${getLogStatusClass(log.status)}`}>
                        {getLogStatusLabel(log.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-admin-steel">
                      {log.booking?.customerName
                        ? `${log.booking.customerName} • ${log.booking.phoneNumber ?? "Không rõ số"}`
                        : "Không gắn với booking cụ thể"}
                    </p>
                  </div>
                  <div className="text-right text-sm text-admin-steel">
                    <p>{formatLogTime(log.createdAt)}</p>
                    <p className="mt-1">{log.recipient || "Chưa rõ người nhận"}</p>
                  </div>
                </div>

                {log.errorMessage ? (
                  <div className="mt-4 rounded-[0.9rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {log.errorMessage}
                  </div>
                ) : null}

                {log.message ? (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-bold text-admin-accent">Xem nội dung đã gửi</summary>
                    <pre className="mt-3 whitespace-pre-wrap rounded-[0.9rem] bg-slate-950 px-4 py-4 text-sm text-slate-100">
                      {log.message}
                    </pre>
                  </details>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-admin-steel">
              Chưa có bản ghi Telegram phù hợp với bộ lọc hiện tại.
            </div>
          )}
        </div>
      </div>

      <details className="admin-card rounded-[1.25rem] p-6">
        <summary className="cursor-pointer list-none text-2xl font-extrabold text-admin-ink">Cấu hình nâng cao</summary>
        <p className="mt-3 text-sm text-admin-steel">
          Chỉ dùng khi bạn muốn thêm các key tùy chỉnh ngoài các mục mặc định phía trên.
        </p>

        <form onSubmit={handleCreateSetting} className="mt-6 rounded-[1rem] border border-slate-200 bg-slate-50/80 p-5">
          <h4 className="text-lg font-extrabold text-admin-ink">Thêm cấu hình mới</h4>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <input className="admin-field" name="key" placeholder="Key" value={settingForm.key} onChange={handleSettingFormChange} />
            <input className="admin-field" name="group" placeholder="Nhóm" value={settingForm.group} onChange={handleSettingFormChange} />
            <input className="admin-field" name="value" placeholder="Giá trị" value={settingForm.value} onChange={handleSettingFormChange} />
          </div>
          <button className="admin-button-primary mt-4" disabled={savingNewSetting}>
            {savingNewSetting ? "Đang tạo..." : "Tạo cấu hình"}
          </button>
        </form>

        <div className="mt-6 space-y-4">
          {advancedSettings.map((setting) => (
            <div key={setting.id} className="rounded-[1rem] border border-slate-200 bg-slate-50/80 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-extrabold text-admin-ink">{setting.key}</p>
                  <p className="mt-1 text-sm text-admin-steel">{setting.group}</p>
                </div>
                <button type="button" onClick={() => handleDeleteSetting(setting)} className="admin-button-danger">
                  Xóa
                </button>
              </div>
              <textarea
                className="admin-field admin-textarea mt-4"
                value={setting.value}
                onChange={(event) => handleSettingValueChange(setting.id, event.target.value)}
              />
              <button
                type="button"
                onClick={() => handleSaveSetting(setting)}
                className="admin-button-primary mt-4"
                disabled={savingSettingId === setting.id}
              >
                {savingSettingId === setting.id ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          ))}
          {!advancedSettings.length ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-admin-steel">
              Chưa có cấu hình nâng cao nào.
            </div>
          ) : null}
        </div>
      </details>
    </section>
  );
}
