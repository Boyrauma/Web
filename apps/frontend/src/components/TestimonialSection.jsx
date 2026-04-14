const testimonials = [
  {
    name: "Khách doanh nghiệp",
    quote:
      "Xe sạch, đúng giờ và khâu điều phối rất gọn. Lịch trình nhiều điểm nhưng cả đoàn vẫn giữ được nhịp di chuyển thoải mái."
  },
  {
    name: "Khách sự kiện gia đình",
    quote:
      "Quy trình xác nhận rõ ràng, tài xế đúng giờ và hình ảnh xe chỉn chu nên gia đình rất yên tâm trong ngày quan trọng."
  },
  {
    name: "Khách đón sân bay",
    quote:
      "Lịch cần gấp nhưng vẫn được sắp xe phù hợp. Bộ phận điều hành chủ động liên hệ trước giờ đón nên trải nghiệm rất nhẹ nhàng."
  }
];

export default function TestimonialSection() {
  return (
    <section className="site-shell mx-auto px-4 py-16 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-brand-amber">
            Phản hồi
          </p>
          <h3 className="display-serif mt-3 text-4xl text-brand-navy">
            Những cảm nhận thường thấy từ khách hàng đã sử dụng dịch vụ
          </h3>
        </div>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {testimonials.map((item) => (
          <article
            key={item.name}
            className="reveal-card rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-sm"
          >
            <p className="text-base leading-8 text-slate-700">"{item.quote}"</p>
            <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.2em] text-brand-amber">
              {item.name}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
