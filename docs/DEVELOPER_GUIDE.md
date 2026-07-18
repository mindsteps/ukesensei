# Uke Sensei — Developer Guide

Architecture overview for contributors. For setup/build steps see the [README](../README.md) and [CONTRIBUTING.md](../CONTRIBUTING.md); for what the app does from a player's perspective see the [User Manual](./USER_MANUAL.md).

## High-level shape

React + TypeScript SPA (Vite, Tailwind, Zustand), no server-side rendering, no client-side router (a small custom URL sync in `src/routing/` maps a handful of paths to view state). Two separate backend surfaces exist (see "Two backends" below). Persistent data lives in Supabase (Postgres + Auth + Storage) with DigitalOcean Spaces provisioned as an object store for larger recordings.

## Audio pipeline

```
mic (getUserMedia)
  → AudioWorklet (public/audio-worklet-processor.js)
      → Rust/WASM engine (wasm/, compiled via rustfft)
          → pitch { frequency, clarity, midiNote, cents, rms } posted back to the main thread
  → src/audio/useWasmAudio.ts   (owns the AudioContext, worklet, gain, EQ, analyser)
  → src/audio/useOnsetDetection.ts   (cajón only — RMS-spike + spectral-band classification, not pitch)
  → src/audio/useChordDetection.ts   (windows recent detected notes, filters harmonics, calls into src/theory/chords.ts)
```

**Important:** `src/audio/usePitchDetection.ts` (a `pitchy`/McLeod-based hook) still exists in the tree but is **not called anywhere** in `App.tsx`. It predates the WASM engine and was never removed. Don't assume it's live — check `useWasmAudio.ts` for the actual detection path before changing pitch-detection behavior. `pitchy` remains a `package.json` dependency for this dead hook.

Cajón has no stable pitch, so it skips the pitch worklet's output entirely and instead reads the raw `AnalyserNode` (independent of the pitch worklet) to detect percussive onsets by RMS spike over a rolling floor, then classifies hit type by comparing low-band vs. high-band frequency energy.

## State management

Single Zustand store: `src/store/useAppStore.ts`. No `persist` middleware — instead, UI-only preferences that should survive a reload but don't need to sync across devices are written straight to `localStorage` behind small helper functions (`getInitial*` / `persist*`), following one consistent pattern. Current localStorage-backed keys:

- `uke-sensei-theme` — dark/light
- `uke-sensei-instrument` — last-selected instrument
- `uke-sensei-handpan-layout` — last-selected handpan scale
- `uke-sensei-lessons` — completed lesson IDs (also synced to Supabase when signed in — see `storage/progressSync.ts`)
- `uke-sensei-tour-complete` — whether the welcome tour has been seen/skipped

When adding a new UI preference that should persist locally, follow this same pattern rather than introducing a new persistence mechanism.

Anything that needs to survive across devices (lesson progress, sessions, profile) goes through Supabase instead — see `src/storage/cloudProgressStore.ts`, `cloudSessionStore.ts`.

## Instruments and the lesson system

`src/theory/fretboard.ts` defines the `Instrument` union (`ukulele | bass | guitar | clarinet | voice | handpan | cajon`) and which of those are string instruments (have a fretboard/tuning) vs. rhythm instruments (cajón) vs. plain pitched instruments (clarinet, voice).

Each instrument's lesson content lives in its own file under `src/lessons/` (e.g. `bluesCurriculum.ts`, `cajonCurriculum.ts`) and is registered in `src/lessons/registry.ts`'s `CURRICULA` map. **Not every instrument has a curriculum** — check `hasCurriculum()` before assuming lessons exist; guitar and clarinet currently have none.

A `Lesson` (see `src/lessons/types.ts`) has instructional `content` blocks, some ungated `practice` drills, and one gating `checkpoint`. Checkpoints come in two shapes distinguished structurally (via `isRhythmCheckpoint`, which just checks for a `pattern` field):
- `PitchCheckpointDef` — a sequence of fretboard positions to play in order, monophonically, at a required accuracy
- `RhythmCheckpointDef` — a hit/timing pattern (cajón), graded by `useRhythmExercise.ts` against real mic-detected onsets

## Auth model

Auth is intentionally not email/password in the conventional sense. Every visitor is signed in **anonymously** via Supabase on load (see `AuthProvider.tsx`). During onboarding, a display name + a "key" (the user-facing term for password) get linked to that anonymous identity via `claimIdentity()`:

- A deterministic pseudo-email is derived from the slugified display name (`credentialEmail()`) — never a real inbox.
- If that name+key combination already exists and matches, the existing anonymous session is **resumed** on the new device (`'resumed'`).
- If the name exists with a different key, it's rejected the same way a wrong password would be (`'taken'`).
- Otherwise a new identity is linked (`'linked'`).

This is what lets "same name + same key brings your profile back on any device" work without a real email verification flow. There's a separate, unrelated `signInAsAdmin(email, password)` path used only for the admin dashboard — not shown to regular users.

## Two backends

There are **two independent backend surfaces** — know which one you're touching:

1. **`api/`** — Vercel serverless functions, deployed automatically via `.github/workflows/deploy.yml` on push to `main`. Currently handles recording storage: minting presigned upload/download URLs for DigitalOcean Spaces (`api/recordings/*`) and verifying Supabase access tokens / share tokens server-side (`api/_lib/auth.ts`) without needing a service-role key. This is the live production backend.
2. **`server/`** — a standalone Express app (session recording + server-side FFT analysis via `better-sqlite3`). Per the README this is optional and not required for basic usage — treat it as a local-dev/legacy path rather than what's deployed in production, and confirm with whoever's driving the roadmap before building new features on it.

## Storage layers

- **Supabase Storage** (`session-audio` bucket, one folder per user) handles today's short practice-session/recording audio and is the primary path.
- **DigitalOcean Spaces** is provisioned (see `scripts/spaces-admin.mjs`, `.env.example`) for larger recordings, with the same per-user-folder convention. The direct browser-to-Spaces upload path (via presigned URLs from `api/recordings/upload-url.ts`) exists, but confirm current wiring before assuming all recordings flow through it — this was still being built out as of the last README pass.
- **Sharing**: `src/storage/shareStore.ts` creates/lists/revokes share tokens; `api/_lib/auth.ts`'s `shareTokenGrantsAccess` verifies a token against a specific Spaces object key via a Postgres RPC (`verify_shared_audio_key`), so anonymous recipients can play a shared recording without an account.

## Deployment

`vercel.json` configures the build (`yarn build` → `dist/`) with an SPA rewrite (`/(.*) → /index.html`). `.github/workflows/deploy.yml` runs on every push to `main`: enables Corepack, installs with `yarn install --immutable`, type-checks (`yarn tsc -b --noEmit`), lints (non-blocking), then deploys to Vercel. There is no separate staging environment configured in this workflow — pushes to `main` go to production.

## Testing locally

No automated test suite exists yet (`yarn lint` and `tsc` are the only CI gates). When touching audio/detection code, test manually in the browser with a real microphone — synthetic/mocked audio input isn't set up. See CONTRIBUTING.md for how to re-trigger first-run flows (onboarding, welcome tour) during local development.
