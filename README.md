# Uke Sensei

A browser-based ukulele practice companion that listens to your playing, detects notes and chords in real time, visualizes everything on an interactive fretboard, and guides you through scale exercises.

## Features

### Real-time note detection
Uses your microphone and the McLeod Pitch Method to detect what note you're playing with sub-cent accuracy. A live tuning meter shows how sharp or flat you are, and the detected note lights up on the fretboard instantly.

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
│   ├── audio/            # Microphone, pitch detection, chord detection hooks
│   ├── components/       # UI components (fretboard, chord diagrams, etc.)
│   ├── exercises/        # Exercise logic and session management
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
- **Pitch detection**: [pitchy](https://github.com/ianprime0509/pitchy) (McLeod Pitch Method)
- **Audio engine**: Rust compiled to WebAssembly (rustfft for FFT)
- **Server**: Express, better-sqlite3, multer
- **Rendering**: Custom SVG for fretboard and chord diagrams

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the [MIT License](LICENSE).
