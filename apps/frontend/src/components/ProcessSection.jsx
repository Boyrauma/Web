const steps = [
  {
    title: "Gửi yêu cầu hoặc gọi hotline",
    note:
      "Cuối tuần, dịp lễ hoặc đoàn đông nên đặt trước 3–7 ngày. Bạn có thể ghi rõ mẫu xe mong muốn trong form."
  },
  {
    title: "Nhận tư vấn xe phù hợp và liên hệ xác nhận nhanh",
    note:
      "Nhà xe hỗ trợ lịch sân bay, cưới hỏi, tour nhiều chặng và hành trình riêng theo nhu cầu."
  },
  {
    title: "Chốt lịch, điểm đón và triển khai chuyến đi",
    note:
      "Nhân viên sẽ xác nhận thời gian, lộ trình, số chỗ và dòng xe phù hợp trước khi điều xe."
  }
];

export default function ProcessSection() {
  return (
    <section id="quy-trinh" className="section-shell bg-brand-navy py-16 text-white">
      <div className="site-shell relative mx-auto px-4 sm:px-6">
        <div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-brand-gold">
              Quy trình
            </p>
            <h2 className="display-serif mt-3 text-4xl">Đặt xe nhanh trong 3 bước</h2>
          </div>
        </div>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="glass-card flex h-full flex-col rounded-[1.75rem] border border-white/10 p-6"
            >
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-gold">
                Bước {index + 1}
              </p>
              <h3 className="mt-4 text-lg font-bold leading-8">{step.title}</h3>
              <p className="mt-5 border-t border-white/10 pt-5 text-sm leading-6 text-slate-200">
                <span className="font-bold text-brand-gold">Lưu ý: </span>
                {step.note}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
