import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import VehicleDetailPage from "./pages/VehicleDetailPage";

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const elementId = decodeURIComponent(location.hash.slice(1));
      const scrollToHashTarget = () => {
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
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
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/xe/:slug" element={<VehicleDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
