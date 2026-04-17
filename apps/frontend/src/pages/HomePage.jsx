import { useEffect, useMemo, useState } from "react";
import BookingSection from "../components/BookingSection";
import FleetSection from "../components/FleetSection";
import HeroSection from "../components/HeroSection";
import ProcessSection from "../components/ProcessSection";
import ServicesSection from "../components/ServicesSection";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import StickyContactBar from "../components/StickyContactBar";
import VehicleGalleryLightbox from "../components/VehicleGalleryLightbox";
import VehicleShowcaseSection from "../components/VehicleShowcaseSection";
import { applyDocumentBranding } from "../utils/branding";
import { applySeo, buildLocalBusinessSchema } from "../utils/seo";
import {
  createBookingRequest,
  fetchBookingCaptcha,
  fetchServices,
  fetchSiteSettings,
  fetchVehicleCategories,
  resolveAssetUrl
} from "../services/api";

async function sha256Hex(input) {
  if (!window.crypto?.subtle) {
    throw new Error("Trình duyệt không hỗ trợ xác thực nâng cao.");
  }

  const buffer = await window.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input)
  );
  return Array.from(new Uint8Array(buffer), (value) => value.toString(16).padStart(2, "0")).join("");
}

async function solveProofOfWork({ challenge, difficulty }) {
  const prefix = "0".repeat(Math.max(1, difficulty));

  for (let nonce = 0; nonce < 200000; nonce += 1) {
    const hash = await sha256Hex(`${challenge}:${nonce}`);

    if (hash.startsWith(prefix)) {
      return String(nonce);
    }
  }

  throw new Error("Không thể hoàn tất xác thực nâng cao. Vui lòng tải lại captcha.");
}

function buildTurnstileState(captcha, resetKey) {
  const enabled = Boolean(captcha?.turnstile?.enabled && captcha?.turnstile?.siteKey);

  return {
    enabled,
    siteKey: enabled ? captcha.turnstile.siteKey : "",
    token: "",
    error: "",
    resetKey: resetKey + 1
  };
}

function buildFallbackTurnstileState(resetKey) {
  return {
    enabled: false,
    siteKey: "",
    token: "",
    error: "",
    resetKey: resetKey + 1
  };
}

export default function HomePage() {
  const [siteSettings, setSiteSettings] = useState([]);
  const [services, setServices] = useState([]);
  const [vehicleCategories, setVehicleCategories] = useState([]);
  const [selectedVehicleSlug, setSelectedVehicleSlug] = useState("");
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [fleetGalleryState, setFleetGalleryState] = useState({
    open: false,
    title: "",
    images: [],
    currentIndex: 0
  });
  const [pageState, setPageState] = useState({ loading: true, error: "" });
  const [formData, setFormData] = useState({
    customerName: "",
    phoneNumber: "",
    tripDate: "",
    passengerCount: "",
    pickupLocation: "",
    dropoffLocation: "",
    note: "",
    captchaAnswer: "",
    website: ""
  });
  const [submitState, setSubmitState] = useState({ loading: false, message: "", error: "" });
  const [captchaState, setCaptchaState] = useState({
    loading: true,
    prompt: "",
    token: "",
    proofChallenge: "",
    proofDifficulty: 0,
    proofNonce: "",
    proofLoading: false,
    proofReady: false,
    proofError: ""
  });
  const [turnstileState, setTurnstileState] = useState({
    enabled: false,
    siteKey: "",
    token: "",
    error: "",
    resetKey: 0
  });

  useEffect(() => {
    let ignore = false;

    async function loadPageData() {
      try {
        const [settingsData, servicesData, categoriesData] = await Promise.all([
          fetchSiteSettings(),
          fetchServices(),
          fetchVehicleCategories()
        ]);

        if (!ignore) {
          setSiteSettings(settingsData);
          setServices(servicesData);
          setVehicleCategories(categoriesData);
          const firstVehicle = categoriesData.flatMap((category) => category.vehicles ?? [])[0];
          setSelectedVehicleSlug(firstVehicle?.slug ?? "");
          setSelectedImageUrl(firstVehicle?.images?.[0]?.imageUrl ?? "");
          setPageState({ loading: false, error: "" });
        }
      } catch (error) {
        if (!ignore) {
          setPageState({ loading: false, error: error.message });
        }
      }
    }

    loadPageData();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadCaptcha() {
      try {
        const captcha = await fetchBookingCaptcha();

        if (!ignore) {
          setCaptchaState({
            loading: false,
            prompt: captcha.prompt,
            token: captcha.token,
            proofChallenge: captcha.proofOfWork?.challenge ?? "",
            proofDifficulty: Number(captcha.proofOfWork?.difficulty ?? 0),
            proofNonce: "",
            proofLoading: true,
            proofReady: false,
            proofError: ""
          });
          setTurnstileState((current) => buildTurnstileState(captcha, current.resetKey));
        }
      } catch {
        if (!ignore) {
          setCaptchaState({
            loading: false,
            prompt: "",
            token: "",
            proofChallenge: "",
            proofDifficulty: 0,
            proofNonce: "",
            proofLoading: false,
            proofReady: false,
            proofError: "Không thể tải captcha. Vui lòng thử lại."
          });
          setTurnstileState((current) => buildFallbackTurnstileState(current.resetKey));
        }
      }
    }

    loadCaptcha();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function runProofOfWork() {
      if (!captchaState.token || !captchaState.proofChallenge || !captchaState.proofDifficulty) {
        return;
      }

      try {
        const proofNonce = await solveProofOfWork({
          challenge: captchaState.proofChallenge,
          difficulty: captchaState.proofDifficulty
        });

        if (!cancelled) {
          setCaptchaState((current) => ({
            ...current,
            proofNonce,
            proofLoading: false,
            proofReady: true,
            proofError: ""
          }));
        }
      } catch (error) {
        if (!cancelled) {
          setCaptchaState((current) => ({
            ...current,
            proofNonce: "",
            proofLoading: false,
            proofReady: false,
            proofError: error.message
          }));
        }
      }
    }

    if (captchaState.proofLoading) {
      runProofOfWork();
    }

    return () => {
      cancelled = true;
    };
  }, [
    captchaState.proofChallenge,
    captchaState.proofDifficulty,
    captchaState.proofLoading,
    captchaState.token
  ]);

  const settingsMap = useMemo(
    () => Object.fromEntries(siteSettings.map((item) => [item.key, item.value])),
    [siteSettings]
  );
  const siteLogoUrl = settingsMap.logo_url ? resolveAssetUrl(settingsMap.logo_url) : "";
  const heroBackgroundUrl = settingsMap.hero_background_url
    ? resolveAssetUrl(settingsMap.hero_background_url)
    : "";

  useEffect(() => {
    applyDocumentBranding({
      faviconUrl: settingsMap.favicon_url
    });
  }, [settingsMap.favicon_url]);

  useEffect(() => {
    const siteName = settingsMap.site_name ?? "Nhà xe Định Dung";
    const title =
      settingsMap.browser_title ?? `${siteName} | Thuê xe du lịch, cưới hỏi, sân bay tại Thanh Hóa`;
    const description =
      settingsMap.hero_subtitle ??
      "Dịch vụ thuê xe du lịch, cưới hỏi, sân bay và hợp đồng tại Thanh Hóa. Đặt xe nhanh, hỗ trợ rõ ràng, đúng giờ.";
    const servicesForSchema = services.map((item) => item.title).filter(Boolean);

    applySeo({
      title,
      description,
      canonicalPath: "/",
      image: heroBackgroundUrl || siteLogoUrl || "/favicon.svg",
      type: "website",
      siteName,
      keywords:
        "nhà xe Thanh Hóa, thuê xe du lịch Thanh Hóa, xe cưới Thanh Hóa, xe sân bay, đặt xe hợp đồng",
      schema: buildLocalBusinessSchema({
        siteName,
        description,
        url: window.location.origin,
        image: heroBackgroundUrl || siteLogoUrl || "/favicon.svg",
        logo: siteLogoUrl || "/favicon.svg",
        hotline: settingsMap.hotline,
        address: settingsMap.address,
        zalo: settingsMap.zalo,
        services: servicesForSchema
      })
    });
  }, [
    heroBackgroundUrl,
    services,
    settingsMap.address,
    settingsMap.browser_title,
    settingsMap.hero_subtitle,
    settingsMap.hotline,
    settingsMap.site_name,
    settingsMap.zalo,
    siteLogoUrl
  ]);

  const flattenedVehicles = useMemo(
    () =>
      vehicleCategories.flatMap((category) =>
        (category.vehicles ?? []).map((vehicle) => ({
          ...vehicle,
          categoryName: category.name
        }))
      ),
    [vehicleCategories]
  );

  const selectedVehicle = useMemo(
    () => flattenedVehicles.find((vehicle) => vehicle.slug === selectedVehicleSlug) ?? null,
    [flattenedVehicles, selectedVehicleSlug]
  );

  const selectedVehicleGallery = useMemo(
    () =>
      (selectedVehicle?.images ?? []).map((image) => ({
        ...image,
        fullUrl: resolveAssetUrl(image.imageUrl)
      })),
    [selectedVehicle]
  );

  useEffect(() => {
    if (!selectedVehicleGallery.length) return;
    setSelectedImageUrl(selectedVehicleGallery[0].imageUrl);
  }, [selectedVehicleSlug, selectedVehicleGallery]);

  async function refreshCaptcha() {
    setCaptchaState((current) => ({
      ...current,
      loading: true,
      prompt: "",
      token: "",
      proofChallenge: "",
      proofDifficulty: 0,
      proofNonce: "",
      proofLoading: true,
      proofReady: false,
      proofError: ""
    }));
    setTurnstileState((current) => buildFallbackTurnstileState(current.resetKey));

    try {
      const captcha = await fetchBookingCaptcha();
      setCaptchaState({
        loading: false,
        prompt: captcha.prompt,
        token: captcha.token,
        proofChallenge: captcha.proofOfWork?.challenge ?? "",
        proofDifficulty: Number(captcha.proofOfWork?.difficulty ?? 0),
        proofNonce: "",
        proofLoading: true,
        proofReady: false,
        proofError: ""
      });
      setTurnstileState((current) => buildTurnstileState(captcha, current.resetKey));
    } catch {
      setCaptchaState({
        loading: false,
        prompt: "",
        token: "",
        proofChallenge: "",
        proofDifficulty: 0,
        proofNonce: "",
        proofLoading: false,
        proofReady: false,
        proofError: "Không thể tải captcha. Vui lòng thử lại."
      });
      setTurnstileState((current) => buildFallbackTurnstileState(current.resetKey));
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setSubmitState((current) =>
      current.error || current.message ? { loading: false, message: "", error: "" } : current
    );
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function handleTurnstileTokenChange(token) {
    setTurnstileState((current) => ({
      ...current,
      token,
      error: token ? "" : current.error
    }));
  }

  function handleTurnstileError(errorMessage) {
    setTurnstileState((current) => ({
      ...current,
      token: "",
      error: errorMessage
    }));
  }

  function validateBookingForm(data) {
    const requiredFields = [
      data.customerName,
      data.phoneNumber,
      data.tripDate,
      data.passengerCount,
      data.pickupLocation,
      data.dropoffLocation,
      data.captchaAnswer
    ];

    if (requiredFields.some((value) => !String(value ?? "").trim())) {
      return "Vui lòng nhập đầy đủ thông tin liên hệ.";
    }

    if (data.customerName.trim().length < 2) {
      return "Vui lòng nhập họ và tên hợp lệ.";
    }

    const phoneDigits = data.phoneNumber.replace(/\D/g, "");
    if (phoneDigits.length < 8 || phoneDigits.length > 15) {
      return "Vui lòng nhập số điện thoại hợp lệ.";
    }

    const passengerCount = Number(data.passengerCount);
    if (!Number.isInteger(passengerCount) || passengerCount <= 0) {
      return "Vui lòng nhập số người hợp lệ.";
    }

    if (Number.isNaN(Date.parse(data.tripDate))) {
      return "Vui lòng chọn ngày đi hợp lệ.";
    }

    if (!captchaState.token) {
      return "Không thể tải captcha. Vui lòng thử lại sau ít phút.";
    }

    if (captchaState.proofLoading) {
      return "Hệ thống đang hoàn tất xác thực chống bot. Vui lòng chờ thêm một chút.";
    }

    if (!captchaState.proofNonce) {
      return captchaState.proofError || "Xác thực chống bot chưa sẵn sàng. Vui lòng thử lại.";
    }

    if (turnstileState.enabled && !turnstileState.token) {
      return turnstileState.error || "Vui lòng hoàn tất xác thực Cloudflare trước khi gửi.";
    }

    return "";
  }

  function handleOpenFleetGallery(title, images, index = 0) {
    if (!images?.length) return;
    setFleetGalleryState({
      open: true,
      title,
      images,
      currentIndex: index
    });
  }

  function handleCloseFleetGallery() {
    setFleetGalleryState((current) => ({
      ...current,
      open: false
    }));
  }

  function handleFleetGalleryIndexChange(nextIndex) {
    setFleetGalleryState((current) => ({
      ...current,
      currentIndex:
        ((nextIndex % current.images.length) + current.images.length) % current.images.length
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateBookingForm(formData);

    if (validationError) {
      setSubmitState({ loading: false, message: "", error: validationError });
      return;
    }

    setSubmitState({ loading: true, message: "", error: "" });

    try {
      await createBookingRequest({
        customerName: formData.customerName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        tripDate: formData.tripDate,
        passengerCount: formData.passengerCount.trim(),
        pickupLocation: formData.pickupLocation.trim(),
        dropoffLocation: formData.dropoffLocation.trim(),
        note: formData.note.trim(),
        bookingCaptchaToken: captchaState.token,
        bookingCaptchaAnswer: formData.captchaAnswer.trim(),
        bookingProofNonce: captchaState.proofNonce,
        turnstileToken: turnstileState.token,
        website: formData.website
      });
      setSubmitState({
        loading: false,
        message: "Yêu cầu đã được gửi. Chúng tôi sẽ liên hệ sớm.",
        error: ""
      });
      setFormData({
        customerName: "",
        phoneNumber: "",
        tripDate: "",
        passengerCount: "",
        pickupLocation: "",
        dropoffLocation: "",
        note: "",
        captchaAnswer: "",
        website: ""
      });
      await refreshCaptcha();
    } catch (error) {
      setFormData((current) => ({
        ...current,
        captchaAnswer: ""
      }));
      await refreshCaptcha();
      setSubmitState({ loading: false, message: "", error: error.message });
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader
        siteName={settingsMap.site_name}
        siteTagline={settingsMap.site_tagline}
        hotline={settingsMap.hotline}
        logoUrl={siteLogoUrl}
      />
      <main>
        <HeroSection
          heroTitle={settingsMap.hero_title}
          heroSubtitle={settingsMap.hero_subtitle}
          hotline={settingsMap.hotline}
          siteName={settingsMap.site_name}
          backgroundImageUrl={heroBackgroundUrl}
        />
        <FleetSection
          vehicleCategories={vehicleCategories}
          resolveAssetUrl={resolveAssetUrl}
          onOpenGallery={handleOpenFleetGallery}
        />
        <VehicleShowcaseSection
          flattenedVehicles={flattenedVehicles}
          selectedVehicleSlug={selectedVehicleSlug}
          setSelectedVehicleSlug={setSelectedVehicleSlug}
          selectedVehicle={selectedVehicle}
          selectedVehicleGallery={selectedVehicleGallery}
          selectedImageUrl={selectedImageUrl}
          setSelectedImageUrl={setSelectedImageUrl}
        />
        <ServicesSection
          services={services}
          error={pageState.error}
          hotline={settingsMap.hotline}
          address={settingsMap.address}
        />
        <ProcessSection />
        <BookingSection
          hotline={settingsMap.hotline}
          address={settingsMap.address}
          formData={formData}
          submitState={submitState}
          captchaState={captchaState}
          turnstileState={turnstileState}
          handleTurnstileTokenChange={handleTurnstileTokenChange}
          handleTurnstileError={handleTurnstileError}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
        />
      </main>
      <SiteFooter
        siteName={settingsMap.site_name}
        footerText={settingsMap.footer_text}
        hotline={settingsMap.hotline}
        address={settingsMap.address}
        logoUrl={siteLogoUrl}
      />
      <StickyContactBar hotline={settingsMap.hotline} />
      {fleetGalleryState.open ? (
        <VehicleGalleryLightbox
          gallery={fleetGalleryState.images}
          title={fleetGalleryState.title}
          currentIndex={fleetGalleryState.currentIndex}
          onClose={handleCloseFleetGallery}
          onPrev={() => handleFleetGalleryIndexChange(fleetGalleryState.currentIndex - 1)}
          onNext={() => handleFleetGalleryIndexChange(fleetGalleryState.currentIndex + 1)}
          onSelect={handleFleetGalleryIndexChange}
        />
      ) : null}
    </div>
  );
}
