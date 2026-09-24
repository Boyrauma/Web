import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";

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

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const elementId = decodeURIComponent(location.hash.slice(1));
      const scrollToHashTarget = () => {
        const element = document.getElementById(elementId);
        if (element) {
          const headerHeight = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
          const elementRect = element.getBoundingClientRect();
          const targetTop = getHashTargetScrollTop({
            scrollY: window.scrollY,
            elementTop: elementRect.top,
            elementHeight: elementRect.height,
            viewportHeight: window.innerHeight,
            headerHeight
          });

          window.scrollTo({
            top: targetTop,
            left: 0,
            behavior: "auto"
          });
        }
      };

      const frameId = window.requestAnimationFrame(scrollToHashTarget);
      const timeoutId = window.setTimeout(scrollToHashTarget, 120);

      return () => {
        window.cancelAnimationFrame(frameId);
        window.clearTimeout(timeoutId);
      };
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.hash]);

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
