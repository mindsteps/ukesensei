import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const region = process.env.DO_SPACES_REGION;
const bucket = process.env.DO_SPACES_BUCKET;
const accessKeyId = process.env.DO_SPACES_ACCESS_KEY_ID;
const secretAccessKey = process.env.DO_SPACES_SECRET_ACCESS_KEY;

export const spacesConfigured = !!(region && bucket && accessKeyId && secretAccessKey);

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!spacesConfigured) throw new Error('DigitalOcean Spaces is not configured');
  if (!client) {
    client = new S3Client({
      endpoint: `https://${region}.digitaloceanspaces.com`,
      region,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
    });
  }
  return client;
}

export function getBucket(): string {
  if (!bucket) throw new Error('DO_SPACES_BUCKET is not set');
  return bucket;
}

/** Presigned URL the browser can PUT the recording bytes to directly. */
export async function createUploadUrl(key: string, contentType: string, expiresInSec = 300): Promise<string> {
  const command = new PutObjectCommand({ Bucket: getBucket(), Key: key, ContentType: contentType });
  return getSignedUrl(getClient(), command, { expiresIn: expiresInSec });
}

/** Presigned URL the browser can GET the recording bytes from directly. */
export async function createDownloadUrl(key: string, expiresInSec = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: getBucket(), Key: key });
  return getSignedUrl(getClient(), command, { expiresIn: expiresInSec });
}

export async function deleteObject(key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
}
