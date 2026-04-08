export default function BookingSection({
  hotline,
  address,
  formData,
  submitState,
  handleChange,
  handleSubmit
}) {
  return (
    <section id="booking" className="site-shell mx-auto px-4 py-16 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-5">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-brand-amber">Liên hệ</p>
          <h3 className="text-3xl font-black uppercase text-brand-navy">Yêu cầu báo giá nhanh</h3>
          <p className="text-slate-600">
            Gửi yêu cầu trực tiếp, hệ thống sẽ lưu lại để admin xử lý và gọi lại xác nhận lịch
            trình, số người và dòng xe phù hợp.
          </p>
          <div className="rounded-[2rem] bg-brand-navy p-6 text-white shadow-premium">
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
                Chốt chuyến dễ cho đoàn lớn
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-amber">
                Thời gian phản hồi
              </p>
              <p className="mt-2 text-lg font-extrabold text-brand-navy">Trong giờ làm việc</p>
              <p className="mt-2 text-sm text-slate-600">
                Booking mới sẽ được ưu tiên gọi lại để xác nhận lịch trình và dòng xe.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-amber">
                Phù hợp
              </p>
              <p className="mt-2 text-lg font-extrabold text-brand-navy">Cá nhân đến đoàn lớn</p>
              <p className="mt-2 text-sm text-slate-600">
                Từ xe gia đình đến xe 45 chỗ cho tour, cưới hỏi, sự kiện và công tác.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2"
        >
          <label className="space-y-2">
            <span className="text-sm font-bold text-brand-navy">Họ và tên</span>
            <input
              className="field"
              name="customerName"
              placeholder="Nguyễn Văn A"
              value={formData.customerName}
              onChange={handleChange}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-brand-navy">Số điện thoại</span>
            <input
              className="field"
              name="phoneNumber"
              placeholder="09xx xxx xxx"
              value={formData.phoneNumber}
              onChange={handleChange}
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
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-brand-navy">Số người</span>
            <input
              className="field"
              name="passengerCount"
              placeholder="Ví dụ: 12"
              value={formData.passengerCount}
              onChange={handleChange}
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
          <button
            type="submit"
            className="rounded-2xl bg-brand-amber px-6 py-4 font-bold text-white transition hover:bg-brand-navy md:col-span-2"
            disabled={submitState.loading}
          >
            {submitState.loading ? "Đang gửi..." : "Gửi yêu cầu"}
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
