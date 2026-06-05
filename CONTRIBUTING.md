# Contributing to Uke Sensei

Thanks for your interest in contributing! Here's how to get started.

## Getting set up

1. Fork the repository and clone your fork
2. Install dependencies:

```bash
yarn install
cd server && yarn install
```

3. Start the development server:

```bash
yarn dev
```

4. If you're working on the WASM audio engine, make sure you have [Rust](https://www.rust-lang.org/tools/install) installed with the `wasm32-unknown-unknown` target, then rebuild with:

```bash
cd wasm
./build.sh
```

## Making changes

1. Create a branch from `main` for your work
2. Make your changes with clear, focused commits
3. Make sure the project builds cleanly (`yarn build`)
4. Test your changes in the browser with a real microphone if they touch audio/detection code

## Submitting a pull request

1. Push your branch to your fork
2. Open a pull request against `main`
3. Describe what you changed and why
4. If your PR addresses an open issue, reference it (e.g. "Fixes #12")

## Code style

- TypeScript for all frontend and server code
- Rust for the WASM audio engine
- Run `yarn lint` before submitting to catch style issues

## Reporting bugs

Open an issue with:
- What you expected to happen
- What actually happened
- Browser and OS version
- Whether you're using a built-in microphone or an external one (for audio-related bugs)

## Feature ideas

Open an issue describing the feature and how it would improve the practice experience. Discussion before implementation helps avoid wasted effort.
