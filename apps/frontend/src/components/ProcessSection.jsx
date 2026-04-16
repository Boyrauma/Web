const steps = [
  "Gửi yêu cầu hoặc gọi hotline",
  "Nhận tư vấn xe phù hợp và liên hệ xác nhận nhanh",
  "Chốt lịch, điểm đón và triển khai chuyến đi"
];

export default function ProcessSection() {
  return (
    <section className="section-shell bg-brand-navy py-16 text-white">
      <div className="site-shell relative mx-auto px-4 sm:px-6">
        <div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-brand-amber">
              Quy trình
            </p>
            <h3 className="display-serif mt-3 text-4xl">Đặt xe nhanh trong 3 bước</h3>
          </div>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step} className="glass-card rounded-[1.75rem] border border-white/10 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-amber">
                Bước {index + 1}
              </p>
              <p className="mt-4 text-lg font-bold leading-8">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
