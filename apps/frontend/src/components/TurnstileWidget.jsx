import { useEffect, useRef } from "react";

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

export default function TurnstileWidget({ siteKey, resetKey, onTokenChange, onError }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const onTokenChangeRef = useRef(onTokenChange);
  const onErrorRef = useRef(onError);

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
          size: "flexible",
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
  }, [siteKey]);

  useEffect(() => {
    if (widgetIdRef.current === null || !window.turnstile?.reset) {
      return;
    }

    onTokenChangeRef.current("");
    onErrorRef.current("");
    window.turnstile.reset(widgetIdRef.current);
  }, [resetKey]);

  return <div ref={containerRef} className="min-h-[68px]" />;
}
