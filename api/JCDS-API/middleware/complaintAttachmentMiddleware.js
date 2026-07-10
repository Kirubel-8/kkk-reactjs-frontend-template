const isImageMime = (mimetype) => {
  // Check the mimetype to be one of the listed types
  const acceptedMimeTypes = [
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
    "video/webm",
    "video/ogg",
    "video/3gpp",
    "video/x-flv",
  ];
  return acceptedMimeTypes.includes(mimetype);
};

/**
 * Classifies uploaded files into witness signatures and evidence files.
 * Validates that witness signatures (if present) are images.
 */
module.exports = (req, res, next) => {
  const files = Array.isArray(req.files) ? req.files : [];

  const sameName = files.filter((f) => f.fieldname === "witness_signatures");
  // Matches: witnesses[0].signature, witness[1][signature], witnesses[2]_signature,
  const indexed = files.filter((f) =>
    /(^|\.)witness(?:es)?\[\d+\](?:\.|\[|_)?signature(?:\])?$/.test(f.fieldname)
  );
  const witnessSignatures = sameName.length ? sameName : indexed;
  const evidenceFiles = files.filter(
    (f) =>
      f.fieldname === "evidence_files" ||
      /(^|\.)evidence_files\[\d+\]$/.test(f.fieldname)
  );

  console.log({
    fileFieldnames: files.map((f) => f.fieldname),
    witnessSignatureFieldnames: witnessSignatures.map((f) => f.fieldname),
    evidenceFileFieldnames: evidenceFiles.map((f) => f.fieldname),
  });

  for (const f of witnessSignatures) {
    if (!isImageMime(f.mimetype)) {
      return res
        .status(400)
        .json({ error: "Witness signatures must be images" });
    }
  }

  req.uploads = { witnessSignatures, evidenceFiles };
  next();
};
