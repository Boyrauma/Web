const testimonials = [
  {
    name: "Khách đoàn công ty",
    quote: "Xe sạch, đúng giờ và cách hỗ trợ rất gọn. Đoàn đi dài mà vẫn cảm thấy dễ chịu."
  },
  {
    name: "Khách cưới hỏi",
    quote: "Phần điều phối nhanh, giao tiếp lịch sự, xe lên hình đẹp nên gia đình rất yên tâm."
  },
  {
    name: "Khách sân bay",
    quote: "Đặt gấp nhưng vẫn có xe phù hợp, tài xế chủ động liên hệ trước giờ đón."
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
            Những cảm nhận thường gặp từ khách hàng
          </h3>
        </div>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {testimonials.map((item) => (
          <article
            key={item.name}
            className="reveal-card rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-sm"
          >
            <p className="text-base leading-8 text-slate-700">“{item.quote}”</p>
            <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.2em] text-brand-amber">
              {item.name}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
