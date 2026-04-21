export default function HeroSection({
  heroTitle,
  heroSubtitle,
  siteName,
  backgroundImageUrl,
  hotline
}) {
  const legacyTitle = "Vạn dặm bình an, trọn vẹn niềm tin";
  const legacySubtitle =
    "Chuyên xe 4-7 chỗ, 16 chỗ, 29-35-45 chỗ cho du lịch, cưới hỏi, sự kiện và đưa đón sân bay tại Thanh Hóa.";
  const resolvedSiteName = siteName ?? "Nhà xe Định Dung";
  const isCustomTitle = heroTitle?.trim() && heroTitle.trim() !== legacyTitle;
  const hasBackgroundImage = backgroundImageUrl?.trim();

  const resolvedTitle = isCustomTitle ? heroTitle.trim() : "Đồng hành chỉn chu cùng";

  const resolvedSubtitle =
    heroSubtitle?.trim() && heroSubtitle.trim() !== legacySubtitle
      ? heroSubtitle.trim()
      : "Nhận lịch gia đình, sân bay, cưới hỏi và đoàn công tác tại Thanh Hóa.";
  const primarySubtitle =
    "Dịch vụ vận chuyển chuyên nghiệp cho những chuyến đi cần sự an tâm và đúng hẹn.";
  const trustLine =
    "Đội xe từ 4 đến 45 chỗ, đáp ứng từ nhu cầu đi riêng đến các chuyến đi theo đoàn.";

  return (
    <section className="hero-surface relative left-1/2 right-1/2 min-h-[680px] w-screen -translate-x-1/2 overflow-hidden border-b border-[#c8ab74]/35">
      <div className="pointer-events-none absolute inset-0">
        {hasBackgroundImage ? (
          <img
            src={backgroundImageUrl}
            alt=""
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-80"
          />
        ) : null}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(211,178,119,0.16),transparent_26%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.08),transparent_22%),linear-gradient(135deg,rgba(12,24,46,0.42),rgba(23,39,69,0.34),rgba(22,41,75,0.44))]" />
        <div className="absolute inset-y-0 right-0 w-[38%] bg-[linear-gradient(270deg,rgba(255,255,255,0.08),transparent)]" />
        <div className="absolute right-[-30px] top-[-20px] h-56 w-56 rounded-full bg-[#d3b277]/12 blur-3xl" />
        <div className="absolute bottom-[-80px] left-10 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[680px] w-full max-w-[920px] items-center justify-center px-4 py-14 text-center sm:px-6 lg:py-20">
        <div className="max-w-[820px]">
          <span className="hero-fade inline-flex rounded-full border border-[#d3b277]/25 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#d9bb84]">
            Nhà xe Định Dung · Thanh Hóa
          </span>
          <h2 className="display-serif hero-fade-delay hero-text-strong mt-6 text-4xl leading-[1.04] text-white sm:text-5xl lg:text-[4.15rem]">
            {isCustomTitle ? (
              resolvedTitle
            ) : (
              <>
                {resolvedTitle} <span className="whitespace-nowrap">{resolvedSiteName}</span>
              </>
            )}
          </h2>
          <div className="hero-fade-delay hero-text-soft mx-auto mt-6 max-w-[860px] space-y-4">
            <p className="mx-auto max-w-full text-base font-semibold leading-8 text-slate-100 sm:text-lg lg:whitespace-nowrap">
              Dịch vụ vận chuyển chuyên nghiệp cho những chuyến đi cần sự an tâm và đúng hẹn.
            </p>
            <p className="mx-auto max-w-[680px] text-base font-semibold leading-8 text-slate-100 sm:text-lg">
              {resolvedSubtitle}
            </p>
            <p className="mx-auto max-w-[680px] text-[15px] font-semibold leading-7 text-slate-200/90 sm:text-base">
              {trustLine}
            </p>
          </div>
          <div className="hero-fade-delay-2 mt-8">
            <a
              href={`tel:${hotline ?? "0979860498"}`}
              className="hero-text-soft hotline-glow inline-flex rounded-full border border-[#d3b277]/30 bg-white/12 px-7 py-4 text-base font-extrabold uppercase tracking-[0.18em] text-white sm:text-lg"
            >
              Hotline: {hotline ?? "0979 860 498"}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
