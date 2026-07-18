"""Vercel Python function: run 6-stem source separation on an uploaded track.

POST /api/stems/separate  { "jobId": "<stem_jobs.id>" }
Authorization: Bearer <supabase access token>

The client first uploads the track to DigitalOcean Spaces (via the presigned
URL from api/recordings/upload-url) and inserts a `stem_jobs` row pointing at
it. This function then does the heavy lifting: download, decode, htdemucs_6s
inference (see _separation.py), mp3-encode the six stems, upload them to
Spaces, and record progress/results on the job row. The request stays open
for the duration; the client tracks progress by polling the job row, so a
dropped response is harmless.

All Supabase reads/writes go through PostgREST with the *caller's own* token,
so RLS guarantees users can only touch their own jobs. Spaces credentials
stay server-side (same DO_SPACES_* env vars as the TS endpoints).
"""
from __future__ import annotations

import json
import os
import re
import sys
import tempfile
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))
from _separation import (  # noqa: E402
    SOURCES,
    TrackTooLongError,
    load_audio,
    separate,
    write_stem_mp3,
)

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY", "")

SPACES_REGION = os.environ.get("DO_SPACES_REGION", "")
SPACES_BUCKET = os.environ.get("DO_SPACES_BUCKET", "")
SPACES_KEY_ID = os.environ.get("DO_SPACES_ACCESS_KEY_ID", "")
SPACES_SECRET = os.environ.get("DO_SPACES_SECRET_ACCESS_KEY", "")

SOURCE_EXT_RE = re.compile(r"\.(wav|mp3|flac|ogg)$", re.IGNORECASE)


class ApiError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status


# ---------------------------------------------------------------------------
# Supabase (PostgREST with the caller's token, so RLS applies)

def _supabase_request(method: str, path: str, token: str, body: dict | None = None) -> list | dict | None:
    req = urllib.request.Request(
        f"{SUPABASE_URL}{path}",
        method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
    )
    try:
        with urllib.request.urlopen(req) as res:
            raw = res.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raise ApiError(502, f"Supabase request failed ({e.code}): {e.read().decode()[:200]}")


def get_user_id(token: str) -> str:
    req = urllib.request.Request(
        f"{SUPABASE_URL}/auth/v1/user",
        headers={"apikey": SUPABASE_ANON_KEY, "Authorization": f"Bearer {token}"},
    )
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read())["id"]
    except (urllib.error.HTTPError, KeyError):
        raise ApiError(401, "Not authenticated")


def get_job(token: str, job_id: str) -> dict:
    rows = _supabase_request("GET", f"/rest/v1/stem_jobs?id=eq.{job_id}&select=*", token)
    if not rows:
        raise ApiError(404, "Job not found")
    return rows[0]


def update_job(token: str, job_id: str, fields: dict) -> None:
    _supabase_request("PATCH", f"/rest/v1/stem_jobs?id=eq.{job_id}", token, fields)


# ---------------------------------------------------------------------------
# DigitalOcean Spaces (S3 API via boto3, credentials server-side only)

def _spaces_client():
    import boto3

    if not (SPACES_REGION and SPACES_BUCKET and SPACES_KEY_ID and SPACES_SECRET):
        raise ApiError(503, "Recording storage is not configured")
    return boto3.client(
        "s3",
        endpoint_url=f"https://{SPACES_REGION}.digitaloceanspaces.com",
        region_name=SPACES_REGION,
        aws_access_key_id=SPACES_KEY_ID,
        aws_secret_access_key=SPACES_SECRET,
    )


# ---------------------------------------------------------------------------
# Job processing

def process_job(token: str, user_id: str, job: dict) -> dict[str, str]:
    job_id = job["id"]
    source_key = job["source_key"]

    # Same ownership rule as api/_lib/auth.ts: key lives directly under the
    # user's own folder.
    prefix = f"{user_id}/"
    if (
        not source_key.startswith(prefix)
        or "/" in source_key[len(prefix):]
        or ".." in source_key
    ):
        raise ApiError(403, "Source key does not belong to this user")
    if not SOURCE_EXT_RE.search(source_key):
        raise ApiError(400, "Unsupported audio format (use wav, mp3, flac or ogg)")

    spaces = _spaces_client()
    workdir = Path(tempfile.mkdtemp(prefix="stems-"))
    source_path = workdir / f"source{SOURCE_EXT_RE.search(source_key).group(0).lower()}"
    spaces.download_file(SPACES_BUCKET, source_key, str(source_path))

    mix = load_audio(source_path)
    source_path.unlink()
    duration_sec = mix.shape[1] / 44100
    update_job(token, job_id, {"status": "processing", "progress": 0, "duration_sec": duration_sec})

    # Inference is ~90% of the wall time; reserve the last 10% for encoding/upload.
    def on_progress(frac: float) -> None:
        update_job(token, job_id, {"progress": int(frac * 90)})

    stems = separate(mix, on_progress=on_progress)
    del mix

    stem_keys: dict[str, str] = {}
    for i, name in enumerate(SOURCES):
        mp3_path = workdir / f"{name}.mp3"
        write_stem_mp3(stems[name], mp3_path)
        key = f"{user_id}/stem-{job_id}-{name}.mp3"
        spaces.upload_file(
            str(mp3_path), SPACES_BUCKET, key, ExtraArgs={"ContentType": "audio/mpeg"}
        )
        mp3_path.unlink()
        stem_keys[name] = key
        update_job(token, job_id, {"progress": 90 + int((i + 1) / len(SOURCES) * 10)})

    update_job(token, job_id, {"status": "complete", "progress": 100, "stems": stem_keys})
    return stem_keys


# ---------------------------------------------------------------------------
# HTTP handler (Vercel Python runtime)

class handler(BaseHTTPRequestHandler):
    def _respond(self, status: int, body: dict) -> None:
        payload = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_POST(self) -> None:  # noqa: N802 (Vercel convention)
        token = ""
        job_id = ""
        claimed = False  # only mark the job failed once this invocation owns it
        try:
            if not (SUPABASE_URL and SUPABASE_ANON_KEY):
                raise ApiError(503, "Supabase is not configured")

            match = re.match(r"^Bearer\s+(.+)$", self.headers.get("Authorization", ""), re.I)
            if not match:
                raise ApiError(401, "Not authenticated")
            token = match.group(1)

            length = int(self.headers.get("Content-Length") or 0)
            body = json.loads(self.rfile.read(length) or b"{}")
            job_id = str(body.get("jobId", ""))
            if not re.fullmatch(r"[0-9a-f-]{36}", job_id):
                raise ApiError(400, "Missing or invalid jobId")

            user_id = get_user_id(token)
            job = get_job(token, job_id)
            if job["status"] not in ("pending", "error"):
                raise ApiError(409, f"Job is already {job['status']}")
            claimed = True

            stem_keys = process_job(token, user_id, job)
            self._respond(200, {"ok": True, "stems": stem_keys})
        except TrackTooLongError as e:
            if claimed:
                self._fail_job(token, job_id, str(e))
            self._respond(400, {"error": str(e)})
        except ApiError as e:
            if claimed:
                self._fail_job(token, job_id, str(e))
            self._respond(e.status, {"error": str(e)})
        except Exception as e:  # noqa: BLE001 — surface anything else as a job error
            print(f"Stem separation failed for job {job_id}: {e!r}")
            if claimed:
                self._fail_job(token, job_id, "Stem separation failed")
            self._respond(500, {"error": "Stem separation failed"})

    def _fail_job(self, token: str, job_id: str, message: str) -> None:
        if not (token and job_id):
            return
        try:
            update_job(token, job_id, {"status": "error", "error": message})
        except Exception:  # noqa: BLE001 — best effort; the response carries the error
            pass
