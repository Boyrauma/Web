import TurnstileWidget from "./TurnstileWidget";

export default function BookingSection({
  hotline,
  address,
  formData,
  submitState,
  captchaState,
  turnstileState,
  handleTurnstileTokenChange,
  handleTurnstileError,
  handleChange,
  handleSubmit
}) {
  const isBackgroundVerificationPreparing =
    captchaState.loading || captchaState.proofLoading || !captchaState.token || !captchaState.proofNonce;
  const isWaitingForTurnstile = turnstileState.enabled && !turnstileState.token;
  const isSubmitDisabled =
    submitState.loading || isBackgroundVerificationPreparing || isWaitingForTurnstile;

  let submitLabel = "Liên hệ ngay";

  if (submitState.loading) {
    submitLabel = "Đang gửi...";
  } else if (isBackgroundVerificationPreparing) {
    submitLabel = "Đang chuẩn bị...";
  }

  return (
    <section id="booking" className="site-shell mx-auto px-4 py-16 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="space-y-5">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-brand-amber">Liên hệ</p>
          <h3 className="text-3xl font-black uppercase text-brand-navy">
            Gửi lịch trình để nhà xe sắp chuyến gọn và đúng nhu cầu
          </h3>
          <p className="text-slate-600">
            Chỉ cần để lại ngày đi, số khách, điểm đón và điểm đến. Bên tôi sẽ gọi lại để chốt xe,
            báo lịch và xác nhận nhanh theo chuyến thực tế.
          </p>
          <div className="rounded-[2rem] bg-[#14233c] p-6 text-white shadow-premium">
            <p className="text-sm uppercase tracking-[0.25em] text-brand-amber">Hotline</p>
            <a href={`tel:${hotline ?? "0979860498"}`} className="mt-3 block text-3xl font-black">
              {hotline ?? "0979 860 498"}
            </a>
            <p className="mt-4 text-slate-200">
              Địa chỉ: {address ?? "555 Quang Trung 2, Phường Hạc Thành, Thanh Hóa"}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-100">
                Tư vấn theo lịch thật
              </span>
              <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-100">
                Chốt xe đúng quy mô đoàn
              </span>
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-[#e6dbc7] bg-[#fffaf2] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-amber">
              Cách làm việc
            </p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              <p>
                Điền càng rõ lịch đi, số khách và cung đường thì bên tôi càng dễ chốt đúng loại xe
                và thời gian đón.
              </p>
              <p>
                Với chuyến gia đình, cưới hỏi, đón sân bay hay đoàn công tác, nhà xe sẽ gọi lại để
                rà lịch và xác nhận trước khi nhận chuyến.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-[2rem] border border-[#e4d5bb] bg-white/92 p-6 shadow-[0_24px_70px_rgba(20,35,60,0.08)] md:grid-cols-2"
        >
          <label className="space-y-2">
            <span className="text-sm font-bold text-brand-navy">Họ và tên</span>
            <input
              className="field"
              name="customerName"
              placeholder="Nguyễn Văn A"
              value={formData.customerName}
              onChange={handleChange}
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-brand-navy">Số điện thoại</span>
            <input
              className="field"
              name="phoneNumber"
              type="tel"
              inputMode="tel"
              placeholder="09xx xxx xxx"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-brand-navy">Ngày đi</span>
            <input
              className="field"
              name="tripDate"
              type="date"
              value={formData.tripDate}
              onChange={handleChange}
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-brand-navy">Số người</span>
            <input
              className="field"
              name="passengerCount"
              type="number"
              inputMode="numeric"
              min="1"
              placeholder="Ví dụ: 12"
              value={formData.passengerCount}
              onChange={handleChange}
              required
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-bold text-brand-navy">Điểm đón</span>
            <input
              className="field"
              name="pickupLocation"
              placeholder="Thanh Hóa, Sầm Sơn..."
              value={formData.pickupLocation}
              onChange={handleChange}
              required
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-bold text-brand-navy">Điểm đến</span>
            <input
              className="field"
              name="dropoffLocation"
              placeholder="Ninh Bình, Hà Nội..."
              value={formData.dropoffLocation}
              onChange={handleChange}
              required
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-bold text-brand-navy">Nhu cầu chi tiết</span>
            <textarea
              className="field min-h-32"
              name="note"
              placeholder="Loại xe mong muốn, thời gian đón, lịch trình..."
              value={formData.note}
              onChange={handleChange}
            />
          </label>
          <input
            type="text"
            name="website"
            value={formData.website}
            onChange={handleChange}
            className="hidden"
            tabIndex="-1"
            autoComplete="off"
            aria-hidden="true"
          />
          {turnstileState.enabled ? (
            <div className="md:col-span-2 rounded-[1.35rem] border border-[#dae4f2] bg-[#f8fbff] px-4 py-3">
              <TurnstileWidget
                siteKey={turnstileState.siteKey}
                resetKey={turnstileState.resetKey}
                onTokenChange={handleTurnstileTokenChange}
                onError={handleTurnstileError}
              />
            </div>
          ) : null}
          <button
            type="submit"
            className="rounded-2xl bg-[#b88a3b] px-6 py-4 font-bold text-white transition hover:bg-brand-navy md:col-span-2"
            disabled={isSubmitDisabled}
          >
            {submitLabel}
          </button>
          {submitState.message ? (
            <p className="md:col-span-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {submitState.message}
            </p>
          ) : null}
          {submitState.error ? (
            <p className="md:col-span-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {submitState.error}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
