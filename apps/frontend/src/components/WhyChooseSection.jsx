function FeatureIcon({ type }) {
  const common = "h-5 w-5 text-brand-navy";

  if (type === "clock") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M12 8v4l2.5 2.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "check") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <path
          d="M7 12.5 10.2 16 17 8.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
      <path
        d="M5 15V9.8a2.8 2.8 0 0 1 2.8-2.8h7.6A3.6 3.6 0 0 1 19 10.6V15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8.5" cy="15.8" r="1.2" fill="currentColor" />
      <circle cx="16.5" cy="15.8" r="1.2" fill="currentColor" />
      <path d="M9 11h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const points = [
  {
    title: "Đội xe tuyển chọn",
    body: "Xe được giữ sạch, bảo trì đều và chuẩn hình ảnh đón khách cho các chuyến riêng, công tác và đoàn gia đình.",
    icon: "fleet"
  },
  {
    title: "Lịch trình chuẩn chỉnh",
    body: "Phù hợp sân bay, cưới hỏi, tour riêng và các lịch trình nhiều điểm cần sắp xếp giờ giấc rõ ràng.",
    icon: "clock"
  },
  {
    title: "Xác nhận tinh gọn",
    body: "Thông tin chuyến đi được rà lại nhanh để chốt đúng quy mô đoàn, dòng xe và thời gian phục vụ.",
    icon: "check"
  }
];

export default function WhyChooseSection() {
  return (
    <section className="site-shell mx-auto px-4 py-16 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-brand-amber">
            Vì sao chọn
          </p>
          <h3 className="display-serif mt-3 text-4xl leading-tight text-brand-navy">
            Chuẩn dịch vụ chỉn chu cho những hành trình cần sự yên tâm.
          </h3>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">
            Tập trung vào điều phối rõ ràng, xe sạch và quy trình xác nhận nhất quán để khách giữ
            được cảm giác an tâm ngay từ lúc đặt lịch.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {points.map((point) => (
            <article
              key={point.title}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="h-1.5 w-12 rounded-full bg-brand-amber" />
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef4fb] ring-1 ring-slate-200">
                  <FeatureIcon type={point.icon} />
                </div>
              </div>
              <h4 className="mt-5 text-xl font-extrabold text-brand-navy">{point.title}</h4>
              <p className="mt-3 text-sm leading-7 text-slate-600">{point.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
