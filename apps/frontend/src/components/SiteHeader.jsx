import { Link, useLocation } from "react-router-dom";

const navItems = [
  { href: "#doi-xe", label: "Đội xe" },
  { href: "#dich-vu", label: "Dịch vụ" },
  { href: "#booking", label: "Đặt lịch" },
  { href: "#phan-hoi", label: "Phản hồi" }
];

export default function SiteHeader({ siteName, siteTagline, hotline, logoUrl }) {
  const location = useLocation();
  const displayName = siteName ?? "Nhà xe Định Dung";
  const resolveHref = (item) => {
    if (item.external) return item.href;
    return location.pathname === "/" ? item.href : `/${item.href}`;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#d6c19a]/45 bg-[#f8f2e8]/88 backdrop-blur-xl">
      <div className="site-shell mx-auto px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            {logoUrl ? (
              <div className="flex h-12 w-[4.25rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-premium sm:h-14 sm:w-20">
                <img
                  src={logoUrl}
                  alt={displayName}
                  className="h-full w-full bg-white object-cover object-center"
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#14233c] text-lg font-extrabold text-[#f6efe3] shadow-premium">
                {displayName.charAt(0)}
              </div>
            )}
            <Link to="/" className="min-w-0">
              <p className="hidden truncate text-[11px] font-bold uppercase tracking-[0.3em] text-[#b88a3b] sm:block">
                {siteTagline ?? "Dịch vụ vận tải Thanh Hóa"}
              </p>
              <p className="truncate text-lg font-black uppercase text-[#14233c] sm:text-2xl">
                {displayName}
              </p>
            </Link>
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <nav className="flex items-center gap-2 rounded-full border border-[#d8c39f] bg-white/80 px-2 py-2 shadow-[0_12px_40px_rgba(20,35,60,0.08)]">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={resolveHref(item)}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noreferrer" : undefined}
                  className="nav-pill rounded-full px-4 py-2 text-sm font-bold text-[#46556d] transition hover:bg-[#f5ead8] hover:text-[#14233c]"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <a
              href={`tel:${hotline ?? "0979860498"}`}
              className="hover-lift rounded-full bg-[#14233c] px-5 py-3 text-sm font-bold text-[#f6efe3] transition hover:bg-[#b88a3b]"
            >
              {hotline ?? "0979 860 498"}
            </a>
          </div>

          <a
            href={`tel:${hotline ?? "0979860498"}`}
            className="hover-lift shrink-0 rounded-full bg-[#14233c] px-4 py-3 text-sm font-bold text-[#f6efe3] transition hover:bg-[#b88a3b] lg:hidden"
          >
            Gọi ngay
          </a>
        </div>
      </div>
    </header>
  );
}
