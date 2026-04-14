import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();
const uploadRoot = path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "uploads");

function isManagedImageUrl(value) {
  return typeof value === "string" && /^\/(image|uploads)\//.test(value);
}

function toRelativeUploadPath(imageUrl) {
  return imageUrl.replace(/^\/(image|uploads)\//, "");
}

function walkFiles(rootDirectory) {
  const files = [];

  function walk(currentDirectory) {
    for (const entry of fs.readdirSync(currentDirectory, { withFileTypes: true })) {
      const fullPath = path.join(currentDirectory, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      files.push(path.relative(rootDirectory, fullPath).replace(/\\/g, "/"));
    }
  }

  if (fs.existsSync(rootDirectory)) {
    walk(rootDirectory);
  }

  return files;
}

async function main() {
  const [vehicleImages, siteSettings] = await Promise.all([
    prisma.vehicleImage.findMany({
      select: {
        imageUrl: true
      }
    }),
    prisma.siteSetting.findMany({
      select: {
        value: true
      }
    })
  ]);

  const referencedFiles = new Set(
    [...vehicleImages.map((item) => item.imageUrl), ...siteSettings.map((item) => item.value)]
      .filter(isManagedImageUrl)
      .map(toRelativeUploadPath)
  );

  const allFiles = walkFiles(uploadRoot);
  const orphanedFiles = allFiles.filter((file) => !referencedFiles.has(file));

  let deletedCount = 0;
  let deletedBytes = 0;

  for (const relativeFilePath of orphanedFiles) {
    const fullPath = path.join(uploadRoot, relativeFilePath);
    const stats = fs.statSync(fullPath);
    fs.unlinkSync(fullPath);
    deletedCount += 1;
    deletedBytes += stats.size;
  }

  console.log(
    JSON.stringify(
      {
        uploadRoot,
        referencedCount: referencedFiles.size,
        scannedCount: allFiles.length,
        deletedCount,
        deletedBytes,
        deletedFiles: orphanedFiles
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
