# Uke Sensei

A browser-based multi-instrument practice companion. It listens to you play (via mic), detects pitch/chords/rhythm in real time, and guides you through structured lessons and free-play exercises. Started as a ukulele-only tool; now also supports bass, guitar, clarinet, voice, handpan, and cajon.

## Supported instruments

- **String** (fretboard + chord diagrams): ukulele, bass, guitar
- **Pitched, no fretboard**: clarinet, voice (with a continuous pitch/range ladder)
- **Percussive, no stable pitch**: handpan (multi-scale), cajon (rhythm-only, detected via onset/spectral analysis rather than pitch)

## Features

### Real-time note detection
Uses your microphone to detect what note you're playing with sub-cent accuracy, via a Rust/WASM audio engine (FFT-based) running in an AudioWorklet for low-latency analysis. A live tuning meter shows how sharp or flat you are, and the detected note lights up on the fretboard instantly. (An older `pitchy`-based hook, `usePitchDetection.ts`, still lives in the repo but is no longer wired into the app — the WASM path replaced it.)

### Lessons and curricula
Each instrument has its own structured curriculum (`src/lessons/`) of modules and lessons, each with instructional content, free-play practice drills, and a gating checkpoint exercise that must be passed at a required accuracy to unlock the next lesson. Checkpoints are pitch-based for melodic instruments and hit/timing-based for cajon.

### Accounts, sharing, and history
Sign-in/auth gating, an admin dashboard, a session library with playback, and shareable session links (`ShareModal` / `SharedSessionView`) so a practice session or recording can be sent to someone else.

### Sheet music
Live staff notation and melody transcription (via `vexflow`), including quantizing a recorded/transcribed melody to a tempo grid.

### Chord detection and diagrams
When you strum a chord, Uke Sensei identifies it from the notes ringing within a short time window. The detected chord is displayed as a standard ukulele fretting diagram showing finger positions, open strings, and barres. Supports major, minor, 7th, maj7, min7, diminished, augmented, sus2, sus4, and more.

### Interactive SVG fretboard
A custom-rendered 4-string, 15-fret ukulele fretboard that shows:
- Detected notes highlighted in real time with a pulse animation
- Scale patterns color-coded with root notes emphasized
- Exercise targets with a glow effect
- Fret markers at positions 5, 7, 10, and 12

The fretboard can be **flipped** so the lowest-pitched string appears on top -- useful if you prefer to see the fretboard matching your perspective when looking down at your uke.

### Tuning support with auto-detection
Supports both Standard (High G) and Low G tunings. You can select your tuning manually, or just start playing -- when the app hears your open G string it automatically detects whether you're using high G or low G and switches accordingly.

### Scale exercises
Practice scales in all 12 keys across 10 scale types:
- **7 modes**: Ionian (Major), Dorian, Phrygian, Lydian, Mixolydian, Aeolian (Natural Minor), Locrian
- **Pentatonic**: Major and Minor
- **Blues**

That's 120 key/scale combinations. Each exercise guides you note-by-note up the fretboard, highlighting the next target and telling you the string and fret to play.

### Performance feedback
After completing an exercise you get a summary with:
- Accuracy percentage
- Average cents deviation (how in-tune you were)
- Total time
- A performance rating
- A contextual suggestion for what to practice next

### Dark / light mode
Toggle between dark and light themes. Your preference is saved in the browser.

### Welcome tour
New users get a short, skippable tour after finishing account setup, introducing the instrument switcher, Free Play, Exercises/Lessons, and the Library. It only shows once — skipping or finishing it marks it done. Anyone can bring it back anytime from the user menu (top right, next to your name) or the "Take the tour" link on the About page.

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [Yarn](https://yarnpkg.com/) (used as the package manager)
- [Rust](https://www.rust-lang.org/tools/install) with the `wasm32-unknown-unknown` target (only needed if you want to rebuild the WASM audio engine)

To add the WASM target to an existing Rust installation:

```bash
rustup target add wasm32-unknown-unknown
```

## Getting started

### Frontend

```bash
yarn install
yarn dev
```

Open [http://localhost:5173](http://localhost:5173) and click **Start Listening** to begin.

### Server (optional)

The server provides session recording and server-side audio analysis. It is not required for basic usage.

```bash
cd server
yarn install
yarn dev
```

### Recording storage (DigitalOcean Spaces)

Practice-session and lesson recordings currently upload straight to Supabase Storage (`session-audio` bucket, one folder per user), which comfortably handles today's short audio clips.

For larger recordings (e.g. longer lesson videos), the project also provisions a DigitalOcean Spaces bucket — an S3-compatible object store — with the same per-user-folder convention: `<bucket>/<userId>/<recordingId>.ext`. `doctl` can only manage Spaces *keys*, not buckets, so bucket creation/config goes through the S3 API via `scripts/spaces-admin.mjs`:

```bash
# 1. Create a Spaces access key scoped to the bucket (bucket can not yet exist
#    for a fullaccess grant — see scripts/spaces-admin.mjs comments if you hit
#    "Invalid Grant Combination").
doctl spaces keys create ukesensei-recordings \
  --grants 'bucket=ukesensei-recordings;permission=readwrite'

# 2. Put the resulting access key/secret + region/bucket into .env as
#    DO_SPACES_REGION, DO_SPACES_BUCKET, DO_SPACES_ACCESS_KEY_ID,
#    DO_SPACES_SECRET_ACCESS_KEY (see .env.example).

# 3. Create the bucket and configure CORS for browser uploads:
yarn spaces:create-bucket
yarn spaces:cors
```

These are server-side credentials only — never ship the secret key to the browser. Uploading directly from the browser to Spaces needs a small server endpoint to mint short-lived presigned URLs (the secret key must stay off the client); that endpoint isn't wired up yet, so this bucket is provisioned and ready but not yet in the live upload path.

### Rebuilding the WASM audio engine (optional)

A pre-built `public/audio-engine.wasm` is included in the repository. To rebuild it from source:

```bash
cd wasm
./build.sh
```

This compiles the Rust crate to WebAssembly and copies the output to `public/audio-engine.wasm`.

## Project structure

```
ukesensei/
├── src/                  # React frontend
│   ├── audio/            # Microphone, pitch/onset detection, chord detection hooks
│   ├── auth/             # Sign-in / auth gating
│   ├── components/       # UI components (fretboard, chord diagrams, lessons, admin, sharing, etc.)
│   ├── exercises/        # Free-play exercise logic and session management
│   ├── lessons/          # Per-instrument curricula (modules, lessons, checkpoints)
│   ├── theory/           # Music theory (notes, scales, chords, fretboard mappings)
│   └── store/            # Zustand state management
├── server/               # Express API server (session recording, analysis)
│   └── src/
├── wasm/                 # Rust WASM audio engine (FFT-based pitch/chord detection)
│   └── src/
├── public/               # Static assets including pre-built WASM binary
└── index.html            # Vite entry point
```

## How to use

### Free play
Start the microphone and play your ukulele. The fretboard lights up showing which notes you're hitting. Use the scale overlay controls to display any scale/mode and see how your playing relates to it.

### Exercises
Switch to the Exercises tab, pick a key and scale, then hit Start Exercise. Play each highlighted note to advance through the scale. Hold each note briefly (~200ms) for it to register. When you finish, review your accuracy and get a suggestion for what to try next.

### Chord detection
Strum any chord and the chord name and fretting diagram appear alongside the fretboard. The detector identifies chords from the notes it hears within a short window, so single notes won't trigger false chord detections.

## Tech stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **State management**: Zustand
- **Pitch/onset detection**: Rust compiled to WebAssembly (rustfft for FFT), running in an AudioWorklet. [pitchy](https://github.com/ianprime0509/pitchy) (McLeod Pitch Method) is present as a dependency but is dead code, not used in the live detection path.
- **Auth/storage**: Supabase (auth, Postgres, session-audio storage), DigitalOcean Spaces (provisioned for larger recordings, not yet in the live upload path)
- **Sheet music**: vexflow
- **Server**: Express, better-sqlite3, multer
- **Rendering**: Custom SVG for fretboard, chord, handpan, clarinet, and cajon diagrams

## Documentation

- [User Manual](docs/USER_MANUAL.md) — how to use the app as a player
- [Developer Guide](docs/DEVELOPER_GUIDE.md) — architecture: audio pipeline, state, auth model, backends, deployment
- [CONTRIBUTING.md](CONTRIBUTING.md) — how to get set up and submit changes

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the [MIT License](LICENSE).
