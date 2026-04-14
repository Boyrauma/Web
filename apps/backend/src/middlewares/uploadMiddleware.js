import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import sharp from "sharp";
import { env } from "../config/env.js";

const vehicleUploadDir = path.join(env.uploadDir, "vehicles");
const brandUploadDir = path.join(env.uploadDir, "branding");
const allowedImageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const allowedImageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

fs.mkdirSync(vehicleUploadDir, { recursive: true });
fs.mkdirSync(brandUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (request, file, callback) => {
    callback(null, vehicleUploadDir);
  },
  filename: (request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeBaseName = path
      .basename(file.originalname, extension)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    callback(null, `${Date.now()}-${safeBaseName || "image"}${extension}`);
  }
});

const brandStorage = multer.diskStorage({
  destination: (request, file, callback) => {
    callback(null, brandUploadDir);
  },
  filename: (request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeBaseName = path
      .basename(file.originalname, extension)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    callback(null, `${Date.now()}-${safeBaseName || "logo"}${extension}`);
  }
});

function imageFileFilter(request, file, callback) {
  const extension = path.extname(file.originalname ?? "").toLowerCase();
  const mimeType = (file.mimetype ?? "").toLowerCase();

  if (!allowedImageMimeTypes.has(mimeType) || !allowedImageExtensions.has(extension)) {
    const error = new Error("Chỉ chấp nhận file JPG, PNG, WEBP hoặc GIF.");
    error.statusCode = 400;
    callback(error);
    return;
  }

  callback(null, true);
}

function isJpegSignature(buffer) {
  return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

function isPngSignature(buffer) {
  return (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  );
}

function isGifSignature(buffer) {
  const header = buffer.subarray(0, 6).toString("ascii");
  return header === "GIF87a" || header === "GIF89a";
}

function isWebpSignature(buffer) {
  return (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  );
}

function shouldKeepOriginalFormat(filePath) {
  return path.extname(filePath).toLowerCase() === ".gif";
}

function buildOptimizedFilePath(filePath) {
  const directory = path.dirname(filePath);
  const baseName = path.basename(filePath, path.extname(filePath));
  return path.join(directory, `${baseName}.webp`);
}

export async function validateStoredImageFile(filePath) {
  const handle = await fs.promises.open(filePath, "r");

  try {
    const buffer = Buffer.alloc(16);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    const slice = buffer.subarray(0, bytesRead);

    return (
      isJpegSignature(slice) ||
      isPngSignature(slice) ||
      isGifSignature(slice) ||
      isWebpSignature(slice)
    );
  } finally {
    await handle.close();
  }
}

export async function optimizeStoredImageFile(
  file,
  { maxWidth = 1920, maxHeight = 1920, quality = 82 } = {}
) {
  if (!file?.path) {
    throw new Error("Thiếu file để tối ưu ảnh.");
  }

  if (shouldKeepOriginalFormat(file.path)) {
    return file;
  }

  const optimizedPath = buildOptimizedFilePath(file.path);

  await sharp(file.path)
    .rotate()
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true
    })
    .webp({ quality })
    .toFile(optimizedPath);

  if (optimizedPath !== file.path) {
    await fs.promises.unlink(file.path).catch(() => undefined);
  }

  return {
    ...file,
    filename: path.basename(optimizedPath),
    path: optimizedPath,
    mimetype: "image/webp"
  };
}

export async function removeUploadedFiles(files = []) {
  await Promise.all(
    files
      .filter(Boolean)
      .map((file) => fs.promises.unlink(typeof file === "string" ? file : file.path).catch(() => undefined))
  );
}

export const uploadVehicleImages = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

export const uploadBrandLogo = multer({
  storage: brandStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 12 * 1024 * 1024
  }
});
