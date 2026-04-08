const quickLinks = [
  { href: "#dich-vu", label: "Dịch vụ" },
  { href: "#doi-xe", label: "Đội xe" },
  { href: "#showcase-xe", label: "Chi tiết xe" },
  { href: "#faq", label: "Hỏi đáp" },
  { href: "#booking", label: "Nhận báo giá" }
];

export default function SiteFooter({ siteName, footerText, hotline, address, logoUrl }) {
  return (
    <footer className="border-t border-slate-200 bg-brand-navy text-white">
      <div className="site-shell mx-auto grid gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          {logoUrl ? (
            <div className="flex h-16 w-24 items-center justify-center overflow-hidden rounded-2xl bg-white p-3">
              <img src={logoUrl} alt={siteName ?? "Nhà xe"} className="h-full w-full object-contain" />
            </div>
          ) : null}
          <p className={`${logoUrl ? "mt-4 " : ""}text-sm font-bold uppercase tracking-[0.25em] text-brand-amber`}>
            {siteName ?? "Nhà xe"}
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-200">
            {footerText ??
              "Dịch vụ thuê xe du lịch, cưới hỏi, sân bay và hợp đồng tại Thanh Hóa."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-100">
              Hỗ trợ 24/7
            </span>
            <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-100">
              Xe 4 - 45 chỗ
            </span>
          </div>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-brand-amber">
            Liên hệ
          </p>
          <a
            href={`tel:${hotline ?? "0979860498"}`}
            className="mt-3 block text-lg font-bold text-white"
          >
            {hotline ?? "0979 860 498"}
          </a>
          <p className="mt-3 text-sm leading-7 text-slate-200">
            {address ?? "555 Quang Trung 2, Phường Hạc Thành, Thanh Hóa"}
          </p>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-brand-amber">
            Lối tắt
          </p>
          <div className="mt-3 grid gap-2">
            {quickLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-slate-200 transition hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
