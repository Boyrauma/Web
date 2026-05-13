export default function SiteFooter({ siteName, footerText, hotline, address, logoUrl, groupLink }) {
  const resolvedSiteName = siteName ?? "Nhà xe Định Dung";
  const resolvedFooterText =
    footerText ?? "Dịch vụ thuê xe du lịch, cưới hỏi, sân bay và hợp đồng tại Thanh Hóa.";
  const resolvedAddress = address ?? "555 Quang Trung 2, Phường Hạc Thành, Thanh Hóa";
  const resolvedHotline = hotline ?? "0979 860 498";

  const infoCards = [
    {
      label: "Khung hỗ trợ",
      title: "24/7",
      body: "Tiếp nhận lịch sớm và ưu tiên điều phối cho các chuyến riêng, công tác và sự kiện."
    },
    {
      label: "Khu vực phục vụ",
      title: "Thanh Hóa và liên tỉnh",
      body: "Phù hợp đưa đón sân bay, tuyến tỉnh, cưới hỏi, tour riêng và hợp đồng dài ngày."
    },
    {
      label: "Xác nhận chuyến",
      title: "Chốt rõ xe và lịch trình",
      body: "Thời gian đón, điểm trả và thông tin đoàn được rà lại trước khi điều xe."
    }
  ];

  return (
    <footer className="relative overflow-hidden border-t border-[#c8ab74]/30 bg-[#0d182b] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_0%,rgba(211,178,119,0.13),transparent_26%),radial-gradient(circle_at_88%_12%,rgba(255,255,255,0.07),transparent_24%)]" />
      <div className="site-shell relative mx-auto px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1.22fr_0.78fr] lg:items-start">
          <div>
            <div className="flex gap-5">
              {logoUrl ? (
                <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1.25rem] bg-white shadow-[0_18px_45px_rgba(0,0,0,0.2)]">
                  <img
                    src={logoUrl}
                    alt={resolvedSiteName}
                    className="h-full w-full bg-white object-cover object-center"
                  />
                </div>
              ) : null}

              <div className="min-w-0">
                <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#d3b277]">
                  {resolvedSiteName}
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
                  {resolvedFooterText}
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {infoCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.12)]"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d3b277]">
                    {card.label}
                  </p>
                  <p className="mt-3 text-base font-extrabold text-white">{card.title}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{card.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {["Hỗ trợ 24/7", "Xe 4 - 45 chỗ", "Phục vụ chỉn chu"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-100"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#d3b277]">
              Liên hệ
            </p>
            <div className="mt-5 space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d3b277]">
                  Hotline
                </p>
                <p className="mt-2 text-3xl font-black text-white">{resolvedHotline}</p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d3b277]">
                  Địa chỉ nhà xe
                </p>
                <p className="mt-2 leading-7 text-slate-200">{resolvedAddress}</p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d3b277]">
                  Group Facebook
                </p>
                {groupLink ? (
                  <div className="mt-2 inline-flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full bg-[#1877f2] text-white shadow-[0_10px_24px_rgba(24,119,242,0.28)]"
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="currentColor"
                      >
                        <path d="M13.6 20v-7.3h2.5l.4-2.8h-2.9V8.1c0-.8.2-1.4 1.4-1.4h1.6V4.2c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v1.8H7.8v2.8h2.6V20h3.2Z" />
                      </svg>
                    </span>
                    <a
                      href={groupLink}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-slate-100 underline-offset-4 transition hover:text-[#d3b277] hover:underline"
                    >
                      Nhà Xe Định Dung
                    </a>
                  </div>
                ) : (
                  <p className="mt-2 font-semibold text-slate-300">Chưa cập nhật</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <div className="site-shell mx-auto px-4 py-5 text-center text-sm text-slate-300 sm:px-6">
          <p>{resolvedSiteName} vận hành dịch vụ thuê xe với thông tin chuyến đi được xác nhận rõ ràng trước khi điều phối.</p>
        </div>
      </div>
    </footer>
  );
}
