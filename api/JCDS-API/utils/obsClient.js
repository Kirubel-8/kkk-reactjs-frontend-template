const { S3Client } = require('@aws-sdk/client-s3');
const obsConfig = require('../config/obs.config');

const obsClient = new S3Client(obsConfig);
const bucketName = process.env.OBS_BUCKET || 'cci-bucket';

module.exports = {
    obsClient,
    bucketName,
};