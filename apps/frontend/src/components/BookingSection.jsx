import TurnstileWidget from "./TurnstileWidget";

function getTodayInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function BookingSection({
  sectionRef,
  onBookingIntent,
  hotline,
  formData,
  submitState,
  captchaState,
  turnstileState,
  handleTurnstileTokenChange,
  handleTurnstileError,
  handleCaptchaRetry,
  handleChange,
  handleSubmit
}) {
  const isBackgroundVerificationPreparing =
    !captchaState.initialized ||
    captchaState.loading ||
    captchaState.proofLoading ||
    !captchaState.token ||
    !captchaState.proofNonce;
  const isWaitingForTurnstile = turnstileState.enabled && !turnstileState.token;
  const isSubmitDisabled =
    submitState.loading || isBackgroundVerificationPreparing || isWaitingForTurnstile;
  const minimumTripDate = getTodayInputValue();

  let submitLabel = "Gửi lịch xe";

  if (submitState.loading) {
    submitLabel = "Đang gửi...";
  } else if (captchaState.initialized && isBackgroundVerificationPreparing) {
    submitLabel = "Đang chuẩn bị...";
  }

  return (
    <section ref={sectionRef} id="booking" className="site-shell mx-auto px-4 py-16 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[0.76fr_1.24fr]">
        <div className="rounded-[2rem] border border-[#e4d5bb] bg-[#fffaf2] p-6 shadow-[0_20px_60px_rgba(20,35,60,0.06)] lg:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-brand-amber">
            Đặt lịch xe
          </p>
          <h2 className="display-serif mt-3 text-4xl leading-tight text-brand-navy">
            Gửi thông tin chuyến đi, nhà xe gọi lại để chốt lịch
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Phần này chỉ cần nhập lịch trình chính. Các chi tiết như loại xe, giờ đón và chi phí sẽ
            được xác nhận lại qua điện thoại để tránh sai thông tin.
          </p>

          <div className="mt-7 space-y-3">
            {[
              "Nhập ngày đi, số khách và tuyến đường.",
              "Nhà xe kiểm tra xe phù hợp với lịch thực tế.",
              "Gọi lại để chốt giờ đón, xe và chi phí."
            ].map((item, index) => (
              <div
                key={item}
                className="flex gap-3 rounded-[1.25rem] border border-[#eadcc4] bg-white/80 p-4"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#14233c] text-sm font-black text-white">
                  {index + 1}
                </span>
                <p className="text-sm font-semibold leading-6 text-slate-700">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-7 rounded-[1.5rem] bg-[#14233c] p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d3b277]">
              Cần gấp?
            </p>
            <a href={`tel:${hotline ?? "0979860498"}`} className="mt-2 block text-2xl font-black">
              {hotline ?? "0979 860 498"}
            </a>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          onFocusCapture={onBookingIntent}
          onPointerDown={onBookingIntent}
          className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-[2rem] border border-[#e4d5bb] bg-white/95 p-6 shadow-[0_24px_70px_rgba(20,35,60,0.08)] md:grid-cols-2"
        >
          <label className="min-w-0 space-y-2">
            <span className="text-sm font-bold text-brand-navy">Họ và tên</span>
            <input
              className="field"
              name="customerName"
              autoComplete="name"
              placeholder="Nguyễn Văn A"
              value={formData.customerName}
              onChange={handleChange}
              maxLength={100}
              required
            />
          </label>
          <label className="min-w-0 space-y-2">
            <span className="text-sm font-bold text-brand-navy">Số điện thoại</span>
            <input
              className="field"
              name="phoneNumber"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="09xx xxx xxx"
              value={formData.phoneNumber}
              onChange={handleChange}
              maxLength={20}
              required
            />
          </label>
          <label className="min-w-0 space-y-2">
            <span className="text-sm font-bold text-brand-navy">Ngày đi</span>
            <input
              className="field field-date"
              name="tripDate"
              type="date"
              min={minimumTripDate}
              value={formData.tripDate}
              onChange={handleChange}
              required
            />
          </label>
          <label className="min-w-0 space-y-2">
            <span className="text-sm font-bold text-brand-navy">Số người</span>
            <input
              className="field"
              name="passengerCount"
              type="number"
              inputMode="numeric"
              min="1"
              max="200"
              placeholder="Ví dụ: 12"
              value={formData.passengerCount}
              onChange={handleChange}
              required
            />
          </label>
          <label className="min-w-0 space-y-2 md:col-span-2">
            <span className="text-sm font-bold text-brand-navy">Điểm đón</span>
            <input
              className="field"
              name="pickupLocation"
              placeholder="Thanh Hóa, Sầm Sơn..."
              value={formData.pickupLocation}
              onChange={handleChange}
              maxLength={200}
              required
            />
          </label>
          <label className="min-w-0 space-y-2 md:col-span-2">
            <span className="text-sm font-bold text-brand-navy">Điểm đến</span>
            <input
              className="field"
              name="dropoffLocation"
              placeholder="Ninh Bình, Hà Nội..."
              value={formData.dropoffLocation}
              onChange={handleChange}
              maxLength={200}
              required
            />
          </label>
          <label className="min-w-0 space-y-2 md:col-span-2">
            <span className="text-sm font-bold text-brand-navy">Nhu cầu chi tiết</span>
            <textarea
              className="field min-h-32"
              name="note"
              placeholder="Loại xe mong muốn, thời gian đón, lịch trình..."
              value={formData.note}
              onChange={handleChange}
              maxLength={2000}
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
            maxLength={200}
            aria-hidden="true"
          />
          {turnstileState.enabled ? (
            <div className="turnstile-frame rounded-[1.35rem] border border-[#dae4f2] bg-[#f8fbff] px-4 py-3 md:col-span-2">
              <TurnstileWidget
                siteKey={turnstileState.siteKey}
                resetKey={turnstileState.resetKey}
                onTokenChange={handleTurnstileTokenChange}
                onError={handleTurnstileError}
              />
            </div>
          ) : null}
          {captchaState.initialized && captchaState.proofError && !captchaState.proofLoading ? (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 md:col-span-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <span>{captchaState.proofError}</span>
              <button
                type="button"
                onClick={handleCaptchaRetry}
                className="shrink-0 rounded-full border border-amber-700/30 bg-white px-4 py-2 font-bold text-amber-900 transition hover:border-brand-navy hover:text-brand-navy"
              >
                Thử xác thực lại
              </button>
            </div>
          ) : null}
          <button
            type="submit"
            className="rounded-2xl bg-[#9a5c00] px-6 py-4 font-bold text-white transition hover:bg-brand-navy md:col-span-2"
            disabled={isSubmitDisabled}
          >
            {submitLabel}
          </button>
          {submitState.message ? (
            <p
              role="status"
              aria-live="polite"
              className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 md:col-span-2"
            >
              {submitState.message}
            </p>
          ) : null}
          {submitState.error ? (
            <p
              role="alert"
              className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 md:col-span-2"
            >
              {submitState.error}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}
