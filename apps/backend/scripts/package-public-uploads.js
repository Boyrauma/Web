import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..", "packaged-uploads");
const sourceBaseUrl = new URL(process.env.PACKAGE_SOURCE_URL || "http://127.0.0.1:8080");
const packageVersion = process.env.PACKAGE_VERSION || new Date().toISOString().slice(0, 10);
const allowedAssetPattern = /^\/image\/(branding|vehicles)\/([a-zA-Z0-9._-]+)$/;

function resolvePackagedPath(relativePath) {
  const resolvedPath = path.resolve(packageRoot, relativePath);
  const allowedPrefix = `${packageRoot}${path.sep}`;

  if (!resolvedPath.startsWith(allowedPrefix)) {
    throw new Error(`Đường dẫn ảnh nằm ngoài gói: ${relativePath}`);
  }

  return resolvedPath;
}

async function fetchJson(pathname) {
  const response = await fetch(new URL(pathname, sourceBaseUrl));

  if (!response.ok) {
    throw new Error(`Không thể tải ${pathname}: HTTP ${response.status}`);
  }

  return response.json();
}

async function downloadAsset(assetPath) {
  const matchedPath = allowedAssetPattern.exec(assetPath);

  if (!matchedPath) {
    throw new Error(`Đường dẫn ảnh không hợp lệ: ${assetPath}`);
  }

  const relativePath = `${matchedPath[1]}/${matchedPath[2]}`;
  const targetPath = resolvePackagedPath(relativePath);
  const response = await fetch(new URL(assetPath, sourceBaseUrl));

  if (!response.ok) {
    throw new Error(`Không thể tải ảnh ${assetPath}: HTTP ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const metadata = await sharp(buffer).metadata();

  if (metadata.format !== "webp" || !metadata.width || !metadata.height) {
    throw new Error(`Ảnh không phải WebP hợp lệ: ${assetPath}`);
  }

  await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.promises.writeFile(targetPath, buffer);

  return {
    path: relativePath,
    bytes: buffer.length,
    width: metadata.width,
    height: metadata.height,
    sha256: crypto.createHash("sha256").update(buffer).digest("hex")
  };
}

async function removeUnreferencedFiles(expectedPaths) {
  for (const directory of ["branding", "vehicles"]) {
    const directoryPath = path.join(packageRoot, directory);
    const entries = await fs.promises.readdir(directoryPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile()) continue;

      const relativePath = `${directory}/${entry.name}`;

      if (!expectedPaths.has(relativePath)) {
        await fs.promises.unlink(resolvePackagedPath(relativePath));
      }
    }
  }
}

async function main() {
  const [siteSettings, categories] = await Promise.all([
    fetchJson("/api/site-settings"),
    fetchJson("/api/vehicle-categories")
  ]);
  const settingsMap = Object.fromEntries(siteSettings.map((setting) => [setting.key, setting.value]));
  const vehicles = categories.flatMap((category) =>
    category.vehicles.map((vehicle) => ({
      slug: vehicle.slug,
      images: vehicle.images.map((image) => image.imageUrl)
    }))
  );
  const assetPaths = new Set(
    [settingsMap.logo_url, settingsMap.hero_background_url, ...vehicles.flatMap((vehicle) => vehicle.images)]
      .filter(Boolean)
  );
  const files = (
    await Promise.all([...assetPaths].sort().map((assetPath) => downloadAsset(assetPath)))
  ).sort((left, right) => left.path.localeCompare(right.path));
  const expectedPaths = new Set(files.map((file) => file.path));

  await removeUnreferencedFiles(expectedPaths);

  const manifest = {
    version: packageVersion,
    fileCount: files.length,
    totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
    siteSettings: {
      logo_url: settingsMap.logo_url,
      hero_background_url: settingsMap.hero_background_url
    },
    vehicles,
    files
  };

  await fs.promises.writeFile(
    path.join(packageRoot, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        source: sourceBaseUrl.origin,
        version: packageVersion,
        fileCount: manifest.fileCount,
        totalBytes: manifest.totalBytes
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
