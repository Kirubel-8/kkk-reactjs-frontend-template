const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const obsClient = require("./obsClient"); 
require('dotenv').config(); 

const bucketName = process.env.OBS_BUCKET || "cci-bucket"; 


async function getSignedObsUrl(objectKey, expiresInSeconds = 3600) {
  if (!objectKey) {
    return null;
  }
  
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
  });

  try {
    const url = await getSignedUrl(obsClient, command, { expiresIn: expiresInSeconds });
    return url;
  } catch (error) {
    console.error(`Error generating pre-signed URL for key ${objectKey}:`, error);
    throw error; 
  }
}

module.exports = { getSignedObsUrl };