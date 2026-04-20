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
          <h3 className="text-3xl font-black uppercase text-brand-navy">Liên hệ để giữ lịch trình phù hợp</h3>
          <p className="text-slate-600">
            Gửi yêu cầu trực tiếp để bộ phận điều hành rà lại lịch trình, số khách và dòng xe phù
            hợp trước khi xác nhận chuyến.
          </p>
          <div className="rounded-[2rem] bg-[#14233c] p-6 text-white shadow-premium">
            <p className="text-sm uppercase tracking-[0.25em] text-brand-amber">Hotline</p>
            <a href={`tel:${hotline ?? "0979860498"}`} className="mt-3 block text-3xl font-black">
              {hotline ?? "0979 860 498"}
            </a>
            <p className="mt-4 text-slate-200">
              Địa chỉ: {address ?? "555 Quang Trung 2, Phường Hạc Thành, Thanh Hóa"}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-slate-100">
                Tư vấn nhanh theo lịch trình
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-slate-100">
                Chốt chuyến gọn cho đoàn riêng
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-[#e6dbc7] bg-white/90 p-4 shadow-[0_18px_45px_rgba(20,35,60,0.06)]">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-amber">
                Thời gian phản hồi
              </p>
              <p className="mt-2 text-lg font-extrabold text-brand-navy">Ưu tiên trong giờ làm việc</p>
              <p className="mt-2 text-sm text-slate-600">
                Yêu cầu có lịch đi, số người và điểm đón rõ sẽ được ưu tiên xác nhận nhanh hơn.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-[#e6dbc7] bg-white/90 p-4 shadow-[0_18px_45px_rgba(20,35,60,0.06)]">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-amber">
                Phù hợp
              </p>
              <p className="mt-2 text-lg font-extrabold text-brand-navy">Từ gia đình đến doanh nghiệp</p>
              <p className="mt-2 text-sm text-slate-600">
                Từ xe gia đình đến xe 45 chỗ cho công tác, tour riêng, sự kiện và cưới hỏi.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-[#e6dbc7] bg-[#fffaf2] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-amber">Hồ sơ chuyến</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Ghi rõ ngày đi, số khách, điểm đón và điểm trả để việc điều phối đạt độ chính xác cao.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-[#e6dbc7] bg-[#fffaf2] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-amber">Điều phối xe</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Xe được sắp theo quy mô đoàn và tính chất chuyến đi để giữ trải nghiệm ổn định, lịch sự.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-[#e6dbc7] bg-[#fffaf2] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-amber">Xác nhận lịch</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Bộ phận điều hành sẽ rà lại lịch trình trước khi chốt chuyến và bố trí xe phù hợp.
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
