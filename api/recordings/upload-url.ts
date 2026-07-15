import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';
import { getUserIdFromRequest } from '../_lib/auth.js';
import { createUploadUrl, spacesConfigured } from '../_lib/spaces.js';

const ALLOWED_EXTENSIONS = new Set(['webm', 'wav', 'ogg', 'mp4', 'm4a']);
const DEFAULT_EXTENSION = 'webm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!spacesConfigured) {
    res.status(503).json({ error: 'Recording storage is not configured' });
    return;
  }

  const userId = await getUserIdFromRequest(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const requestedExt = String(req.body?.fileExt ?? '').toLowerCase().replace(/^\./, '');
  const ext = ALLOWED_EXTENSIONS.has(requestedExt) ? requestedExt : DEFAULT_EXTENSION;
  const contentType = String(req.body?.contentType ?? `audio/${ext}`);

  const key = `${userId}/${randomUUID()}.${ext}`;

  try {
    const uploadUrl = await createUploadUrl(key, contentType);
    res.status(200).json({ uploadUrl, key });
  } catch (err) {
    console.error('Failed to create upload URL:', err);
    res.status(500).json({ error: 'Failed to create upload URL' });
  }
}
