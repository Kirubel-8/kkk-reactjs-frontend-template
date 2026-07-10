const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Map fieldname to subdirectory under /public/uploads/complaints
const resolveUploadSubdir = (fieldname) => {
  // Witness signatures: supports both "witness_signatures" and indexed forms like witnesses[0].signature
  const isWitnessSignature =
    fieldname === "witness_signatures" ||
    /(^|\.)?witness(?:es)?\[\d+\](?:\.|\[|_)?signature(?:\])?$/.test(fieldname);

  const isEvidence =
    fieldname === "evidence" || // used by modifyRejectedEvidence
    fieldname === "evidence_files" ||
    /(^|\.)?evidence_files\[\d+\]$/.test(fieldname);
  const isInvestigation = fieldname === "file" || fieldname === "investigation_file" || /^replace_/.test(fieldname);
  const isLetter = fieldname === "letter_file" || fieldname === "file" && fieldname.includes("letter");

  if (isWitnessSignature) return "complaints/witness-signatures";
  if (isEvidence) return "complaints/evidence";
  if (isInvestigation) return "investigations/files";
  if (isLetter) return "letters";
  return "complaints/others";
};

// Disk storage (in public)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subdir = resolveUploadSubdir(file.fieldname);
    let uploadPath = path.join(__dirname, "..", "public", "uploads", subdir);

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const safeField = (file.fieldname || "file")
      .toString()
      .replace(/[^a-z0-9_-]/gi, "-");
    cb(null, `${safeField}-${timestamp}-${random}${ext}`);
  },
});

// Allow common images, audio and documents like disciplinary middleware
const allowedTypes = new Set([
  // images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/bmp",
  "image/webp",
  "image/svg+xml",

  // documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/rtf",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.presentation",

  // text
  "text/plain",
  "text/csv",
  "text/html",
  "text/xml",
  "application/json",

  // audio
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/aac",
  "audio/flac",
  "audio/m4a",

  // video
  "video/mp4",
  "video/mkv",
  "video/mpeg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  "video/webm",
  "video/ogg",
  "video/3gpp",
  "video/x-flv",
]);

// Signatures must be images; evidence can be broader (as above)
const fileFilter = (_, file, cb) => {
  const isWitnessSignature =
    file.fieldname === "witness_signatures" ||
    /(^|\.)witness(?:es)?\[\d+\](?:\.|\[|_)?signature(?:\])?$/.test(
      file.fieldname
    );

  if (isWitnessSignature) {
    const isImage = /^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype);
    if (!isImage)
      return cb(new Error("Witness signatures must be image files"));
    return cb(null, true);
  }

  // for evidence check against the entire type list
  if (allowedTypes.has(file.mimetype)) return cb(null, true);
  return cb(new Error(`Error: File format not supported: ${file.mimetype}`));
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
}).any();
