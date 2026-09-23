import { Router } from "express";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { ensureDefaultSiteSettings, PUBLIC_SITE_SETTING_KEYS } from "../utils/siteSettings.js";

const router = Router();
const TEMPLATE_CACHE_TTL_MS = 60 * 1000;
let cachedTemplate = "";
let templateExpiresAt = 0;

function escapeHtmlAttribute(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeJsonForHtml(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function replaceOrInsertHeadTag(html, pattern, replacement) {
  if (pattern.test(html)) {
    return html.replace(pattern, replacement);
  }

  return html.replace("</head>", `    ${replacement}\n  </head>`);
}

function setTitle(html, title) {
  return replaceOrInsertHeadTag(
    html,
    /<title(?:\s[^>]*)?>[\s\S]*?<\/title>/i,
    `<title>${escapeHtmlAttribute(title)}</title>`
  );
}

function setMeta(html, attribute, key, content) {
  const escapedKey = escapeRegExp(key);
  const pattern = new RegExp(
    `<meta\\b(?=[^>]*\\b${attribute}=["']${escapedKey}["'])[^>]*\\/?>(?:</meta>)?`,
    "i"
  );
  const replacement = `<meta ${attribute}="${escapeHtmlAttribute(key)}" content="${escapeHtmlAttribute(content)}" />`;

  return replaceOrInsertHeadTag(html, pattern, replacement);
}

function setCanonical(html, canonicalUrl) {
  const pattern = /<link\b(?=[^>]*\brel=["']canonical["'])[^>]*\/?>(?:<\/link>)?/i;
  const replacement = `<link rel="canonical" href="${escapeHtmlAttribute(canonicalUrl)}" />`;

  return replaceOrInsertHeadTag(html, pattern, replacement);
}

function setStructuredData(html, schema) {
  const pattern = /<script\b(?=[^>]*\bid=["']seo-jsonld["'])[^>]*>[\s\S]*?<\/script>/i;
  const replacement = `<script id="seo-jsonld" type="application/ld+json">${escapeJsonForHtml(schema)}</script>`;

  return replaceOrInsertHeadTag(html, pattern, replacement);
}

function normalizeSentence(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?]+$/, "");
}

function truncateDescription(value, maxLength = 160) {
  if (value.length <= maxLength) {
    return value;
  }

  const shortened = value.slice(0, maxLength - 1);
  const lastSpace = shortened.lastIndexOf(" ");

  return `${shortened.slice(0, Math.max(lastSpace, maxLength - 18)).trim()}…`;
}

function getRequestBaseUrl(request) {
  if (env.publicSiteUrl) {
    return new URL(env.publicSiteUrl);
  }

  const forwardedProto = request.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = request.get("x-forwarded-host")?.split(",")[0]?.trim();
  const protocol = forwardedProto || request.protocol;
  const host = forwardedHost || request.get("host");

  return new URL(`${protocol}://${host}`);
}

async function getFrontendTemplate() {
  if (cachedTemplate && Date.now() < templateExpiresAt) {
    return cachedTemplate;
  }

  const response = await fetch(`${env.frontendInternalUrl}/index.html`, {
    headers: { Accept: "text/html" },
    signal: globalThis.AbortSignal.timeout(5000)
  });

  if (!response.ok) {
    throw new Error(`Frontend template request failed with status ${response.status}.`);
  }

  cachedTemplate = await response.text();
  templateExpiresAt = Date.now() + TEMPLATE_CACHE_TTL_MS;

  return cachedTemplate;
}

function buildVehicleDescription(vehicle, siteName) {
  const summary = normalizeSentence(vehicle.shortDescription || vehicle.description);
  const opening = `Thuê ${vehicle.name} ${vehicle.seatCount} chỗ tại Thanh Hóa.`;
  const detail = summary ? ` ${summary}.` : "";
  const closing = ` Xem ảnh thực tế và liên hệ ${siteName} để kiểm tra lịch, nhận tư vấn nhanh.`;

  return truncateDescription(`${opening}${detail}${closing}`);
}

function renderVehicleHtml({ template, vehicle, requestedSlug, settings, baseUrl, isNotFound }) {
  const siteName = settings.site_name || "Nhà xe Định Dung";
  const canonicalUrl = new URL(`/xe/${vehicle?.slug ?? requestedSlug}`, baseUrl).toString();
  const title = isNotFound
    ? `Không tìm thấy xe | ${siteName}`
    : `${vehicle.name} ${vehicle.seatCount} chỗ | ${siteName}`;
  const description = isNotFound
    ? `Dòng xe này không còn hiển thị. Xem đội xe đang phục vụ của ${siteName}.`
    : buildVehicleDescription(vehicle, siteName);
  const imageUrl = vehicle?.images?.[0]?.imageUrl
    ? new URL(vehicle.images[0].imageUrl, baseUrl).toString()
    : new URL("/assets/xecountybonghoi.jpg", baseUrl).toString();
  const robots = isNotFound ? "noindex,follow" : "index,follow";
  const schema = isNotFound
    ? {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: title,
        url: canonicalUrl
      }
    : [
        {
          "@context": "https://schema.org",
          "@type": ["Service", "TransportationService"],
          name: vehicle.name,
          serviceType: vehicle.category?.name || "Dịch vụ vận chuyển hành khách",
          description,
          url: canonicalUrl,
          image: vehicle.images.map((image) => new URL(image.imageUrl, baseUrl).toString()),
          provider: {
            "@type": "LocalBusiness",
            name: siteName,
            url: new URL("/", baseUrl).toString(),
            telephone: settings.hotline || undefined,
            address: settings.address || undefined
          },
          areaServed: {
            "@type": "AdministrativeArea",
            name: "Thanh Hóa, Việt Nam"
          }
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Trang chủ",
              item: new URL("/", baseUrl).toString()
            },
            {
              "@type": "ListItem",
              position: 2,
              name: vehicle.name,
              item: canonicalUrl
            }
          ]
        }
      ];

  let html = setTitle(template, title);
  html = setMeta(html, "name", "description", description);
  html = setMeta(html, "name", "robots", robots);
  html = setMeta(html, "property", "og:type", "website");
  html = setMeta(html, "property", "og:title", title);
  html = setMeta(html, "property", "og:description", description);
  html = setMeta(html, "property", "og:url", canonicalUrl);
  html = setMeta(html, "property", "og:site_name", siteName);
  html = setMeta(html, "property", "og:image", imageUrl);
  html = setMeta(html, "property", "og:image:alt", isNotFound ? siteName : vehicle.name);
  html = setMeta(html, "name", "twitter:card", "summary_large_image");
  html = setMeta(html, "name", "twitter:title", title);
  html = setMeta(html, "name", "twitter:description", description);
  html = setMeta(html, "name", "twitter:image", imageUrl);
  html = setMeta(html, "name", "twitter:image:alt", isNotFound ? siteName : vehicle.name);
  html = setCanonical(html, canonicalUrl);

  return setStructuredData(html, schema);
}

router.get("/vehicles/:slug", async (request, response, next) => {
  try {
    await ensureDefaultSiteSettings(prisma);

    const [template, vehicle, siteSettings] = await Promise.all([
      getFrontendTemplate(),
      prisma.vehicle.findUnique({
        where: { slug: request.params.slug },
        include: {
          category: true,
          images: {
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }]
          }
        }
      }),
      prisma.siteSetting.findMany({
        where: { key: { in: PUBLIC_SITE_SETTING_KEYS } }
      })
    ]);
    const publishedVehicle = vehicle?.isPublished ? vehicle : null;
    const settings = Object.fromEntries(siteSettings.map((setting) => [setting.key, setting.value]));
    const html = renderVehicleHtml({
      template,
      vehicle: publishedVehicle,
      requestedSlug: request.params.slug,
      settings,
      baseUrl: getRequestBaseUrl(request),
      isNotFound: !publishedVehicle
    });

    response.status(publishedVehicle ? 200 : 404);
    response.type("html");
    response.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
    return response.send(html);
  } catch (error) {
    return next(error);
  }
});

export default router;
