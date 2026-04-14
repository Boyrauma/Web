export default function HeroSection({ heroTitle, heroSubtitle, siteName }) {
  const legacyTitle = "Vạn dặm bình an, trọn vẹn niềm tin";
  const legacySubtitle =
    "Chuyên xe 4-7 chỗ, 16 chỗ, 29-35-45 chỗ cho du lịch, cưới hỏi, sự kiện và đưa đón sân bay tại Thanh Hóa.";
  const resolvedSiteName = siteName ?? "Nhà xe Định Dung";
  const isCustomTitle = heroTitle?.trim() && heroTitle.trim() !== legacyTitle;

  const resolvedTitle = isCustomTitle ? heroTitle.trim() : "Đồng hành chỉn chu cùng";

  const resolvedSubtitle =
    heroSubtitle?.trim() && heroSubtitle.trim() !== legacySubtitle
      ? heroSubtitle.trim()
      : "Dịch vụ vận chuyển chuyên nghiệp, đúng hẹn và rõ ràng cho những hành trình cần sự an tâm.";

  return (
    <section className="hero-surface overflow-hidden border-b border-[#c8ab74]/50">
      <div className="site-shell mx-auto px-4 py-14 sm:px-6 lg:py-20">
        <div className="relative mx-auto max-w-[1080px] px-6 py-12 sm:px-10 lg:px-18 lg:py-16">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(211,178,119,0.12),transparent_24%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.05),transparent_22%)]" />
            <div className="absolute right-[-50px] top-[-40px] h-52 w-52 rounded-full bg-[#d3b277]/10 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-[900px] text-center">
            <span className="inline-flex rounded-full border border-[#d3b277]/25 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#d9bb84]">
              Nhà xe uy tín tại Thanh Hóa
            </span>
            <h2 className="display-serif mt-6 text-4xl leading-[1.08] text-white sm:text-5xl lg:text-[4.15rem]">
              {isCustomTitle ? (
                resolvedTitle
              ) : (
                <>
                  {resolvedTitle}{" "}
                  <span className="whitespace-nowrap">{resolvedSiteName}</span>
                </>
              )}
            </h2>
            <p className="mx-auto mt-6 max-w-[620px] text-base leading-8 text-slate-200 sm:text-lg">
              {resolvedSubtitle}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
