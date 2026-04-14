import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();
const uploadRoot = path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "uploads");
const keepOriginalExtensions = new Set([".gif", ".webp"]);
const optimizableExtensions = new Set([".jpg", ".jpeg", ".png"]);
const imageSettingKeys = new Set(["logo_url", "favicon_url"]);

function isManagedImageUrl(value) {
  return typeof value === "string" && /^\/(image|uploads)\//.test(value);
}

function toPhysicalPath(imageUrl) {
  const relativePath = imageUrl.replace(/^\/(image|uploads)\//, "");
  return path.join(uploadRoot, relativePath);
}

function toImageUrl(filePath) {
  const relativePath = path.relative(uploadRoot, filePath).replace(/\\/g, "/");
  return `/image/${relativePath}`;
}

async function fileExists(filePath) {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function optimizeFile(filePath, { maxWidth = 1920, maxHeight = 1920, quality = 82 } = {}) {
  const extension = path.extname(filePath).toLowerCase();

  if (keepOriginalExtensions.has(extension)) {
    return {
      changed: false,
      filePath
    };
  }

  if (!optimizableExtensions.has(extension)) {
    return {
      changed: false,
      filePath
    };
  }

  const optimizedPath = path.join(
    path.dirname(filePath),
    `${path.basename(filePath, extension)}.webp`
  );

  if (optimizedPath === filePath) {
    return {
      changed: false,
      filePath
    };
  }

  await sharp(filePath)
    .rotate()
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true
    })
    .webp({ quality })
    .toFile(optimizedPath);

  const [beforeStats, afterStats] = await Promise.all([
    fs.promises.stat(filePath),
    fs.promises.stat(optimizedPath)
  ]);

  await fs.promises.unlink(filePath);

  return {
    changed: true,
    filePath: optimizedPath,
    beforeBytes: beforeStats.size,
    afterBytes: afterStats.size
  };
}

async function migrateVehicleImages() {
  const images = await prisma.vehicleImage.findMany({
    select: {
      id: true,
      imageUrl: true
    }
  });

  const results = [];

  for (const image of images) {
    if (!isManagedImageUrl(image.imageUrl)) {
      continue;
    }

    const sourcePath = toPhysicalPath(image.imageUrl);

    if (!(await fileExists(sourcePath))) {
      results.push({
        type: "vehicleImage",
        id: image.id,
        status: "missing",
        imageUrl: image.imageUrl
      });
      continue;
    }

    const optimized = await optimizeFile(sourcePath);
    const nextUrl = toImageUrl(optimized.filePath);

    if (optimized.changed || nextUrl !== image.imageUrl) {
      await prisma.vehicleImage.update({
        where: { id: image.id },
        data: { imageUrl: nextUrl }
      });
    }

    results.push({
      type: "vehicleImage",
      id: image.id,
      status: optimized.changed ? "optimized" : "unchanged",
      imageUrl: image.imageUrl,
      nextUrl,
      beforeBytes: optimized.beforeBytes ?? null,
      afterBytes: optimized.afterBytes ?? null
    });
  }

  return results;
}

async function migrateImageSettings() {
  const settings = await prisma.siteSetting.findMany({
    where: {
      key: {
        in: Array.from(imageSettingKeys)
      }
    },
    select: {
      id: true,
      key: true,
      value: true
    }
  });

  const results = [];

  for (const setting of settings) {
    if (!isManagedImageUrl(setting.value)) {
      results.push({
        type: "siteSetting",
        key: setting.key,
        status: "skipped",
        value: setting.value
      });
      continue;
    }

    const sourcePath = toPhysicalPath(setting.value);

    if (!(await fileExists(sourcePath))) {
      results.push({
        type: "siteSetting",
        key: setting.key,
        status: "missing",
        value: setting.value
      });
      continue;
    }

    const optimized = await optimizeFile(sourcePath, {
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 86
    });
    const nextUrl = toImageUrl(optimized.filePath);

    if (optimized.changed || nextUrl !== setting.value) {
      await prisma.siteSetting.update({
        where: { id: setting.id },
        data: { value: nextUrl }
      });
    }

    results.push({
      type: "siteSetting",
      key: setting.key,
      status: optimized.changed ? "optimized" : "unchanged",
      value: setting.value,
      nextUrl,
      beforeBytes: optimized.beforeBytes ?? null,
      afterBytes: optimized.afterBytes ?? null
    });
  }

  return results;
}

function summarizeResults(results) {
  return results.reduce(
    (summary, item) => {
      summary.total += 1;
      summary[item.status] = (summary[item.status] ?? 0) + 1;

      if (item.beforeBytes && item.afterBytes) {
        summary.beforeBytes += item.beforeBytes;
        summary.afterBytes += item.afterBytes;
      }

      return summary;
    },
    {
      total: 0,
      optimized: 0,
      unchanged: 0,
      missing: 0,
      skipped: 0,
      beforeBytes: 0,
      afterBytes: 0
    }
  );
}

async function main() {
  const [vehicleResults, settingResults] = await Promise.all([
    migrateVehicleImages(),
    migrateImageSettings()
  ]);
  const results = [...vehicleResults, ...settingResults];
  const summary = summarizeResults(results);

  console.log(
    JSON.stringify(
      {
        uploadRoot,
        summary,
        results
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
