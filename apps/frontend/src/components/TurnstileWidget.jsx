import { useEffect, useRef, useState } from "react";

let turnstileScriptPromise;

function loadTurnstileScript() {
  if (window.turnstile?.render) {
    return Promise.resolve(window.turnstile);
  }

  if (turnstileScriptPromise) {
    return turnstileScriptPromise;
  }

  turnstileScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-turnstile-script="true"]');

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.turnstile), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("load-failed")), {
        once: true
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.turnstileScript = "true";
    script.onload = () => resolve(window.turnstile);
    script.onerror = () => reject(new Error("load-failed"));
    document.head.appendChild(script);
  });

  return turnstileScriptPromise;
}

function getTurnstileErrorMessage(errorCode) {
  if (errorCode === "network-error") {
    return "Không thể tải xác thực Cloudflare. Vui lòng kiểm tra mạng rồi thử lại.";
  }

  return "Xác thực Cloudflare đang gặp lỗi. Vui lòng thử lại.";
}

function getTurnstileSize() {
  return window.matchMedia("(max-width: 480px)").matches ? "compact" : "flexible";
}

export default function TurnstileWidget({ siteKey, resetKey, onTokenChange, onError }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const onTokenChangeRef = useRef(onTokenChange);
  const onErrorRef = useRef(onError);
  const [widgetSize, setWidgetSize] = useState(getTurnstileSize);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 480px)");
    const handleChange = () => setWidgetSize(mediaQuery.matches ? "compact" : "flexible");

    handleChange();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
    onErrorRef.current = onError;
  }, [onError, onTokenChange]);

  useEffect(() => {
    let cancelled = false;

    async function renderWidget() {
      if (!siteKey || !containerRef.current) {
        return;
      }

      try {
        const turnstile = await loadTurnstileScript();

        if (cancelled || !turnstile || !containerRef.current) {
          return;
        }

        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action: "booking",
          theme: "light",
          size: widgetSize,
          callback: (token) => {
            onErrorRef.current("");
            onTokenChangeRef.current(token ?? "");
          },
          "expired-callback": () => {
            onTokenChangeRef.current("");
            onErrorRef.current("Phiên xác thực Cloudflare đã hết hạn. Vui lòng xác thực lại.");
          },
          "error-callback": (errorCode) => {
            onTokenChangeRef.current("");
            onErrorRef.current(getTurnstileErrorMessage(errorCode));
          }
        });
      } catch {
        if (!cancelled) {
          onTokenChangeRef.current("");
          onErrorRef.current("Không thể tải xác thực Cloudflare. Vui lòng thử lại.");
        }
      }
    }

    renderWidget();

    return () => {
      cancelled = true;

      if (widgetIdRef.current !== null && window.turnstile?.remove) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, widgetSize]);

  useEffect(() => {
    if (widgetIdRef.current === null || !window.turnstile?.reset) {
      return;
    }

    onTokenChangeRef.current("");
    onErrorRef.current("");
    window.turnstile.reset(widgetIdRef.current);
  }, [resetKey]);

  return <div ref={containerRef} className="turnstile-widget min-h-[68px]" />;
}
