import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import { SECTION_NAVIGATION_EVENT } from "./utils/sectionNavigation";

const VehicleDetailPage = lazy(() => import("./pages/VehicleDetailPage"));

export function getHashTargetScrollTop({
  scrollY,
  elementTop,
  elementHeight,
  viewportHeight,
  headerHeight,
  viewportPadding = 16
}) {
  const absoluteElementTop = scrollY + elementTop;
  const availableHeight = Math.max(
    0,
    viewportHeight - headerHeight - viewportPadding * 2
  );

  if (elementHeight > availableHeight) {
    return Math.max(0, absoluteElementTop - headerHeight - viewportPadding);
  }

  const centeredOffset =
    headerHeight + viewportPadding + (availableHeight - elementHeight) / 2;

  return Math.max(0, absoluteElementTop - centeredOffset);
}

export function getNavigationScrollDuration(distance) {
  return Math.min(700, Math.max(360, Math.abs(Number(distance) || 0) * 0.18));
}

export function getNavigationScrollProgress(progress) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  return 1 - (1 - clampedProgress) ** 3;
}

function animateWindowScroll(targetTop, prefersReducedMotion) {
  const startTop = window.scrollY;
  const distance = targetTop - startTop;

  if (
    prefersReducedMotion ||
    Math.abs(distance) < 2 ||
    typeof window.requestAnimationFrame !== "function"
  ) {
    window.scrollTo(0, targetTop);
    return () => {};
  }

  const duration = getNavigationScrollDuration(distance);
  let animationFrameId = 0;
  let startedAt = null;

  const renderFrame = (timestamp) => {
    if (startedAt === null) {
      startedAt = timestamp;
    }

    const progress = Math.min(1, (timestamp - startedAt) / duration);
    const easedProgress = getNavigationScrollProgress(progress);
    window.scrollTo(0, startTop + distance * easedProgress);

    if (progress < 1) {
      animationFrameId = window.requestAnimationFrame(renderFrame);
    }
  };

  animationFrameId = window.requestAnimationFrame(renderFrame);

  return () => window.cancelAnimationFrame(animationFrameId);
}

function scheduleHashTargetScroll(hash) {
  const elementId = decodeURIComponent(hash.slice(1));
  let cancelScrollAnimation = () => {};
  let scrollFrameId = 0;

  const scrollToHashTarget = () => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const headerHeight = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
    const elementRect = element.getBoundingClientRect();
    const targetTop = getHashTargetScrollTop({
      scrollY: window.scrollY,
      elementTop: elementRect.top,
      elementHeight: elementRect.height,
      viewportHeight: window.innerHeight,
      headerHeight
    });
    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    cancelScrollAnimation = animateWindowScroll(targetTop, prefersReducedMotion);
  };

  const layoutFrameId = window.requestAnimationFrame(() => {
    scrollFrameId = window.requestAnimationFrame(scrollToHashTarget);
  });

  return () => {
    window.cancelAnimationFrame(layoutFrameId);
    window.cancelAnimationFrame(scrollFrameId);
    cancelScrollAnimation();
  };
}

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      return scheduleHashTargetScroll(location.hash);
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.hash, location.key]);

  useEffect(() => {
    let cancelSectionNavigation = () => {};

    const handleSectionNavigation = (event) => {
      if (!event.detail?.hash) return;
      cancelSectionNavigation();
      cancelSectionNavigation = scheduleHashTargetScroll(event.detail.hash);
    };

    window.addEventListener(SECTION_NAVIGATION_EVENT, handleSectionNavigation);

    return () => {
      window.removeEventListener(SECTION_NAVIGATION_EVENT, handleSectionNavigation);
      cancelSectionNavigation();
    };
  }, []);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <a href="#main-content" className="skip-link">
        Bỏ qua đến nội dung chính
      </a>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/xe/:slug"
          element={
            <Suspense fallback={null}>
              <VehicleDetailPage />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
