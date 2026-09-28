export default function HeroSection({
  heroTitle,
  heroSubtitle,
  siteName,
  backgroundImageUrl,
  hotline
}) {
  const legacyTitles = new Set([
    "Vạn dặm bình an, trọn vẹn niềm tin",
    "Đi đúng giờ, về đúng hẹn."
  ]);
  const legacySubtitles = new Set([
    "Chuyên xe 4-7 chỗ, 16 chỗ, 29-35-45 chỗ cho du lịch, cưới hỏi, sự kiện và đưa đón sân bay tại Thanh Hóa.",
    "Chuyên xe 7 chỗ, 16 chỗ, 29-35 chỗ cho du lịch, cưới hỏi, sự kiện và đưa đón sân bay tại Thanh Hóa.",
    "Nhận lịch gia đình, sân bay, cưới hỏi và đoàn công tác tại Thanh Hóa."
  ]);
  const resolvedSiteName = siteName ?? "Nhà xe Định Dung";
  const isCustomTitle = heroTitle?.trim() && !legacyTitles.has(heroTitle.trim());
  const hasBackgroundImage = backgroundImageUrl?.trim();

  const resolvedTitle = isCustomTitle
    ? heroTitle.trim()
    : "Đúng xe, đúng lịch, an tâm trọn hành trình.";

  const resolvedSubtitle =
    heroSubtitle?.trim() && !legacySubtitles.has(heroSubtitle.trim())
      ? heroSubtitle.trim()
      : "Cho thuê xe hợp đồng từ 4 đến 45 chỗ cho du lịch, cưới hỏi, công tác, sự kiện và đưa đón sân bay.";
  const trustLine =
    "Nhận xe riêng theo chuyến · Lịch trình theo nhu cầu · Phục vụ gia đình, doanh nghiệp và đoàn khách.";

  return (
    <section className="hero-surface relative min-h-[680px] w-full overflow-hidden border-b border-[#c8ab74]/35">
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

      <div className="relative mx-auto flex min-h-[680px] w-full max-w-[1320px] items-center justify-center px-4 py-16 text-center sm:px-6 lg:py-24">
        <div className="max-w-[920px]">
          <h1 className="display-serif hero-fade-delay hero-text-strong text-[2.15rem] leading-[1.02] tracking-[-0.035em] text-white sm:text-[3.8rem] lg:text-[4.9rem]">
            {resolvedSiteName}
          </h1>
          <p className="display-serif hero-fade-delay hero-text-strong mx-auto mt-5 max-w-[920px] text-[2.45rem] leading-[1.08] text-[#f6efe3] sm:text-[3.3rem] lg:text-[4rem]">
            {resolvedTitle}
          </p>
          <div className="hero-fade-delay hero-text-soft mx-auto mt-7 max-w-[860px] space-y-4">
            <p className="mx-auto max-w-[860px] text-base font-semibold leading-8 text-slate-100 sm:text-lg">
              Dịch vụ xe hợp đồng riêng, phục vụ tận nơi theo lịch trình của khách hàng.
            </p>
            <p className="mx-auto max-w-[640px] text-base font-semibold leading-8 text-slate-100 sm:text-lg">
              {resolvedSubtitle}
            </p>
            <p className="mx-auto max-w-[860px] text-base font-semibold leading-8 text-slate-100 sm:text-lg">
              {trustLine}
            </p>
          </div>
          <div className="hero-fade-delay-2 mt-10">
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
