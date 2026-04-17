import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import StickyContactBar from "../components/StickyContactBar";
import { fetchSiteSettings, fetchVehicleBySlug, resolveAssetUrl } from "../services/api";
import { applyDocumentBranding } from "../utils/branding";
import { applySeo, buildVehicleSchema } from "../utils/seo";

export default function VehicleDetailPage() {
  const { slug } = useParams();
  const [siteSettings, setSiteSettings] = useState([]);
  const [vehicle, setVehicle] = useState(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [state, setState] = useState({ loading: true, error: "" });

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const [settingsData, vehicleData] = await Promise.all([
          fetchSiteSettings(),
          fetchVehicleBySlug(slug)
        ]);

        if (!ignore) {
          setSiteSettings(settingsData);
          setVehicle(vehicleData);
          setSelectedImageUrl(vehicleData.images?.[0]?.imageUrl ?? "");
          setState({ loading: false, error: "" });
        }
      } catch (error) {
        if (!ignore) {
          setState({ loading: false, error: error.message });
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [slug]);

  const settingsMap = Object.fromEntries(siteSettings.map((item) => [item.key, item.value]));
  const siteLogoUrl = settingsMap.logo_url ? resolveAssetUrl(settingsMap.logo_url) : "";
  const gallery = (vehicle?.images ?? []).map((image) => ({
    ...image,
    fullUrl: resolveAssetUrl(image.imageUrl)
  }));
  const currentImage =
    gallery.find((image) => image.imageUrl === selectedImageUrl)?.fullUrl ??
    gallery[0]?.fullUrl ??
    "/assets/xecountybonghoi.jpg";

  useEffect(() => {
    applyDocumentBranding({
      faviconUrl: settingsMap.favicon_url
    });
  }, [settingsMap.favicon_url]);

  useEffect(() => {
    const siteName = settingsMap.site_name ?? "Nhà xe Định Dung";
    const title = vehicle?.name
      ? `${vehicle.name} | ${siteName}`
      : settingsMap.browser_title ?? `${siteName} | Chi tiết xe`;
    const description =
      vehicle?.description ||
      vehicle?.shortDescription ||
      `Chi tiết dòng xe ${vehicle?.name ?? ""} tại ${siteName}. Xem hình ảnh, số chỗ và liên hệ đặt xe nhanh.`;
    const canonicalPath = vehicle?.slug ? `/xe/${vehicle.slug}` : `/xe/${slug}`;
    const schema = vehicle
      ? buildVehicleSchema({
          vehicle,
          siteName,
          canonicalUrl: new URL(canonicalPath, window.location.origin).toString(),
          images: gallery.map((item) => item.fullUrl)
        })
      : null;

    applySeo({
      title,
      description,
      canonicalPath,
      image: currentImage,
      type: "website",
      siteName,
      keywords: vehicle?.category?.name
        ? `${vehicle.name}, ${vehicle.category.name}, thuê xe ${vehicle.name}, nhà xe Thanh Hóa`
        : undefined,
      schema
    });
  }, [
    currentImage,
    gallery,
    settingsMap.browser_title,
    settingsMap.site_name,
    slug,
    vehicle
  ]);

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <SiteHeader
        siteName={settingsMap.site_name}
        siteTagline={settingsMap.site_tagline}
        hotline={settingsMap.hotline}
        logoUrl={siteLogoUrl}
      />
      <main className="site-shell mx-auto px-4 py-16 sm:px-6">
        <Link to="/" className="text-sm font-bold uppercase tracking-[0.2em] text-brand-amber">
          Quay lại trang chủ
        </Link>

        {state.loading ? <p className="mt-6 text-slate-500">Đang tải dữ liệu xe...</p> : null}
        {state.error ? (
          <div className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {state.error}
          </div>
        ) : null}

        {vehicle ? (
          <div className="mt-8 space-y-10">
            <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-4">
                <div className="vehicle-stage vehicle-stage-detail h-[420px] w-full rounded-[2rem] shadow-[0_28px_70px_rgba(20,35,60,0.14)]">
                  <img
                    src={currentImage}
                    alt={vehicle.name}
                    loading="lazy"
                    decoding="async"
                    className="vehicle-stage-image"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  {gallery.map((image) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setSelectedImageUrl(image.imageUrl)}
                      className={`overflow-hidden rounded-2xl border-2 ${
                        selectedImageUrl === image.imageUrl
                          ? "border-brand-amber"
                          : "border-transparent"
                      }`}
                    >
                      <div className="vehicle-thumb-stage h-20 w-24">
                        <img
                          src={image.fullUrl}
                          alt={image.altText ?? vehicle.name}
                          loading="lazy"
                          decoding="async"
                          className="vehicle-thumb-image"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-[#e4d5bb] bg-white/92 p-8 shadow-[0_24px_70px_rgba(20,35,60,0.08)]">
                <p className="text-sm font-bold uppercase tracking-[0.3em] text-brand-amber">
                  {vehicle.category?.name}
                </p>
                <h1 className="mt-3 text-4xl font-black text-brand-navy">{vehicle.name}</h1>
                <div className="mt-4 flex flex-wrap gap-3">
                  <span className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-brand-navy">
                    {vehicle.seatCount} chỗ
                  </span>
                  {vehicle.isFeatured ? (
                    <span className="inline-flex rounded-full bg-brand-sky px-4 py-2 text-sm font-bold text-brand-navy">
                      Xe nổi bật
                    </span>
                  ) : null}
                </div>
                <p className="mt-6 text-slate-600">
                  {vehicle.description || vehicle.shortDescription}
                </p>
                {vehicle.features?.length ? (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {vehicle.features.map((feature) => (
                      <span
                        key={feature}
                        className="rounded-full bg-brand-sky px-4 py-2 text-sm font-semibold text-brand-navy"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.25rem] bg-slate-100 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-amber">
                      Phù hợp
                    </p>
                    <p className="mt-2 font-bold text-brand-navy">
                      Công tác, du lịch, sân bay, sự kiện
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] bg-slate-100 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-amber">
                      Ưu tiên
                    </p>
                    <p className="mt-2 font-bold text-brand-navy">
                      Xe sạch, đúng giờ, hỗ trợ theo lịch trình
                    </p>
                  </div>
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href={`tel:${settingsMap.hotline ?? "0979860498"}`}
                    className="rounded-2xl bg-[#14233c] px-6 py-4 font-bold text-white transition hover:bg-[#b88a3b]"
                  >
                    Gọi tư vấn
                  </a>
                  <a
                    href="/#booking"
                    className="rounded-2xl border border-brand-navy px-6 py-4 font-bold text-brand-navy transition hover:border-brand-amber hover:text-brand-amber"
                  >
                    Liên hệ ngay
                  </a>
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
              <div className="rounded-[2rem] border border-[#e4d5bb] bg-white/92 p-8 shadow-[0_24px_70px_rgba(20,35,60,0.08)]">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-brand-amber">
                  Lý do nên chọn dòng xe này
                </p>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.5rem] bg-slate-50 p-5">
                    <h2 className="text-lg font-extrabold text-brand-navy">Không gian dễ chịu</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      Phù hợp lịch trình nhiều giờ với khoang ngồi thoải mái và dễ sắp xếp người đi.
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] bg-slate-50 p-5">
                    <h2 className="text-lg font-extrabold text-brand-navy">Hình ảnh chỉnh chu</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      Thích hợp cho tiếp khách, sự kiện, cưới hỏi hoặc đoàn cần cảm giác chuyên nghiệp.
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] bg-slate-50 p-5">
                    <h2 className="text-lg font-extrabold text-brand-navy">Linh hoạt tuyến đường</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      Dùng tốt cho nội tỉnh, liên tỉnh, sân bay và các hành trình nhiều điểm dừng.
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] bg-slate-50 p-5">
                    <h2 className="text-lg font-extrabold text-brand-navy">Hỗ trợ nhanh</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      Luồng quản trị đã tối ưu để liên hệ, chốt lịch và phản hồi yêu cầu nhanh hơn.
                    </p>
                  </div>
                </div>
              </div>

              <aside className="rounded-[2rem] bg-[#14233c] p-8 text-white shadow-premium">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-brand-amber">
                  Cần chốt xe nhanh?
                </p>
                <h2 className="mt-3 text-3xl font-black">Liên hệ để giữ lịch trình phù hợp</h2>
                <p className="mt-4 text-slate-200">
                  Chỉ cần gọi hoặc gửi yêu cầu liên hệ, hệ thống admin sẽ nhận booking và phản hồi
                  để xác nhận ngay dòng xe phù hợp.
                </p>
                <div className="mt-6 space-y-3">
                  <a
                    href={`tel:${settingsMap.hotline ?? "0979860498"}`}
                    className="block rounded-2xl bg-white px-5 py-4 text-center font-bold text-brand-navy transition hover:bg-slate-100"
                  >
                    {settingsMap.hotline ?? "0979 860 498"}
                  </a>
                  <a
                    href="/#booking"
                    className="block rounded-2xl border border-white/30 px-5 py-4 text-center font-bold text-white transition hover:bg-white/10"
                  >
                    Gửi yêu cầu liên hệ
                  </a>
                </div>
                <div className="mt-8 grid gap-3">
                  <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-slate-100">
                    Hỗ trợ chốt xe cho lịch cá nhân, đoàn công ty và gia đình
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-slate-100">
                    Có thể tư vấn nhanh theo số người và cung đường
                  </div>
                </div>
              </aside>
            </section>
          </div>
        ) : null}
      </main>
      <SiteFooter
        siteName={settingsMap.site_name}
        footerText={settingsMap.footer_text}
        hotline={settingsMap.hotline}
        address={settingsMap.address}
        logoUrl={siteLogoUrl}
      />
      <StickyContactBar hotline={settingsMap.hotline} />
    </div>
  );
}
