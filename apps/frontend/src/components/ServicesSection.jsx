function ServiceIcon({ type }) {
  const common = "h-6 w-6 text-[#183051]";

  if (type === "wedding") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <path d="M12 20s-6.5-3.9-6.5-9.2A3.8 3.8 0 0 1 9.3 7c1.2 0 2.1.5 2.7 1.4.6-.9 1.5-1.4 2.7-1.4a3.8 3.8 0 0 1 3.8 3.8C18.5 16.1 12 20 12 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "airport") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <path d="m3 14 8-2 3-8 2 1-1.7 7 4.7 2.3-.9 1.7-4.8-1.2L12 20l-1.6-.8.7-4.5-4.4 1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "contract") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
        <path d="M7 4h8l4 4v12H7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M15 4v4h4M10 12h6M10 16h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
      <path d="M4 16c0-3.3 2.7-6 6-6h4c3.3 0 6 2.7 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 16V9a2 2 0 0 1 2-2h5.5a2.5 2.5 0 0 1 2.5 2.5V16M9 16h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="16.5" r="1.2" fill="currentColor" />
      <circle cx="16" cy="16.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

const serviceDefinitions = [
  {
    slug: "fallback-1",
    title: "Thuê xe du lịch",
    description:
      "Phù hợp cho chuyến đi gia đình, nhóm bạn, tour riêng và các hành trình cần xe sạch, thoải mái.",
    icon: "tour"
  },
  {
    slug: "fallback-2",
    title: "Xe cưới hỏi",
    description:
      "Dành cho ngày trọng đại với hình ảnh xe chỉn chu, đón đúng hẹn và phong cách phục vụ lịch sự.",
    icon: "wedding"
  },
  {
    slug: "fallback-3",
    title: "Đưa đón sân bay",
    description:
      "Ưu tiên lịch trình đúng giờ cho các chuyến bay sớm, khuya hoặc cần chủ động sắp xếp thời gian di chuyển.",
    icon: "airport"
  },
  {
    slug: "fallback-4",
    title: "Hợp đồng dài hạn",
    description:
      "Phù hợp cho doanh nghiệp, công trình hoặc lịch trình cố định cần phương án vận hành ổn định theo thời gian.",
    icon: "contract"
  }
];

const serviceIconMap = Object.fromEntries(serviceDefinitions.map((service) => [service.title, service.icon]));
const serviceDescriptionMap = Object.fromEntries(
  serviceDefinitions.map((service) => [service.title, service.description])
);

function resolveService(service) {
  const title = service.title?.trim();

  return {
    ...service,
    title: title || "Dịch vụ vận chuyển",
    description:
      serviceDescriptionMap[title] ||
      service.description?.trim() ||
      "Dịch vụ được tối ưu để khách liên hệ nhanh, xác nhận gọn và triển khai lịch trình rõ ràng.",
    icon: serviceIconMap[title] || "tour"
  };
}

export default function ServicesSection({ services, error }) {
  const serviceItems = (services.length ? services : serviceDefinitions).map(resolveService);

  return (
    <section id="dich-vu" className="site-shell mx-auto px-4 py-16 sm:px-6">
      {error ? (
        <div className="mb-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : null}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-brand-amber">Dịch vụ</p>
          <h3 className="display-serif mt-3 text-4xl text-brand-navy">
            Những nhu cầu được đặt nhiều nhất
          </h3>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {serviceItems.map((service) => (
          <div
            key={service.slug}
            className="reveal-card hover-lift rounded-[1.75rem] border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:shadow-premium"
          >
            <div className="flex justify-center">
              <div className="relative flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-[1.6rem] border border-[#ead7b6] bg-[linear-gradient(180deg,#fffdf8_0%,#f6ebda_100%)] shadow-[0_18px_34px_rgba(184,138,59,0.16)]">
                <div className="absolute inset-x-3 top-0 h-8 rounded-b-full bg-white/60 blur-md" />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/75 ring-1 ring-white/80">
                  <ServiceIcon type={service.icon} />
                </div>
              </div>
            </div>
            <h3 className="mt-5 text-xl font-extrabold text-brand-navy">{service.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">{service.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

