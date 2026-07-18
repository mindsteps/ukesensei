"""Run the stem-separation pipeline locally, without deploying to Vercel.

Usage:
    python -m venv .venv && .venv/bin/pip install -r requirements.txt
    .venv/bin/python scripts/separate_local.py song.mp3 ./stems-out/

Exercises the exact same code as the serverless function
(api/stems/_separation.py): model auto-download, decode/resample, chunked
overlap-add inference, mp3 encoding.
"""
from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "api" / "stems"))
from _separation import SOURCES, load_audio, separate, write_stem_mp3  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="Audio file (wav/mp3/flac/ogg)")
    parser.add_argument("output_dir", type=Path, help="Directory for the 6 stem mp3s")
    args = parser.parse_args()

    print(f"Decoding {args.input} ...")
    mix = load_audio(args.input)
    print(f"  {mix.shape[1] / 44100:.1f}s @ 44.1 kHz stereo")

    start = time.time()
    stems = separate(mix, on_progress=lambda f: print(f"  {f * 100:3.0f}%"))
    print(f"Separated in {time.time() - start:.1f}s")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    for name in SOURCES:
        path = args.output_dir / f"{name}.mp3"
        write_stem_mp3(stems[name], path)
        print(f"wrote {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
