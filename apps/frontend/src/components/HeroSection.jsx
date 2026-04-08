export default function HeroSection({ heroTitle, heroSubtitle, hotline, siteName }) {
  return (
    <section className="hero-surface overflow-hidden border-b-4 border-brand-amber">
      <div className="site-shell mx-auto grid gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
        <div className="space-y-7">
          <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-brand-amber">
            Thuê xe du lịch uy tín
          </span>
          <h2 className="display-serif max-w-4xl text-4xl leading-tight text-white sm:text-6xl">
            {heroTitle ?? "Vạn dặm bình an, trọn vẹn niềm tin"}
          </h2>
          <p className="max-w-3xl text-lg leading-8 text-slate-100">
            {heroSubtitle ??
              "Chuyên xe 7 chỗ, 16 chỗ, 29-35 chỗ cho du lịch, cưới hỏi, sự kiện và đưa đón sân bay tại Thanh Hóa."}
          </p>
          <div className="grid max-w-3xl gap-4 sm:grid-cols-3">
            <div className="glass-card rounded-[1.5rem] border border-white/10 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-amber">
                Hỗ trợ
              </p>
              <p className="mt-2 text-2xl font-extrabold text-white">24/7</p>
            </div>
            <div className="glass-card rounded-[1.5rem] border border-white/10 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-amber">
                Dòng xe
              </p>
              <p className="mt-2 text-2xl font-extrabold text-white">4 - 45</p>
            </div>
            <div className="glass-card rounded-[1.5rem] border border-white/10 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-amber">
                Ưu tiên
              </p>
              <p className="mt-2 text-2xl font-extrabold text-white">Đúng giờ</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <a
              href={`tel:${hotline ?? "0979860498"}`}
              className="rounded-2xl bg-white px-6 py-4 text-base font-bold text-brand-navy shadow-premium transition hover:-translate-y-0.5 hover:bg-slate-100"
            >
              Gọi ngay
            </a>
            <a
              href="#booking"
              className="rounded-2xl border border-white/30 px-6 py-4 text-base font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              Yêu cầu báo giá
            </a>
          </div>
        </div>
        <div className="glass-card rounded-[2rem] border border-white/15 p-6">
          <img
            src="/assets/xecountybonghoi2.png"
            alt={`Xe ${siteName ?? "nhà xe"}`}
            className="h-[420px] w-full rounded-[1.5rem] object-cover shadow-premium"
          />
          <div className="mt-4 rounded-[1.25rem] bg-white/10 p-4 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-amber">
              Hình ảnh đội xe
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-100">
              Hình ảnh thật, xe đồng bộ và dễ lựa chọn cho từng nhu cầu từ cá nhân đến đoàn lớn.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
