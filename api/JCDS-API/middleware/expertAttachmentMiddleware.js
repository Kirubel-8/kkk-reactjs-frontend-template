const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure storage for expert documents
const expertStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, "../public/expert-documents");

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const fileExtension = path.extname(file.originalname);
        const fileName = `expert_doc_${uniqueSuffix}${fileExtension}`;
        cb(null, fileName);
    }
});

// File filter for expert documents
const expertFileFilter = (req, file, cb) => {
const allowedMimeTypes = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

  // Images
  'image/jpeg',
  'image/png',

  // Text
  'text/plain',

  // Video formats
  'video/mp4',
  'video/avi',
  'video/mpeg',
  'video/quicktime', // for .mov
  'video/x-msvideo', // alternative .avi
  'video/x-matroska', // for .mkv

  // Audio formats
  'audio/mpeg', // .mp3
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  'audio/aac',
];


    const maxFileSize = 100 * 1024 * 1024; // 10MB

    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error("Error: Only PDF, Word, JPEG, PNG, and TXT files are allowed"), false);
    }

    if (file.size > maxFileSize) {
        return cb(new Error("Error: File size cannot exceed 10MB"), false);
    }

    cb(null, true);
};

// Create upload middleware for expert documents
const uploadExpertDocuments = multer({
    storage: expertStorage,
    fileFilter: expertFileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 10MB
        files: 10 // Maximum 10 files
    }
});

module.exports = uploadExpertDocuments;