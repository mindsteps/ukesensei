import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callAdminRpc, parseLimit, respondWithAdminError } from '../_lib/admin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const row_limit = parseLimit(req.query.limit, 15, 50);
    const data = await callAdminRpc(req.headers.authorization, 'admin_get_top_users', { row_limit });
    res.status(200).json(data ?? []);
  } catch (err) {
    respondWithAdminError(res, err, 'Failed to load top users');
  }
}
