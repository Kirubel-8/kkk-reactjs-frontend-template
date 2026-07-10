const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create uploads directory if missing
const uploadPath = path.join(__dirname, "../uploads/council/decisions");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["application/pdf", "image/png", "image/jpeg"];

  if (!allowed.includes(file.mimetype)) {
    cb(new Error("Only PDF, PNG, JPG files allowed"), false);
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = upload.single("decision_document");
