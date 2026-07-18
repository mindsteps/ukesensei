import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callAdminRpc, respondWithAdminError } from '../_lib/admin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const raw = req.body?.maxAgeHours;
  const maxAgeHours = Number.isFinite(Number(raw)) && Number(raw) >= 0 ? Number(raw) : 24;

  try {
    const deleted = await callAdminRpc<number>(req.headers.authorization, 'admin_clean_users', {
      p_max_age_hours: maxAgeHours,
    });
    res.status(200).json({ deleted: deleted ?? 0 });
  } catch (err) {
    respondWithAdminError(res, err, 'Failed to clean up users');
  }
}
