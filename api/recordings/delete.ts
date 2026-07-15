import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserIdFromRequest, keyBelongsToUser } from '../_lib/auth.js';
import { deleteObject, spacesConfigured } from '../_lib/spaces.js';

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

  const key = String(req.body?.key ?? '');
  if (!key || !keyBelongsToUser(key, userId)) {
    res.status(403).json({ error: 'Not allowed to delete this recording' });
    return;
  }

  try {
    await deleteObject(key);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Failed to delete recording:', err);
    res.status(500).json({ error: 'Failed to delete recording' });
  }
}
