module.exports = {
  region: process.env.OBS_REGION || undefined,
  endpoint: process.env.OBS_ENDPOINT || undefined,
  forcePathStyle: process.env.OBS_FORCE_PATH_STYLE === "true",
  credentials: {
    accessKeyId:
      process.env.OBS_ACCESS_KEY_ID ||
      process.env.AWS_ACCESS_KEY_ID ||
      undefined,
    secretAccessKey:
      process.env.OBS_SECRET_ACCESS_KEY ||
      process.env.AWS_SECRET_ACCESS_KEY ||
      undefined,
  },
};
