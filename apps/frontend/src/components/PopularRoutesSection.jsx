const routes = [
  "Thanh Hóa - Nội Bài",
  "Thanh Hóa - Hà Nội",
  "Sầm Sơn - Ninh Bình",
  "Thanh Hóa - Cửa Lò"
];

export default function PopularRoutesSection() {
  return (
    <section className="site-shell mx-auto px-4 py-16 sm:px-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-brand-amber">
              Tuyến phổ biến
            </p>
            <h3 className="mt-3 text-3xl font-black text-brand-navy">
              Những hành trình khách thường đặt
            </h3>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-slate-600">
            Khối nội dung này tăng cảm giác thực tế và giúp khách hình dung dịch vụ có phù hợp nhu cầu của họ hay không.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {routes.map((route) => (
            <div
              key={route}
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-brand-navy"
            >
              {route}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
