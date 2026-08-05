import { Router } from "express";
import { prisma } from "../config/prisma.js";

const router = Router();

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getPublicBaseUrl(request) {
  const forwardedProto = request.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = request.get("x-forwarded-host")?.split(",")[0]?.trim();
  const protocol = forwardedProto || request.protocol;
  const host = forwardedHost || request.get("host");

  return `${protocol}://${host}`;
}

router.get("/sitemap.xml", async (request, response) => {
  const baseUrl = getPublicBaseUrl(request);
  const [vehicles, latestService, latestSiteSetting] = await Promise.all([
    prisma.vehicle.findMany({
      where: { isPublished: true },
      select: {
        slug: true,
        updatedAt: true
      },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.service.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true }
    }),
    prisma.siteSetting.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true }
    })
  ]);
  const homepageLastModified = [latestService?.updatedAt, latestSiteSetting?.updatedAt]
    .filter(Boolean)
    .reduce(
      (latest, updatedAt) => (updatedAt > latest ? updatedAt : latest),
      vehicles[0]?.updatedAt ?? new Date(0)
    );

  const entries = [
    {
      loc: new URL("/", baseUrl).toString(),
      lastmod: homepageLastModified.toISOString()
    },
    ...vehicles.map((vehicle) => ({
      loc: new URL(`/xe/${vehicle.slug}`, baseUrl).toString(),
      lastmod: vehicle.updatedAt.toISOString()
    }))
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(
      (entry) =>
        `  <url><loc>${escapeXml(entry.loc)}</loc><lastmod>${entry.lastmod}</lastmod></url>`
    ),
    "</urlset>"
  ].join("\n");

  response.type("application/xml");
  response.setHeader("Cache-Control", "public, max-age=300");
  response.send(xml);
});

export default router;
