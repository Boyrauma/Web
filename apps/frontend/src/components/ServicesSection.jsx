export default function ServicesSection({ services, error }) {
  const fallbackServices = [
    { slug: "fallback-1", title: "Thuê xe du lịch" },
    { slug: "fallback-2", title: "Xe cưới hỏi" },
    { slug: "fallback-3", title: "Đưa đón sân bay" },
    { slug: "fallback-4", title: "Hợp đồng dài hạn" }
  ];

  return (
    <section id="dich-vu" className="site-shell mx-auto px-4 py-16 sm:px-6">
      {error ? (
        <div className="mb-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : null}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-brand-amber">
            Dịch vụ
          </p>
          <h3 className="display-serif mt-3 text-4xl text-brand-navy">
            Những nhu cầu được đặt nhiều nhất
          </h3>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-4">
        {(services.length ? services : fallbackServices).map((service) => (
          <div
            key={service.slug}
            className="reveal-card rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-premium"
          >
            <div className="h-1.5 w-12 rounded-full bg-brand-amber" />
            <h3 className="mt-5 text-xl font-extrabold text-brand-navy">{service.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Dịch vụ được tối ưu để khách đặt nhanh, tư vấn nhanh và triển khai lịch trình gọn.
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
