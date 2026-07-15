// Client for the DigitalOcean Spaces-backed recording endpoints
// (api/recordings/*). The bucket's secret key never reaches the browser —
// these calls exchange the user's Supabase session for short-lived
// presigned URLs that the browser then uploads/downloads through directly.

function extFromBlob(blob: Blob): string {
  const type = blob.type || '';
  if (type.includes('webm')) return 'webm';
  if (type.includes('ogg')) return 'ogg';
  if (type.includes('mp4')) return 'mp4';
  if (type.includes('wav')) return 'wav';
  return 'webm';
}

async function callRecordingsApi<T>(
  path: string,
  body: Record<string, unknown>,
  accessToken?: string,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(`/api/recordings/${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.error ?? `Recordings API request failed: ${res.status}`);
  }
  return res.json();
}

/** Uploads a recording to Spaces and returns the object key (e.g. `<userId>/<uuid>.webm`). */
export async function uploadToSpaces(accessToken: string, blob: Blob): Promise<string> {
  const contentType = blob.type || 'audio/webm';
  const { uploadUrl, key } = await callRecordingsApi<{ uploadUrl: string; key: string }>(
    'upload-url',
    { fileExt: extFromBlob(blob), contentType },
    accessToken,
  );

  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });
  if (!putRes.ok) throw new Error(`Upload to Spaces failed: ${putRes.status}`);

  return key;
}

export async function getSpacesDownloadUrl(accessToken: string, key: string): Promise<string> {
  const { downloadUrl } = await callRecordingsApi<{ downloadUrl: string }>('download-url', { key }, accessToken);
  return downloadUrl;
}

export async function deleteSpacesRecording(accessToken: string, key: string): Promise<void> {
  await callRecordingsApi('delete', { key }, accessToken);
}

/** Playback URL for a Spaces recording via a share link — no Supabase session required. */
export async function getSpacesDownloadUrlForShare(shareToken: string, key: string): Promise<string> {
  const { downloadUrl } = await callRecordingsApi<{ downloadUrl: string }>('download-url', { key, shareToken });
  return downloadUrl;
}
