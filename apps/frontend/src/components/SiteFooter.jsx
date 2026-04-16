export default function SiteFooter({ siteName, footerText, hotline, address, logoUrl }) {
  return (
    <footer className="border-t border-[#c8ab74]/30 bg-[#0f1a2f] text-white">
      <div className="site-shell mx-auto grid gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.15fr_0.85fr]">
        <div>
          {logoUrl ? (
            <div className="flex h-20 w-28 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
              <img
                src={logoUrl}
                alt={siteName ?? "Nhà xe"}
                className="h-full w-full bg-white object-cover object-center"
              />
            </div>
          ) : null}
          <p className={`${logoUrl ? "mt-4 " : ""}text-sm font-bold uppercase tracking-[0.25em] text-[#d3b277]`}>
            {siteName ?? "Nhà xe"}
          </p>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-200">
            {footerText ??
              "Dịch vụ thuê xe du lịch, cưới hỏi, sân bay và hợp đồng tại Thanh Hóa."}
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d3b277]">
                Khung hỗ trợ
              </p>
              <p className="mt-2 text-base font-extrabold text-white">24/7</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Tiếp nhận lịch sớm và ưu tiên điều phối cho các chuyến riêng, công tác và sự kiện.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d3b277]">
                Khu vực phục vụ
              </p>
              <p className="mt-2 text-base font-extrabold text-white">Thanh Hóa và liên tỉnh</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Phù hợp đưa đón sân bay, tuyến tỉnh, cưới hỏi, tour riêng và hợp đồng dài ngày.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d3b277]">
                Xác nhận chuyến
              </p>
              <p className="mt-2 text-base font-extrabold text-white">Chốt rõ xe và lịch trình</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Thông tin đoàn, thời gian đón và điểm trả được rà lại cẩn thận trước khi điều xe.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-100">
              Hỗ trợ 24/7
            </span>
            <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-100">
              Xe 4 - 45 chỗ
            </span>
            <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-100">
              Phục vụ chỉn chu
            </span>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#d3b277]">
            Liên hệ
          </p>
          <a
            href={`tel:${hotline ?? "0979860498"}`}
            className="mt-3 block text-2xl font-black text-white"
          >
            {hotline ?? "0979 860 498"}
          </a>
          <p className="mt-3 text-sm leading-7 text-slate-200">
            {address ?? "555 Quang Trung 2, Phường Hạc Thành, Thanh Hóa"}
          </p>
          <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d3b277]">
              Thông tin hữu ích
            </p>
            <div className="mt-3 space-y-3 text-sm text-slate-200">
              <p>Phù hợp cho xe gia đình, đoàn công tác, cưới hỏi và các lịch trình cần sự chỉn chu.</p>
              <p>Ưu tiên xác nhận nhanh các yêu cầu có ngày đi, số người và điểm đón rõ ràng.</p>
              <p>Đội xe được sắp theo quy mô đoàn để tối ưu trải nghiệm di chuyển và nhịp vận hành.</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <a
              href={`tel:${hotline ?? "0979860498"}`}
              className="block rounded-2xl bg-[#f6efe3] px-5 py-4 text-center font-bold text-[#14233c] transition hover:bg-white"
            >
              Gọi ngay
            </a>
            <a
              href="#booking"
              className="block rounded-2xl border border-[#d3b277]/35 px-5 py-4 text-center font-bold text-white transition hover:bg-white/10"
            >
              Liên hệ tư vấn
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="site-shell mx-auto flex flex-col gap-3 px-4 py-5 text-sm text-slate-300 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <p>
            {siteName ?? "Nhà xe"} vận hành dịch vụ thuê xe với thông tin chuyến đi được xác nhận
            rõ ràng trước khi điều phối.
          </p>
          <p>Hotline: {hotline ?? "0979 860 498"} • Điểm hỗ trợ: {address ?? "Thanh Hóa"}</p>
        </div>
      </div>
    </footer>
  );
}
