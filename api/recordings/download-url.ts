import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserIdFromRequest, keyBelongsToUser, shareTokenGrantsAccess } from '../_lib/auth.js';
import { createDownloadUrl, spacesConfigured } from '../_lib/spaces.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!spacesConfigured) {
    res.status(503).json({ error: 'Recording storage is not configured' });
    return;
  }

  const key = String(req.body?.key ?? '');
  const shareToken = req.body?.shareToken ? String(req.body.shareToken) : null;
  if (!key) {
    res.status(400).json({ error: 'Missing key' });
    return;
  }

  // Anonymous share-link viewers have no Supabase session of their own —
  // a valid, non-revoked share token for this exact key stands in for
  // ownership. Otherwise fall back to the normal "must own this folder" check.
  const authorized = shareToken
    ? await shareTokenGrantsAccess(shareToken, key)
    : keyBelongsToUser(key, (await getUserIdFromRequest(req.headers.authorization)) ?? '');

  if (!authorized) {
    res.status(403).json({ error: 'Not allowed to access this recording' });
    return;
  }

  try {
    const downloadUrl = await createDownloadUrl(key);
    res.status(200).json({ downloadUrl });
  } catch (err) {
    console.error('Failed to create download URL:', err);
    res.status(500).json({ error: 'Failed to create download URL' });
  }
}
