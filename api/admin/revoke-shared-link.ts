import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callAdminRpc, respondWithAdminError } from '../_lib/admin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const linkId = String(req.body?.linkId ?? '');
  if (!linkId) {
    res.status(400).json({ error: 'Missing linkId' });
    return;
  }

  try {
    await callAdminRpc(req.headers.authorization, 'admin_revoke_shared_link', { p_link_id: linkId });
    res.status(200).json({ ok: true });
  } catch (err) {
    respondWithAdminError(res, err, 'Failed to revoke shared link');
  }
}
