const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Auto-create upload folder
const uploadPath = path.join(__dirname, "..", "public", "uploads", "complaints", "court-office");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `files-${unique}${ext}`);
  },
});

const uploadCourtOffice = multer({ storage });

module.exports = uploadCourtOffice;
