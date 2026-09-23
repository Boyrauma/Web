import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..", "packaged-uploads");
const manifestPath = path.join(packageRoot, "manifest.json");

function resolvePackagedPath(relativePath) {
  const resolvedPath = path.resolve(packageRoot, relativePath);
  const allowedPrefix = `${packageRoot}${path.sep}`;

  if (!resolvedPath.startsWith(allowedPrefix)) {
    throw new Error(`Đường dẫn ảnh nằm ngoài gói: ${relativePath}`);
  }

  return resolvedPath;
}

async function main() {
  const manifest = JSON.parse(await fs.promises.readFile(manifestPath, "utf8"));
  const packagedFiles = [];

  for (const entry of manifest.files) {
    const filePath = resolvePackagedPath(entry.path);
    const [buffer, metadata] = await Promise.all([
      fs.promises.readFile(filePath),
      sharp(filePath).metadata()
    ]);
    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");

    if (buffer.length !== entry.bytes) {
      throw new Error(`Sai dung lượng: ${entry.path}`);
    }

    if (sha256 !== entry.sha256) {
      throw new Error(`Sai checksum: ${entry.path}`);
    }

    if (
      metadata.format !== "webp" ||
      metadata.width !== entry.width ||
      metadata.height !== entry.height
    ) {
      throw new Error(`Sai định dạng hoặc kích thước: ${entry.path}`);
    }

    packagedFiles.push(entry.path);
  }

  const actualFiles = ["branding", "vehicles"]
    .flatMap((directory) =>
      fs
        .readdirSync(path.join(packageRoot, directory), { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => `${directory}/${entry.name}`)
    )
    .sort();
  const expectedFiles = [...packagedFiles].sort();

  if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) {
    throw new Error("Danh sách file thực tế không khớp manifest.");
  }

  const totalBytes = manifest.files.reduce((sum, entry) => sum + entry.bytes, 0);

  if (manifest.fileCount !== manifest.files.length || manifest.totalBytes !== totalBytes) {
    throw new Error("Thống kê trong manifest không hợp lệ.");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        version: manifest.version,
        fileCount: manifest.fileCount,
        totalBytes
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
