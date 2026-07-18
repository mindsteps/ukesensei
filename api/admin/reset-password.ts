import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callAdminRpc, respondWithAdminError } from '../_lib/admin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const userId = String(req.body?.userId ?? '');
  const newPassword = String(req.body?.newPassword ?? '');
  if (!userId || !newPassword) {
    res.status(400).json({ error: 'Missing userId or newPassword' });
    return;
  }

  try {
    await callAdminRpc(req.headers.authorization, 'admin_reset_user_password', {
      p_user_id: userId,
      p_new_password: newPassword,
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    respondWithAdminError(res, err, 'Failed to reset password');
  }
}
