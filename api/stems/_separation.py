"""Core stem-separation logic shared by the Vercel function (separate.py)
and the local CLI (scripts/separate_local.py).

Runs Meta's htdemucs_6s (Hybrid Transformer Demucs, 6-stem variant) via
onnxruntime on CPU. The ONNX export comes from Hugging Face
(StemSplitio/htdemucs-6s-onnx, MIT, parity-verified against the PyTorch
original); see docs/research/stem-separation/ for the papers behind it.
"""
from __future__ import annotations

import os
import urllib.request
from pathlib import Path
from typing import Callable

import numpy as np
import onnxruntime as ort
import soundfile as sf
import soxr

SOURCES = ("drums", "bass", "other", "vocals", "guitar", "piano")
SAMPLE_RATE = 44100
SEGMENT_SAMPLES = int(7.8 * SAMPLE_RATE)  # 343,980 — fixed model input length

MODEL_URL = os.environ.get(
    "STEMS_MODEL_URL",
    "https://huggingface.co/StemSplitio/htdemucs-6s-onnx/resolve/main/htdemucs_6s_fp16weights.onnx",
)
MODEL_PATH = Path(os.environ.get("STEMS_MODEL_PATH", "/tmp/htdemucs_6s_fp16weights.onnx"))

# Longest track we accept, to stay inside serverless time/memory budgets.
MAX_DURATION_SEC = float(os.environ.get("STEMS_MAX_DURATION_SEC", "360"))


class TrackTooLongError(Exception):
    pass


def ensure_model() -> Path:
    """Download the ONNX model to /tmp on cold start; reuse on warm invocations."""
    if MODEL_PATH.exists() and MODEL_PATH.stat().st_size > 1_000_000:
        return MODEL_PATH
    tmp = MODEL_PATH.with_suffix(".part")
    urllib.request.urlretrieve(MODEL_URL, tmp)
    tmp.rename(MODEL_PATH)
    return MODEL_PATH


def load_audio(path: str | Path) -> np.ndarray:
    """Decode an audio file (wav/mp3/flac/ogg) to (2, samples) float32 @ 44.1 kHz."""
    audio, sr = sf.read(str(path), dtype="float32", always_2d=True)
    duration = audio.shape[0] / sr
    if duration > MAX_DURATION_SEC:
        raise TrackTooLongError(
            f"Track is {duration:.0f}s; the maximum is {MAX_DURATION_SEC:.0f}s."
        )
    if sr != SAMPLE_RATE:
        audio = soxr.resample(audio, sr, SAMPLE_RATE)
    mix = audio.T  # (channels, samples)
    if mix.shape[0] == 1:
        mix = np.repeat(mix, 2, axis=0)
    elif mix.shape[0] > 2:
        mix = mix[:2]
    return np.ascontiguousarray(mix, dtype=np.float32)


def _fade_window(n: int, overlap: int) -> np.ndarray:
    w = np.ones(n, dtype=np.float32)
    fade = np.linspace(0, 1, overlap, dtype=np.float32)
    w[:overlap] = fade
    w[-overlap:] = fade[::-1]
    return w


def separate(
    mix: np.ndarray,
    on_progress: Callable[[float], None] | None = None,
) -> dict[str, np.ndarray]:
    """Chunked overlap-add inference. mix: (2, samples) float32 @ 44.1 kHz.

    Returns {stem_name: (2, samples) float32}. Stems are accumulated in
    float16 to roughly halve peak memory — the rounding error (~-60 dB) is
    far below the noise floor of the mp3 encoding the stems end up in.
    """
    model_path = ensure_model()
    opts = ort.SessionOptions()
    # Serverless functions are memory-constrained (OOM-killed, not throttled),
    # and ORT's graph optimizer constant-folds the fp16-stored weights into
    # fp32 copies, spiking peak RSS to ~6 GB during session load. Disabling
    # optimizations keeps the peak at ~1.4 GB and costs only ~7% per chunk.
    opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_DISABLE_ALL
    opts.enable_cpu_mem_arena = False
    # Avoid thread oversubscription when the host reports more cores than the
    # cgroup CPU quota actually allows.
    opts.intra_op_num_threads = min(4, len(os.sched_getaffinity(0)))
    session = ort.InferenceSession(
        str(model_path), sess_options=opts, providers=["CPUExecutionProvider"]
    )

    total = mix.shape[1]
    overlap = SEGMENT_SAMPLES // 4
    stride = SEGMENT_SAMPLES - overlap
    n_chunks = max(1, (total + stride - 1) // stride)
    window = _fade_window(SEGMENT_SAMPLES, overlap)

    out = np.zeros((len(SOURCES), 2, total), dtype=np.float16)
    weight = np.zeros(total, dtype=np.float32)

    for i in range(n_chunks):
        start = i * stride
        end = min(start + SEGMENT_SAMPLES, total)
        chunk = mix[:, start:end]
        if chunk.shape[1] < SEGMENT_SAMPLES:
            chunk = np.pad(chunk, ((0, 0), (0, SEGMENT_SAMPLES - chunk.shape[1])))
        x = chunk[np.newaxis, ...].astype(np.float32, copy=False)
        stems = session.run(["stems"], {"mix": x})[0][0]  # (6, 2, SEGMENT_SAMPLES)
        w = window[: end - start]
        out[:, :, start:end] += (stems[:, :, : end - start] * w).astype(np.float16)
        weight[start:end] += w
        if on_progress:
            on_progress((i + 1) / n_chunks)

    norm = np.maximum(weight, 1e-8)
    # Keep the returned stems in float16 too (~87 MB/stem saved); they are
    # converted one at a time when encoding.
    return {
        name: (out[i].astype(np.float32) / norm).astype(np.float16)
        for i, name in enumerate(SOURCES)
    }


def write_stem_mp3(stem: np.ndarray, path: str | Path) -> None:
    """Encode a (2, samples) float stem to mp3."""
    sf.write(str(path), stem.T.astype(np.float32), SAMPLE_RATE, format="MP3")
