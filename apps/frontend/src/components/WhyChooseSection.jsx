const points = [
  {
    title: "Đội xe chỉn chu",
    body: "Xe được giữ sạch, bảo trì đều và đồng bộ hình ảnh khi đón khách."
  },
  {
    title: "Lịch trình linh hoạt",
    body: "Phù hợp sân bay, cưới hỏi, tour riêng và các đoàn cần điều phối giờ giấc."
  },
  {
    title: "Tư vấn nhanh",
    body: "Khách để lại thông tin là có người gọi lại sớm thay vì chờ phản hồi thủ công."
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
            Trải nghiệm gọn gàng, lịch sự và đáng tin cho từng chuyến đi.
          </h3>
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
