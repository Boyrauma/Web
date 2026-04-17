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
  fetchServices,
  fetchSiteSettings,
  fetchVehicleCategories,
  resolveAssetUrl
} from "../services/api";

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
    note: ""
  });
  const [submitState, setSubmitState] = useState({ loading: false, message: "", error: "" });

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

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
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
    setSubmitState({ loading: true, message: "", error: "" });

    try {
      await createBookingRequest(formData);
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
        note: ""
      });
    } catch (error) {
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

