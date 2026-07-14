import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function buildBackendProxy(target) {
  return {
    target,
    changeOrigin: true,
    secure: false
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendTarget = env.VITE_DEV_API_TARGET || "http://127.0.0.1:8080";
  const backendProxy = buildBackendProxy(backendTarget);

  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      proxy: {
        "/api": backendProxy,
        "/image": backendProxy,
        "/uploads": backendProxy,
        "/sitemap.xml": backendProxy
      }
    }
  };
});
