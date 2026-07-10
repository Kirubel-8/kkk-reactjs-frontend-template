const multer = require("multer");
const path = require("path");
const fs = require("fs");


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "./public/uploads/";

    if (file.fieldname === "signature") {
      uploadPath += "signatures/";
    } else if (file.fieldname === "evidence") {
      // Subfolders for evidence based on type
      if (file.mimetype.startsWith("image/")) {
        uploadPath += "evidence/images/";
      } else if (file.mimetype.startsWith("audio/")) {
        uploadPath += "evidence/audio/";
      } else if (file.mimetype.startsWith("video/")) {
        uploadPath += "evidence/videos/";
      } else if (file.mimetype === "application/pdf") {
        uploadPath += "evidence/pdfs/";
      } else {
        uploadPath += "evidence/others/";
      }
    } else {
      uploadPath += "others/";
    }

    // Create folder if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${fileExtension}`);
  },
});

// Allowed mime types
const allowedTypes = {
  signature: ["image/jpeg", "image/png", "image/jpg", "image/gif"],
  evidence: [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "video/mp4",
    "video/avi",
    "video/mov",
    "video/webm",
    "video/mpeg",
    "video/mkv",
    "video/x-matroska",
  ],
};

// File filter
const fileFilter = (req, file, cb) => {
  const allowedMimes = allowedTypes[file.fieldname] || Object.values(allowedTypes).flat();
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        ` Invalid file type for ${file.fieldname}. Allowed types: ${allowedMimes.join(", ")}`
      ),
      false
    );
  }
};

// Upload handlers
const uploadSignature = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).single("signature");

const uploadEvidence = multer({
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB for videos
}).single("evidence");

const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 },
}).fields([
  { name: "signature", maxCount: 1 },
  { name: "evidence", maxCount: 10 },
  // Accept generic files field for bulk uploads from File Organizer
  { name: "files", maxCount: 20 },
]);

module.exports = {
  uploadSignature,
  uploadEvidence,
  uploadMultiple,
};
