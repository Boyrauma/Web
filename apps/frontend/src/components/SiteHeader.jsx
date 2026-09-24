import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { href: "#doi-xe", label: "Đội xe" },
  { href: "#showcase-xe", label: "Chi tiết xe" },
  { href: "#dich-vu", label: "Dịch vụ" },
  { href: "#quy-trinh", label: "Quy trình" },
  { href: "#booking", label: "Đặt lịch" }
];

export default function SiteHeader({ siteName, siteTagline, hotline, logoUrl }) {
  const location = useLocation();
  const displayName = siteName ?? "Nhà xe Định Dung";
  const [activeHash, setActiveHash] = useState(location.hash);
  const resolveHref = (item) => {
    if (item.external) return item.href;
    return location.pathname === "/" ? item.href : `/${item.href}`;
  };

  useEffect(() => {
    if (location.pathname !== "/") {
      setActiveHash("");
      return undefined;
    }

    let frameId = 0;

    const updateActiveSection = () => {
      frameId = 0;
      const headerHeight = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
      const probeLine = headerHeight + window.innerHeight * 0.28;
      let nextActiveHash = "";

      navItems.forEach((item) => {
        const section = document.getElementById(item.href.slice(1));

        if (section && section.getBoundingClientRect().top <= probeLine) {
          nextActiveHash = item.href;
        }
      });

      setActiveHash((current) => (current === nextActiveHash ? current : nextActiveHash));
    };

    const scheduleActiveSectionUpdate = () => {
      if (!frameId) {
        frameId = window.requestAnimationFrame(updateActiveSection);
      }
    };

    scheduleActiveSectionUpdate();
    window.addEventListener("scroll", scheduleActiveSectionUpdate, { passive: true });
    window.addEventListener("resize", scheduleActiveSectionUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleActiveSectionUpdate);
      window.removeEventListener("resize", scheduleActiveSectionUpdate);
      window.cancelAnimationFrame(frameId);
    };
  }, [location.pathname, location.hash]);

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
            <Link to="/" className="min-w-0" aria-label={displayName}>
              <p className="hidden truncate text-[11px] font-bold uppercase tracking-[0.3em] text-[#9a5c00] sm:block">
                {siteTagline ?? "Dịch vụ vận tải Thanh Hóa"}
              </p>
              <p className="truncate text-lg font-black uppercase text-[#14233c] sm:text-2xl">
                {displayName}
              </p>
            </Link>
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <nav className="flex items-center gap-2 rounded-full border border-[#d8c39f] bg-white/80 px-2 py-2 shadow-[0_12px_40px_rgba(20,35,60,0.08)]">
              {navItems.map((item) => {
                const isActive = location.pathname === "/" && activeHash === item.href;

                return (
                  <a
                    key={item.href}
                    href={resolveHref(item)}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noreferrer" : undefined}
                    aria-current={isActive ? "location" : undefined}
                    className={`nav-pill rounded-full px-4 py-2 text-sm font-bold transition-colors duration-200 ${
                      isActive
                        ? "bg-[#f5ead8] text-[#14233c] shadow-[inset_0_0_0_1px_rgba(154,92,0,0.18)]"
                        : "text-[#46556d] hover:bg-[#f5ead8] hover:text-[#14233c]"
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}
            </nav>
            <a
              href={`tel:${hotline ?? "0979860498"}`}
              className="hover-lift rounded-full bg-[#14233c] px-5 py-3 text-sm font-bold text-[#f6efe3] transition hover:bg-[#9a5c00]"
            >
              {hotline ?? "0979 860 498"}
            </a>
          </div>

          <a
            href={`tel:${hotline ?? "0979860498"}`}
            className="hover-lift shrink-0 rounded-full bg-[#14233c] px-4 py-3 text-sm font-bold text-[#f6efe3] transition hover:bg-[#9a5c00] lg:hidden"
          >
            Gọi ngay
          </a>
        </div>
      </div>
    </header>
  );
}
