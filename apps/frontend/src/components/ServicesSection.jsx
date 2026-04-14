const serviceDescriptionMap = {
  "Thuê xe du lịch":
    "Phù hợp cho chuyến đi gia đình, nhóm bạn, tour riêng và các hành trình cần xe sạch, thoải mái.",
  "Xe cưới hỏi":
    "Dành cho ngày trọng đại với hình ảnh xe chỉn chu, thời gian đón đúng hẹn và phong cách phục vụ lịch sự.",
  "Đưa đón sân bay":
    "Ưu tiên lịch trình đúng giờ cho các chuyến bay sớm, khuya hoặc cần chủ động sắp xếp thời gian di chuyển.",
  "Hợp đồng dài hạn":
    "Phù hợp cho doanh nghiệp, công trình hoặc lịch trình cố định cần phương án vận hành ổn định theo thời gian."
};

const fallbackServices = [
  {
    slug: "fallback-1",
    title: "Thuê xe du lịch",
    description: serviceDescriptionMap["Thuê xe du lịch"]
  },
  {
    slug: "fallback-2",
    title: "Xe cưới hỏi",
    description: serviceDescriptionMap["Xe cưới hỏi"]
  },
  {
    slug: "fallback-3",
    title: "Đưa đón sân bay",
    description: serviceDescriptionMap["Đưa đón sân bay"]
  },
  {
    slug: "fallback-4",
    title: "Hợp đồng dài hạn",
    description: serviceDescriptionMap["Hợp đồng dài hạn"]
  }
];

function getServiceDescription(service) {
  if (serviceDescriptionMap[service.title]) {
    return serviceDescriptionMap[service.title];
  }

  if (service.description?.trim()) {
    return service.description;
  }

  return "Dịch vụ được tối ưu để khách liên hệ nhanh, xác nhận gọn và triển khai lịch trình rõ ràng.";
}

export default function ServicesSection({ services, error }) {
  const serviceItems = services.length ? services : fallbackServices;

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
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {serviceItems.map((service) => (
          <div
            key={service.slug}
            className="reveal-card rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-premium"
          >
            <div className="h-1.5 w-12 rounded-full bg-brand-amber" />
            <h3 className="mt-5 text-xl font-extrabold text-brand-navy">{service.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {getServiceDescription(service)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
