const {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const { v4: uuidv4 } = require("uuid");
const path = require("path");
const { obsClient, bucketName } = require("./obsClient");
const logger = require("./logger");

async function uploadToOBS(file, folder) {
  const uniqueName = `${uuidv4()}_${Date.now()}${path.extname(
    file.originalname
  )}`;
  const objectKey = `${folder}/${uniqueName}`;

  if (!file.buffer) {
    logger.error(`File buffer is missing for ${file.originalname}`);
    throw new Error("File buffer is missing");
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  try {
    await obsClient.send(command);
  } catch (error) {
    logger.error(`Failed to upload file to OBS: ${error.message}`);
    throw new Error("OBS upload failed");
  }

  return objectKey;
}

async function deleteFromOBS(objectKey) {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
  });

  try {
    await obsClient.send(command);
  } catch (error) {
    logger.error(`Failed to delete file from OBS: ${error.message}`);
    throw error;
  }
}

async function getSignedUrlFromOBS(objectKey, expiresInSeconds = 3600) {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    const signedUrl = await getSignedUrl(obsClient, command, {
      expiresIn: expiresInSeconds,
    });

    return signedUrl;
  } catch (error) {
    logger.error(
      `Failed to generate signed URL for ${objectKey}: ${error.message}`
    );
    throw error;
  }
}

module.exports = {
  uploadToOBS,
  deleteFromOBS,
  getSignedUrlFromOBS,
};
