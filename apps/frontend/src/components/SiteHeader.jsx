import { Link, useLocation } from "react-router-dom";

const navItems = [
  { href: "#doi-xe", label: "Đội xe" },
  { href: "#dich-vu", label: "Dịch vụ" },
  { href: "#booking", label: "Liên hệ" },
  {
    href: "https://mail.google.com/mail/?view=cm&fs=1&to=nguyenducmanh261996@gmail.com&su=Ph%E1%BA%A3n%20h%E1%BB%93i%20t%E1%BB%AB%20kh%C3%A1ch%20h%C3%A0ng&body=T%C3%B4i%20mu%E1%BB%91n%20g%E1%BB%ADi%20ph%E1%BA%A3n%20h%E1%BB%93i%20v%E1%BB%81%20d%E1%BB%8Bch%20v%E1%BB%A5%3A%0A",
    label: "Phản hồi",
    external: true
  }
];

export default function SiteHeader({ siteName, siteTagline, hotline, logoUrl }) {
  const location = useLocation();
  const displayName = siteName ?? "Nhà xe";
  const resolveHref = (item) => {
    if (item.external) return item.href;
    return location.pathname === "/" ? item.href : `/${item.href}`;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#d6c19a]/45 bg-[#f8f2e8]/88 backdrop-blur-xl">
      <div className="site-shell mx-auto px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            {logoUrl ? (
              <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-premium">
                <img src={logoUrl} alt={displayName} className="h-full w-full bg-white object-cover object-center" />
              </div>
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#14233c] text-lg font-extrabold text-[#f6efe3] shadow-premium">
                {displayName.charAt(0)}
              </div>
            )}
            <Link to="/" className="min-w-0">
              <p className="truncate text-[11px] font-bold uppercase tracking-[0.3em] text-[#b88a3b]">
                {siteTagline ?? "Dịch vụ vận tải Thanh Hóa"}
              </p>
              <h1 className="truncate text-xl font-black uppercase text-[#14233c] sm:text-2xl">
                {displayName}
              </h1>
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
            className="hover-lift rounded-full bg-[#14233c] px-4 py-3 text-sm font-bold text-[#f6efe3] transition hover:bg-[#b88a3b] lg:hidden"
          >
            Gọi ngay
          </a>
        </div>
      </div>
    </header>
  );
}
