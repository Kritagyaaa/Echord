const { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client({
    endpoint: process.env.B2_ENDPOINT,
    region: process.env.B2_REGION,
    credentials: {
        accessKeyId: process.env.B2_ACCESS_KEY,
        secretAccessKey: process.env.B2_SECRET_KEY,
    },
    forcePathStyle: true,
});

async function getSignedStreamUrl(key) {
    const command = new GetObjectCommand({
        Bucket: process.env.B2_BUCKET,
        Key: key,
    });

    const url = await getSignedUrl(s3, command, {
        expiresIn: 3600,
    });

    return url;
}

async function uploadFile(key, body, contentType) {
    const command = new PutObjectCommand({
        Bucket: process.env.B2_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
    });

    await s3.send(command);
    return key;
}

async function getObject(key) {
    const command = new GetObjectCommand({
        Bucket: process.env.B2_BUCKET,
        Key: key,
    });

    const resp = await s3.send(command);
    return resp; // contains Body (stream), ContentType, ContentLength
}

async function deleteFile(key) {
    const command = new DeleteObjectCommand({
        Bucket: process.env.B2_BUCKET,
        Key: key,
    });

    await s3.send(command);
    return key;
}

function getPublicUrl(key) {
    const endpoint = process.env.B2_ENDPOINT.replace(/\/$/, '');
    const encodedKey = key.split('/').map(encodeURIComponent).join('/');
    const bucket = process.env.B2_BUCKET.toLowerCase();

    // Use the bucket as a subdomain for public S3-compatible Backblaze URLs.
    // This avoids path-style issues with public access on some B2 setups.
    const urlPrefix = endpoint.replace(/^(https?:\/\/)(.*)$/, `$1${bucket}.$2`);

    return `${urlPrefix}/${encodedKey}`;
}

function getProxyUrl(key, req) {
    if (!key) return null;
    const encodedKey = key.split('/').map(encodeURIComponent).join('/');
    const baseUrl = (req.protocol || 'http') + '://' + (req.get('host') || (process.env.SERVER_HOSTPORT || 'localhost:5000'));
    return `${baseUrl}/files/${encodedKey}`;
}

function formatCoverUrl(coverUrl, req) {
    if (!coverUrl) return null;

    // If it's already a relative path/key
    if (coverUrl.startsWith('covers/')) {
        return getProxyUrl(coverUrl, req);
    }

    // If it's a B2 public URL
    if (coverUrl.includes('backblazeb2.com')) {
        const match = coverUrl.match(/(covers\/.*)$/);
        if (match) {
            return getProxyUrl(match[1], req);
        }
    }

    return coverUrl;
}

module.exports = {
    getSignedStreamUrl,
    uploadFile,
    getPublicUrl,
    getProxyUrl,
    formatCoverUrl,
    getObject,
    deleteFile,
};