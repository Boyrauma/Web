const items = [
  "Xe đời mới, nội thất sạch",
  "Tài xế kinh nghiệm tuyến dài",
  "Hỗ trợ nhanh qua hotline và Zalo",
  "Linh hoạt đoàn nhỏ đến đoàn lớn"
];

export default function TrustStrip() {
  return (
    <section className="section-shell border-y border-slate-200 bg-white/70">
      <div className="site-shell relative mx-auto grid gap-3 px-4 py-5 sm:px-6 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-full border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 shadow-sm"
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
