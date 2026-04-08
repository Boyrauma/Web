const navItems = [
  { href: "#dich-vu", label: "Dịch vụ" },
  { href: "#doi-xe", label: "Đội xe" },
  { href: "#showcase-xe", label: "Chi tiết xe" },
  { href: "#faq", label: "Hỏi đáp" },
  { href: "#booking", label: "Báo giá" }
];

export default function SiteHeader({ siteName, siteTagline, hotline, logoUrl }) {
  const displayName = siteName ?? "Nhà xe";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="site-shell mx-auto px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            {logoUrl ? (
              <div className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-premium ring-1 ring-slate-200">
                <img src={logoUrl} alt={displayName} className="h-full w-full object-contain" />
              </div>
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-navy text-lg font-extrabold text-white shadow-premium">
                {displayName.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold uppercase tracking-[0.3em] text-brand-amber">
                {siteTagline ?? "Dịch vụ vận tải Thanh Hóa"}
              </p>
              <h1 className="truncate text-xl font-black uppercase text-brand-navy sm:text-2xl">
                {displayName}
              </h1>
            </div>
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <nav className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-2 shadow-sm">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-brand-navy"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <a
              href={`tel:${hotline ?? "0979860498"}`}
              className="rounded-full bg-brand-navy px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-brand-amber"
            >
              {hotline ?? "0979 860 498"}
            </a>
          </div>

          <a
            href={`tel:${hotline ?? "0979860498"}`}
            className="rounded-full bg-brand-navy px-4 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-brand-amber lg:hidden"
          >
            Gọi ngay
          </a>
        </div>
      </div>
    </header>
  );
}
