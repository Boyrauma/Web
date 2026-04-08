import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { env } from "../config/env.js";

const vehicleUploadDir = path.join(env.uploadDir, "vehicles");
const brandUploadDir = path.join(env.uploadDir, "branding");

fs.mkdirSync(vehicleUploadDir, { recursive: true });
fs.mkdirSync(brandUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (request, file, callback) => {
    callback(null, vehicleUploadDir);
  },
  filename: (request, file, callback) => {
    const extension = path.extname(file.originalname);
    const safeBaseName = path
      .basename(file.originalname, extension)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    callback(null, `${Date.now()}-${safeBaseName || "image"}${extension}`);
  }
});

export const uploadVehicleImages = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const brandStorage = multer.diskStorage({
  destination: (request, file, callback) => {
    callback(null, brandUploadDir);
  },
  filename: (request, file, callback) => {
    const extension = path.extname(file.originalname);
    const safeBaseName = path
      .basename(file.originalname, extension)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    callback(null, `${Date.now()}-${safeBaseName || "logo"}${extension}`);
  }
});

function imageFileFilter(request, file, callback) {
  if (!file.mimetype?.startsWith("image/")) {
    callback(new Error("Chỉ chấp nhận file ảnh."));
    return;
  }

  callback(null, true);
}

export const uploadBrandLogo = multer({
  storage: brandStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});
