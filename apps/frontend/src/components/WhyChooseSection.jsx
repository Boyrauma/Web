const points = [
  {
    title: "Đội xe tuyển chọn",
    body: "Xe được giữ sạch, bảo trì đều và chuẩn hình ảnh đón khách cho các chuyến riêng, công tác và đoàn gia đình."
  },
  {
    title: "Lịch trình chuẩn chỉnh",
    body: "Phù hợp sân bay, cưới hỏi, tour riêng và các lịch trình nhiều điểm cần sắp xếp giờ giấc rõ ràng."
  },
  {
    title: "Xác nhận tinh gọn",
    body: "Thông tin chuyến đi được rà lại nhanh để chốt đúng quy mô đoàn, dòng xe và thời gian phục vụ."
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
              <div className="h-1.5 w-12 rounded-full bg-brand-amber" />
              <h4 className="mt-5 text-xl font-extrabold text-brand-navy">{point.title}</h4>
              <p className="mt-3 text-sm leading-7 text-slate-600">{point.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
