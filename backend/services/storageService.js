const { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const endpoint = process.env.STORAGE_ENDPOINT || process.env.B2_ENDPOINT;
const region = process.env.STORAGE_REGION || process.env.B2_REGION || 'us-east-1';
const accessKeyId = process.env.STORAGE_ACCESS_KEY || process.env.B2_ACCESS_KEY;
const secretAccessKey = process.env.STORAGE_SECRET_KEY || process.env.B2_SECRET_KEY;
const bucket = process.env.STORAGE_BUCKET || process.env.B2_BUCKET;

const s3 = new S3Client({
    endpoint,
    region,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
    forcePathStyle: true,
});

async function getSignedStreamUrl(key) {
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
    });

    const url = await getSignedUrl(s3, command, {
        expiresIn: 3600,
    });

    return url;
}

async function uploadFile(key, body, contentType) {
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
    });

    await s3.send(command);
    return key;
}

async function getObject(key, range) {
    const params = {
        Bucket: bucket,
        Key: key,
    };
    if (range) {
        params.Range = range;
    }
    const command = new GetObjectCommand(params);

    const resp = await s3.send(command);
    return resp; // contains Body (stream), ContentType, ContentLength, ContentRange
}

async function deleteFile(key) {
    const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
    });

    await s3.send(command);
    return key;
}

function getPublicUrl(key) {
    if (!endpoint) return '';
    const ep = endpoint.replace(/\/$/, '');
    const encodedKey = key.split('/').map(encodeURIComponent).join('/');
    const bkt = bucket ? bucket.toLowerCase() : '';

    // Use the bucket as a subdomain for public S3-compatible Backblaze URLs.
    // This avoids path-style issues with public access on some B2 setups.
    const urlPrefix = ep.replace(/^(https?:\/\/)(.*)$/, `$1${bkt}.$2`);
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
