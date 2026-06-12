const fs = require("fs");
const path = require("path");
const { createId, nowIso } = require("./store");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

function ensureUploadDir() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function sanitizeFileName(fileName) {
  return String(fileName || "upload.bin")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_");
}

function writeBase64Upload(payload) {
  ensureUploadDir();
  const fileName = sanitizeFileName(payload.fileName || "upload.bin");
  const id = createId("upl");
  const storedName = `${id}-${fileName}`;
  const filePath = path.join(UPLOAD_DIR, storedName);
  const buffer = Buffer.from(String(payload.contentBase64 || ""), "base64");
  fs.writeFileSync(filePath, buffer);

  return {
    id,
    originalName: fileName,
    storedName,
    mimeType: String(payload.mimeType || "application/octet-stream"),
    size: buffer.length,
    localPath: filePath,
    publicPath: `/uploads/${storedName}`,
    createdAt: nowIso()
  };
}

function readUpload(storedName) {
  const safeName = sanitizeFileName(storedName);
  const filePath = path.join(UPLOAD_DIR, safeName);
  if (!fs.existsSync(filePath)) return null;
  return {
    filePath,
    buffer: fs.readFileSync(filePath)
  };
}

module.exports = {
  ensureUploadDir,
  writeBase64Upload,
  readUpload
};
