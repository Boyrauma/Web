export function registerAdminServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (import.meta.env.DEV) return;

  const basePath = import.meta.env.BASE_URL || "/";
  const swUrl = `${basePath.replace(/\/?$/, "/")}sw.js`;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(swUrl, {
      scope: basePath
    }).catch((error) => {
      console.warn("Không thể đăng ký service worker admin:", error);
    });
  });
}
