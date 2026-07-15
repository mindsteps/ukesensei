/**
 * Recordings at or below this size go to Supabase Storage (simple, works
 * today, no server round-trip). Anything larger goes to DigitalOcean Spaces
 * via presigned URLs (api/recordings/*), which is far cheaper for bulk/long
 * media and has no per-file size ceiling tied to a SaaS plan tier.
 */
export const SPACES_UPLOAD_THRESHOLD_BYTES = 15 * 1024 * 1024;
