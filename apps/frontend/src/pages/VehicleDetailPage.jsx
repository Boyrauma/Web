import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import StickyContactBar from "../components/StickyContactBar";
import VehicleGalleryLightbox from "../components/VehicleGalleryLightbox";
import { fetchSiteSettings, fetchVehicleBySlug, resolveAssetUrl } from "../services/api";
import { applyDocumentBranding } from "../utils/branding";
import { applySeo, buildVehicleSchema } from "../utils/seo";

function getVehicleNarrative(vehicle) {
  const slug = vehicle?.slug ?? "";
  const seatCount = vehicle?.seatCount ?? 0;

  const bySlug = {
    santafe: {
      fit: "Gia đình đi tỉnh, đón sân bay và lịch công tác cần xe êm, gọn và dễ lên xuống.",
      priority: "Ưu tiên sự riêng tư, khoang ngồi thoải mái và lịch trình rõ từ đầu.",
      highlights: [
        {
          title: "Đi gia đình vừa đẹp",
          body: "Hợp với nhà có người lớn tuổi hoặc trẻ nhỏ vì khoang ngồi dễ chịu, lên xe gọn và không quá cao."
        },
        {
          title: "Đón sân bay nhẹ nhàng",
          body: "Dòng xe này phù hợp các lịch đón tiễn cần đúng giờ, ít khách nhưng vẫn có chỗ cho hành lý cơ bản."
        },
        {
          title: "Công tác nhìn chỉn chu",
          body: "Khi cần đưa đón đối tác hoặc đi họp trong ngày, xe giữ được cảm giác lịch sự và nghiêm túc."
        },
        {
          title: "Chốt tuyến linh hoạt",
          body: "Dễ đi nội thành, liên huyện hoặc các lịch trình có vài điểm dừng mà vẫn giữ nhịp chuyến gọn."
        }
      ],
      asideTitle: "Dòng xe này hợp lịch gia đình và công tác ngắn",
      asideBody:
        "Nếu bạn đang cần một xe 7 chỗ gọn, sạch và dễ đi nhiều kiểu cung đường trong ngày, bên nhà xe có thể rà lịch và giữ chuyến nhanh."
    },
    "vinfat-lux-a2-0": {
      fit: "Đưa đón khách riêng, đi công việc trong ngày và những lịch cần xe 4 chỗ nhìn gọn gàng.",
      priority: "Ưu tiên sự lịch sự, kín đáo và cảm giác xe riêng hơn là đi theo kiểu đoàn.",
      highlights: [
        {
          title: "Hợp lịch tiếp khách",
          body: "Phù hợp những chuyến cần hình ảnh chỉn chu, nhất là đưa đón đối tác hoặc khách cá nhân."
        },
        {
          title: "Đi thành phố gọn",
          body: "Dễ chạy tuyến ngắn, đưa đón nhiều điểm trong nội thành hoặc đi công việc bán kính vừa."
        },
        {
          title: "Ngồi riêng tư hơn",
          body: "So với xe đông chỗ, dòng này giữ cảm giác kín và thoải mái hơn cho khách ít người."
        },
        {
          title: "Hợp lịch chốt nhanh",
          body: "Khi lịch đi đã rõ giờ và số người ít, loại xe này thường dễ xếp chuyến và điều xe nhanh."
        }
      ],
      asideTitle: "Phù hợp lịch 4 chỗ cần sự riêng và gọn",
      asideBody:
        "Nếu bạn cần một xe 4 chỗ cho lịch gặp khách, đi công việc hoặc đón tiễn cá nhân, bên nhà xe có thể tư vấn và giữ lịch nhanh."
    },
    "huyndai-solati": {
      fit: "Đoàn vừa, đưa đón sự kiện, đi lễ hoặc lịch đi tỉnh cần không gian đứng ngồi thoáng hơn xe nhỏ.",
      priority: "Ưu tiên khoang xe rộng, lên xuống thoải mái và giữ nhịp tốt cho nhóm khách 10 đến 16 người.",
      highlights: [
        {
          title: "Khoang ngồi thoáng",
          body: "Hợp với nhóm đi đường dài hoặc đoàn gia đình nhiều người cần cảm giác ngồi đỡ bí hơn xe nhỏ."
        },
        {
          title: "Lên xuống gọn",
          body: "Dễ dùng cho lịch có người lớn tuổi, khách mang đồ hoặc đoàn lên xuống nhiều điểm khác nhau."
        },
        {
          title: "Đi lễ, đi tỉnh ổn",
          body: "Dòng này hợp các chuyến đi tỉnh, đi lễ hoặc lịch cuối tuần cần đủ chỗ nhưng chưa tới xe khách lớn."
        },
        {
          title: "Chở đoàn vừa đẹp",
          body: "Khi số khách rơi vào khoảng giữa, Solati thường là phương án cân bằng giữa thoải mái và chi phí."
        }
      ],
      asideTitle: "Đây là dòng xe hợp cho đoàn vừa cần ngồi thoải mái",
      asideBody:
        "Nếu lịch đi của bạn rơi vào nhóm 10 đến 16 khách, bên nhà xe có thể kiểm tra nhanh để xếp đúng xe và đúng giờ đón."
    },
    "huyndai-county": {
      fit: "Đoàn đông vừa, hành hương, cưới hỏi và những tuyến đi tỉnh cần xe khách gọn nhưng đủ chỗ.",
      priority: "Ưu tiên chở đoàn ổn định, ngồi theo nhóm và giữ chuyến rõ ràng cho lịch đã chốt sẵn.",
      highlights: [
        {
          title: "Hợp đoàn 20 đến gần 30 khách",
          body: "County phù hợp khi đoàn không quá lớn nhưng cần ngồi cùng một xe thay vì tách nhiều xe nhỏ."
        },
        {
          title: "Đi lễ và tour ngắn ổn",
          body: "Dòng xe này hay hợp với lịch hành hương, cưới hỏi hoặc tour ngắn trong ngày cần xe gọn mà đủ chỗ."
        },
        {
          title: "Dễ điều phối lịch nhóm",
          body: "Khi đã rõ số người và giờ xuất phát, loại xe này giúp điều hành chuyến đi nhóm rõ ràng hơn."
        },
        {
          title: "Giữ hình ảnh nghiêm túc",
          body: "Xe hợp các lịch cần sự chỉn chu vừa phải, không quá nhỏ mà cũng không tạo cảm giác xe đại trà."
        }
      ],
      asideTitle: "County hợp những lịch đoàn cần chốt rõ từ đầu",
      asideBody:
        "Nếu đoàn của bạn đi theo nhóm 20 đến gần 30 người, bên nhà xe có thể rà lịch và tư vấn đúng phiên bản xe đang phù hợp."
    },
    "huyndai-universe": {
      fit: "Đoàn lớn, tour đường dài, sự kiện công ty và lịch đưa đón đông người cần một xe đủ tải.",
      priority: "Ưu tiên đủ chỗ, chạy đoàn lớn gọn và giảm việc chia khách sang nhiều xe khác nhau.",
      highlights: [
        {
          title: "Chở đoàn lớn gọn hơn",
          body: "Universe phù hợp những lịch có đông khách, giúp gom đoàn vào một xe thay vì tách lịch phức tạp."
        },
        {
          title: "Đi tour dài ổn hơn",
          body: "Những cung đường liên tỉnh hoặc lịch đi nhiều giờ hợp với xe lớn vì giữ nhịp đoàn ổn định hơn."
        },
        {
          title: "Hợp sự kiện công ty",
          body: "Đưa đón nhân sự, khách mời hoặc đoàn hội họp sẽ dễ điều phối hơn khi dùng một xe lớn đồng nhất."
        },
        {
          title: "Chốt lịch sớm sẽ đẹp",
          body: "Với dòng xe lớn, chốt trước giờ đi và điểm đón trả càng rõ thì việc điều xe càng chắc và đúng nhịp."
        }
      ],
      asideTitle: "Dòng xe này hợp tour lớn và lịch công ty",
      asideBody:
        "Nếu bạn đang xếp một đoàn đông hoặc tuyến đường dài, nhà xe có thể kiểm tra sớm để giữ xe lớn phù hợp và lên lịch đón rõ ràng."
    },
    "thaco-evergreen": {
      fit: "Đoàn doanh nghiệp, khách sự kiện và nhóm đi tỉnh cần xe 35 chỗ vừa tầm, không quá lớn như 45 chỗ.",
      priority: "Ưu tiên chỗ ngồi cho đoàn tầm trung, giữ nhịp chuyến đi gọn và phù hợp nhiều kiểu tuyến.",
      highlights: [
        {
          title: "Vừa cho đoàn tầm trung",
          body: "Đây là lựa chọn cân bằng khi số khách nhiều hơn xe 29 chỗ nhưng chưa cần đẩy lên 45 chỗ."
        },
        {
          title: "Hợp lịch công ty",
          body: "Các chuyến đưa đón nhân viên, hội nhóm hoặc hoạt động nội bộ thường rất hợp với dòng xe 35 chỗ."
        },
        {
          title: "Đi tỉnh và tour ngắn tốt",
          body: "Xe phù hợp những tuyến liên tỉnh hoặc tour ngắn cần một xe chung cho cả đoàn nhưng vẫn gọn điều phối."
        },
        {
          title: "Linh hoạt hơn xe lớn",
          body: "So với xe 45 chỗ, loại này dễ cân đối hơn khi đoàn không quá đông mà vẫn muốn giữ một xe chung."
        }
      ],
      asideTitle: "Xe 35 chỗ hợp đoàn công ty và nhóm vừa đông",
      asideBody:
        "Nếu số khách của bạn rơi vào nhóm 30 đến hơn 30 người, đây là loại xe đáng cân nhắc để giữ chuyến gọn mà không bị dư quá nhiều chỗ."
    }
  };

  if (bySlug[slug]) {
    return bySlug[slug];
  }

  if (seatCount <= 7) {
    return {
      fit: "Đi gia đình, sân bay và lịch công việc cần xe nhỏ gọn, dễ chốt giờ và dễ đi nhiều điểm.",
      priority: "Ưu tiên riêng tư, đúng giờ và cảm giác ngồi thoải mái cho nhóm ít người.",
      highlights: [
        {
          title: "Hợp khách ít người",
          body: "Phù hợp lịch gia đình nhỏ, khách đi riêng hoặc những chuyến không cần xe quá nhiều chỗ."
        },
        {
          title: "Đi nội thành gọn",
          body: "Dễ xoay xở với lịch đón trả trong phố, đi sân bay hoặc di chuyển nhiều điểm trong ngày."
        },
        {
          title: "Hình ảnh chỉn chu",
          body: "Giữ cảm giác lịch sự và gọn gàng cho lịch công tác, gặp khách hoặc đưa đón cá nhân."
        },
        {
          title: "Chốt tuyến nhanh",
          body: "Khi lịch trình đã rõ, xe nhỏ thường dễ xếp chuyến và giữ giờ hơn."
        }
      ],
      asideTitle: "Dòng xe nhỏ phù hợp lịch đi gọn",
      asideBody:
        "Nếu bạn cần một chuyến gia đình, sân bay hoặc công việc trong ngày, nhà xe có thể rà nhanh để tư vấn loại xe đúng nhu cầu."
    };
  }

  if (seatCount <= 16) {
    return {
      fit: "Đoàn vừa, đi tỉnh, đi lễ hoặc lịch cần khoang xe thoáng hơn xe nhỏ.",
      priority: "Ưu tiên không gian ngồi, lên xuống tiện và giữ chuyến gọn cho nhóm tầm trung.",
      highlights: [
        {
          title: "Đủ chỗ cho đoàn vừa",
          body: "Hợp nhóm khách không quá đông nhưng vẫn muốn đi cùng một xe cho dễ điều hành."
        },
        {
          title: "Khoang xe thoáng hơn",
          body: "Khi lịch đi nhiều giờ hoặc cần chỗ cho đồ cá nhân, xe 16 chỗ sẽ dễ chịu hơn nhóm xe nhỏ."
        },
        {
          title: "Đi lễ, đi tỉnh ổn",
          body: "Dễ dùng cho lịch nội tỉnh, liên tỉnh hoặc các chuyến cuối tuần đi theo nhóm."
        },
        {
          title: "Giữ lịch trình rõ",
          body: "Khi đã có số khách tương đối chắc, nhà xe sẽ dễ chốt loại xe này và sắp giờ đón."
        }
      ],
      asideTitle: "Phù hợp nhóm khách tầm trung",
      asideBody:
        "Nếu lịch đi của bạn nằm trong nhóm đoàn vừa, nhà xe có thể kiểm tra và chốt nhanh loại xe 16 chỗ phù hợp."
    };
  }

  return {
    fit: "Đoàn đông, tour riêng và các lịch sự kiện cần một xe đủ chỗ, dễ điều phối theo nhóm.",
    priority: "Ưu tiên gom đoàn gọn, rõ giờ đón trả và hạn chế chia khách sang nhiều xe khác nhau.",
    highlights: [
      {
        title: "Hợp đi theo đoàn",
        body: "Phù hợp các chuyến có đông khách, giúp giữ mọi người cùng một xe và dễ kiểm soát hành trình."
      },
      {
        title: "Đi tỉnh và tour tốt",
        body: "Những tuyến dài hoặc nhiều điểm dừng sẽ thuận hơn khi đoàn đi cùng một xe lớn."
      },
      {
        title: "Dễ điều hành lịch nhóm",
        body: "Khi giờ đi, điểm đón và số khách đã rõ, việc xếp xe lớn sẽ mạch lạc và chắc chuyến hơn."
      },
      {
        title: "Hợp cưới hỏi, sự kiện",
        body: "Dòng xe lớn thường hợp các lịch cần đưa đón tập trung và giữ hình ảnh thống nhất cho cả đoàn."
      }
    ],
    asideTitle: "Dòng xe này hợp các lịch đông người",
    asideBody:
      "Nếu bạn đang xếp đoàn đông hoặc lịch sự kiện, nhà xe có thể kiểm tra nhanh để giữ đúng xe và chốt lộ trình rõ ràng."
  };
}

export default function VehicleDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [siteSettings, setSiteSettings] = useState([]);
  const [vehicle, setVehicle] = useState(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
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
  const selectedImageIndex = Math.max(
    0,
    gallery.findIndex((image) => image.imageUrl === selectedImageUrl)
  );
  const currentImage = gallery[selectedImageIndex]?.fullUrl ?? "/assets/xecountybonghoi.jpg";
  const narrative = getVehicleNarrative(vehicle);

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

  function showPreviousImage() {
    if (!gallery.length) return;
    setSelectedImageUrl(gallery[(selectedImageIndex - 1 + gallery.length) % gallery.length].imageUrl);
  }

  function showNextImage() {
    if (!gallery.length) return;
    setSelectedImageUrl(gallery[(selectedImageIndex + 1) % gallery.length].imageUrl);
  }

  function showImageAt(index) {
    if (!gallery[index]) return;
    setSelectedImageUrl(gallery[index].imageUrl);
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <SiteHeader
        siteName={settingsMap.site_name}
        siteTagline={settingsMap.site_tagline}
        hotline={settingsMap.hotline}
        logoUrl={siteLogoUrl}
      />
      <main className="site-shell mx-auto px-4 py-16 sm:px-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm font-bold uppercase tracking-[0.2em] text-brand-amber"
        >
          Quay lại trang trước
        </button>

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
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="group relative block w-full overflow-hidden rounded-[2rem] text-left shadow-[0_28px_70px_rgba(20,35,60,0.14)]"
                  aria-label={`Xem bộ ảnh ${vehicle.name}`}
                >
                  <div className="vehicle-stage vehicle-stage-detail h-[420px] w-full">
                    <img
                      src={currentImage}
                      alt={vehicle.name}
                      loading="lazy"
                      decoding="async"
                      className="vehicle-stage-image transition duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-slate-950/68 via-slate-950/20 to-transparent px-5 py-5 text-white">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-amber">
                        Bộ ảnh chi tiết
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white/90">
                        Nhấn để xem ảnh ở kích thước lớn
                      </p>
                    </div>
                    <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur">
                      {selectedImageIndex + 1} / {gallery.length || 1}
                    </span>
                  </div>
                </button>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-500">
                    Chọn ảnh để xem nhanh hoặc mở bộ ảnh toàn màn hình.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="inline-flex shrink-0 items-center justify-center rounded-full border border-brand-navy/15 bg-white/85 px-4 py-2 text-sm font-bold text-brand-navy shadow-[0_12px_28px_rgba(20,35,60,0.08)] transition hover:border-brand-amber hover:text-brand-amber"
                  >
                    Xem ảnh lớn
                  </button>
                </div>

                <div className="flex flex-wrap gap-3">
                  {gallery.map((image) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setSelectedImageUrl(image.imageUrl)}
                      className={`overflow-hidden rounded-2xl border-2 transition ${
                        selectedImageUrl === image.imageUrl
                          ? "border-brand-amber shadow-[0_10px_24px_rgba(184,138,59,0.18)]"
                          : "border-transparent hover:border-brand-navy/20"
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
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.25rem] bg-slate-100 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-amber">
                      Phù hợp
                    </p>
                    <p className="mt-2 font-bold leading-7 text-brand-navy">{narrative.fit}</p>
                  </div>
                  <div className="rounded-[1.25rem] bg-slate-100 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-amber">
                      Ưu tiên
                    </p>
                    <p className="mt-2 font-bold leading-7 text-brand-navy">{narrative.priority}</p>
                  </div>
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href={`tel:${settingsMap.hotline ?? "0979860498"}`}
                    className="rounded-2xl bg-[#14233c] px-6 py-4 font-bold text-white transition hover:bg-[#b88a3b]"
                  >
                    Gọi tư vấn
                  </a>
                  <Link
                    to="/#booking"
                    className="rounded-2xl border border-brand-navy px-6 py-4 font-bold text-brand-navy transition hover:border-brand-amber hover:text-brand-amber"
                  >
                    Liên hệ ngay
                  </Link>
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
              <div className="rounded-[2rem] border border-[#e4d5bb] bg-white/92 p-8 shadow-[0_24px_70px_rgba(20,35,60,0.08)]">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-brand-amber">
                  Dòng xe này hợp với kiểu chuyến nào
                </p>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {narrative.highlights.map((item) => (
                    <div key={item.title} className="rounded-[1.5rem] bg-slate-50 p-5">
                      <h2 className="text-lg font-extrabold text-brand-navy">{item.title}</h2>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="rounded-[2rem] bg-[#14233c] p-8 text-white shadow-premium">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-brand-amber">
                  Cần chốt xe nhanh?
                </p>
                <h2 className="mt-3 text-3xl font-black">{narrative.asideTitle}</h2>
                <p className="mt-4 text-slate-200">{narrative.asideBody}</p>
                <div className="mt-6 space-y-3">
                  <a
                    href={`tel:${settingsMap.hotline ?? "0979860498"}`}
                    className="block rounded-2xl bg-white px-5 py-4 text-center font-bold text-brand-navy transition hover:bg-slate-100"
                  >
                    {settingsMap.hotline ?? "0979 860 498"}
                  </a>
                  <Link
                    to="/#booking"
                    className="block rounded-2xl border border-white/30 px-5 py-4 text-center font-bold text-white transition hover:bg-white/10"
                  >
                    Gửi yêu cầu liên hệ
                  </Link>
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
      {isLightboxOpen && gallery.length ? (
        <VehicleGalleryLightbox
          gallery={gallery}
          title={vehicle?.name}
          currentIndex={selectedImageIndex}
          onClose={() => setIsLightboxOpen(false)}
          onPrev={showPreviousImage}
          onNext={showNextImage}
          onSelect={showImageAt}
        />
      ) : null}
    </div>
  );
}
