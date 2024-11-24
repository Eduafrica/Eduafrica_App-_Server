import AWS from 'aws-sdk';
import multer from 'multer';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();


// Set up AWS S3 bucket configuration
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  //useAccelerateEndpoint: true,
});
const bucketName = process.env.AWS_BUCKET_NAME;

// Set up Multer middleware to handle file uploads
const upload = multer();


// Initiate multipart upload and return uploadId
export async function initiateUpload(req, res) {
    try {
        const { fileName } = req.body;
        const params = {
          Bucket: bucketName,
          Key: fileName,
        };
        const upload = await s3.createMultipartUpload(params).promise();
        res.json({ uploadId: upload.UploadId });
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error initializing upload' });
      }
}

// Receive chunk and write it to S3 bucket
export async function uploadFile( req, res) {
    const { index, fileName } = req.body;
    const file = req.file;
  
    const s3Params = {
      Bucket: bucketName,
      Key: fileName,
      Body: file.buffer,
      PartNumber: Number(index) + 1,
      UploadId: req.query.uploadId,
    };
  
    s3.uploadPart(s3Params, (err, data) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: 'Error uploading chunk' });
      }
  
      return res.json({ success: true, message: 'Chunk uploaded successfully' });
    });
}

export async function completeUpload(req, res) {
    const { fileName } = req.query;
  const s3Params = {
    Bucket: bucketName,
    Key: fileName,
    UploadId: req.query.uploadId,
  };

  s3.listParts(s3Params, (err, data) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ success: false, message: 'Error listing parts' });
    }

    const parts = [];
    data.Parts.forEach(part => {
      parts.push({
        ETag: part.ETag,
        PartNumber: part.PartNumber
      });
    });

    s3Params.MultipartUpload = {
      Parts: parts
    };

    s3.completeMultipartUpload(s3Params, (err, data) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: 'Error completing upload' });
      }

      console.log("data: ", data)
      return res.json({ success: true, message: 'Upload complete', data: data.Location});
    });
  });
}