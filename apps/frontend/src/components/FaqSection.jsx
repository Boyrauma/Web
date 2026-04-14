const faqs = [
  {
    question: "Tôi nên đặt xe trước bao lâu?",
    answer:
      "Với các lịch trình cuối tuần, lễ hoặc đoàn đông, nên đặt trước từ 3 đến 7 ngày để giữ đúng dòng xe mong muốn."
  },
  {
    question: "Nhà xe có hỗ trợ đưa đón sân bay và tour nhiều điểm không?",
    answer:
      "Có. Hệ thống phù hợp cả các chuyến sân bay, cưới hỏi, du lịch nhiều chặng và lịch trình riêng theo yêu cầu."
  },
  {
    question: "Tôi sẽ được liên hệ xác nhận như thế nào?",
    answer:
      "Sau khi gửi yêu cầu, admin sẽ liên hệ để xác nhận lịch trình, thời gian sử dụng, số chỗ và dòng xe phù hợp."
  },
  {
    question: "Có thể chọn xe cụ thể trước khi đi không?",
    answer:
      "Có thể. Bạn có thể xem từng mẫu xe trên website và ghi rõ nhu cầu trong form để được ưu tiên đúng dòng xe."
  }
];

export default function FaqSection() {
  return (
    <section id="faq" className="section-shell bg-white/70 py-16">
      <div className="site-shell-narrow mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-brand-amber">
            Giải đáp nhanh
          </p>
          <h3 className="mt-2 text-3xl font-black uppercase text-brand-navy">
            Câu hỏi khách hàng thường hỏi
          </h3>
          <p className="mt-4 text-slate-600">
            Những thông tin quan trọng nhất được gom lại để khách mới dễ quyết định hơn, không cần
            gọi nhiều lần mới nắm được quy trình.
          </p>
        </div>

        <div className="mt-10 grid gap-4">
          {faqs.map((item) => (
            <details
              key={item.question}
              className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left text-lg font-bold text-brand-navy">
                <span>{item.question}</span>
                <span className="rounded-full bg-brand-sky px-3 py-1 text-sm font-black text-brand-navy transition group-open:bg-brand-amber group-open:text-white">
                  Mở
                </span>
              </summary>
              <p className="mt-4 max-w-5xl text-slate-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
