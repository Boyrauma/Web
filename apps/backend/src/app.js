import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import healthRoutes from "./routes/health.routes.js";
import metaRoutes from "./routes/meta.routes.js";
import publicRoutes from "./routes/public.routes.js";
import seoPageRoutes from "./routes/seoPage.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
app.disable("x-powered-by");
app.set("trust proxy", env.trustProxyHops);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      const error = new Error("Origin is not allowed by CORS");
      error.statusCode = 403;
      callback(error);
    },
    credentials: true
  })
);
app.use((request, response, next) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  response.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  response.setHeader("Permissions-Policy", "camera=(), geolocation=(), microphone=()");
  response.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self' https://challenges.cloudflare.com ws: wss:;"
  );
  next();
});
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(cookieParser());
app.use(
  "/image",
  express.static(path.resolve(__dirname, "..", env.uploadDir), {
    maxAge: "1y",
    immutable: true,
    setHeaders(response) {
      response.setHeader("X-Content-Type-Options", "nosniff");
      response.setHeader("Content-Disposition", "inline");
      response.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    }
  })
);
app.use(
  "/uploads",
  express.static(path.resolve(__dirname, "..", env.uploadDir), {
    maxAge: "1y",
    immutable: true,
    setHeaders(response) {
      response.setHeader("X-Content-Type-Options", "nosniff");
      response.setHeader("Content-Disposition", "inline");
      response.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    }
  })
);

app.get("/", (request, response) => {
  return response.json({
    name: "Transport Website API",
    status: "running"
  });
});

app.use("/health", healthRoutes);
app.use("/", metaRoutes);
app.use("/seo-pages", seoPageRoutes);
app.use("/api", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

app.use(errorHandler);
