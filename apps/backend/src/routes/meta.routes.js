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
  const vehicles = await prisma.vehicle.findMany({
    where: { isPublished: true },
    select: {
      slug: true,
      updatedAt: true
    },
    orderBy: { updatedAt: "desc" }
  });

  const entries = [
    {
      loc: new URL("/", baseUrl).toString(),
      lastmod: new Date().toISOString()
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
