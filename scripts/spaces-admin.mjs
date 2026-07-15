#!/usr/bin/env node
// Admin helper for the DigitalOcean Spaces bucket used to store lesson/session
// recordings. Talks to the S3-compatible Spaces API directly (doctl can only
// manage Spaces *keys*, not buckets/objects).
//
// Usage:
//   node scripts/spaces-admin.mjs create-bucket
//   node scripts/spaces-admin.mjs put-cors
//   node scripts/spaces-admin.mjs ensure-user-folder <userId>
//   node scripts/spaces-admin.mjs list [prefix]
//
// Reads credentials from env: DO_SPACES_REGION, DO_SPACES_BUCKET,
// DO_SPACES_ACCESS_KEY_ID, DO_SPACES_SECRET_ACCESS_KEY.

import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';

const region = process.env.DO_SPACES_REGION;
const bucket = process.env.DO_SPACES_BUCKET;
const accessKeyId = process.env.DO_SPACES_ACCESS_KEY_ID;
const secretAccessKey = process.env.DO_SPACES_SECRET_ACCESS_KEY;

for (const [name, val] of Object.entries({ DO_SPACES_REGION: region, DO_SPACES_BUCKET: bucket, DO_SPACES_ACCESS_KEY_ID: accessKeyId, DO_SPACES_SECRET_ACCESS_KEY: secretAccessKey })) {
  if (!val) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
}

const endpoint = `https://${region}.digitaloceanspaces.com`;
const client = new S3Client({
  endpoint,
  region,
  credentials: { accessKeyId, secretAccessKey },
});

async function createBucket() {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log(`Bucket "${bucket}" already exists.`);
    return;
  } catch {
    // Doesn't exist yet (or we can't see it) - try to create it.
  }
  await client.send(new CreateBucketCommand({ Bucket: bucket }));
  console.log(`Created bucket "${bucket}" in ${region}.`);
}

async function putCors() {
  await client.send(new PutBucketCorsCommand({
    Bucket: bucket,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: (process.env.DO_SPACES_CORS_ORIGINS ?? '*').split(','),
          AllowedMethods: ['GET', 'PUT', 'HEAD'],
          AllowedHeaders: ['*'],
          MaxAgeSeconds: 3000,
        },
      ],
    },
  }));
  console.log(`CORS configured for "${bucket}".`);
}

// S3 has no real folders - a "folder" is just a common key prefix. Writing a
// zero-byte object with a trailing slash makes the per-user folder visible in
// GUI tools (Spaces web console, S3 browsers) before the user's first upload.
async function ensureUserFolder(userId) {
  if (!userId) {
    console.error('Usage: ensure-user-folder <userId>');
    process.exit(1);
  }
  const key = `${userId}/`;
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: '' }));
  console.log(`Ensured folder "${key}" in "${bucket}".`);
}

async function list(prefix) {
  const res = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, Delimiter: '/' }));
  for (const p of res.CommonPrefixes ?? []) console.log(`  ${p.Prefix}`);
  for (const o of res.Contents ?? []) console.log(`  ${o.Key} (${o.Size} bytes)`);
}

const [cmd, arg] = process.argv.slice(2);

switch (cmd) {
  case 'create-bucket':
    await createBucket();
    break;
  case 'put-cors':
    await putCors();
    break;
  case 'ensure-user-folder':
    await ensureUserFolder(arg);
    break;
  case 'list':
    await list(arg ?? '');
    break;
  default:
    console.error('Usage: spaces-admin.mjs <create-bucket|put-cors|ensure-user-folder|list> [arg]');
    process.exit(1);
}
