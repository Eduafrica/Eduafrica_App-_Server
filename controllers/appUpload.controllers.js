import multer from 'multer';
import s3 from '../middleware/awsConfig.js';

// Constants
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk (adjustable)

// Multer setup
const storage = multer.memoryStorage(); // Handle file in memory
const upload = multer({ storage }).single('file'); // Handle single file upload under the "file" field

// Helper function to upload a single part of the file
async function uploadPart(buffer, partNumber, uploadId, fileKey) {
    const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME, // Use bucket name from environment variables
        Key: fileKey,
        PartNumber: partNumber,
        UploadId: uploadId,
        Body: buffer,
    };

    const result = await s3.uploadPart(uploadParams).promise();
    return {
        ETag: result.ETag, // Save ETag for multipart completion
        PartNumber: partNumber,
    };
}

// Main function to handle file upload
export async function appUpload(req, res) {
    //console.log('object body', req)
    console.log('object body file', req.file)
    try {
        // Ensure a file was uploaded
        if (!req.file) {
            return res.status(400).send('No file uploaded');
        }

        const fileBuffer = req.file.buffer;
        const fileSize = fileBuffer.length;
        const fileKey = req.file.originalname; // Use original filename as the S3 key

        // Start the multipart upload
        const createUploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey,
        };

        const createUploadResult = await s3.createMultipartUpload(createUploadParams).promise();
        const uploadId = createUploadResult.UploadId;
        const partCount = Math.ceil(fileSize / CHUNK_SIZE);

        // Array to store the uploaded parts
        const uploadedParts = [];

        // Upload file in chunks
        for (let partNumber = 1; partNumber <= partCount; partNumber++) {
            const startByte = (partNumber - 1) * CHUNK_SIZE;
            const endByte = Math.min(startByte + CHUNK_SIZE, fileSize);
            const chunk = fileBuffer.slice(startByte, endByte);

            console.log(`Uploading part ${partNumber} from byte ${startByte} to ${endByte}`);

            const part = await uploadPart(chunk, partNumber, uploadId, fileKey);
            uploadedParts.push(part);
        }

        // Complete the multipart upload
        const completeUploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey,
            UploadId: uploadId,
            MultipartUpload: {
                Parts: uploadedParts,
            },
        };

        const completeUploadResult = await s3.completeMultipartUpload(completeUploadParams).promise();
        console.log('Upload complete:', completeUploadResult);

        return res.status(200).json({ message: 'Upload successful', location: completeUploadResult.Location });
    } catch (error) {
        console.error('Error uploading file:', error);
        return res.status(500).send('Error uploading file');
    }
}
