/**
 * Lightweight timeseries logger for diagnosing audio pipeline issues (e.g.
 * the FFT/level meter appearing to fade in and out, which usually means
 * something upstream — AudioContext suspension, a muted mic track, dropped
 * worklet messages, or stalled render-frame timing — rather than the
 * visualizer itself.
 *
 * Disabled by default (near-zero overhead). Enable at runtime with either:
 *   - URL query param:      ?audioDebug=1
 *   - devtools console:     window.__audioDebug.enable()
 *   - persists via localStorage until `.disable()` is called.
 *
 * Once enabled, reproduce the issue, then in devtools run:
 *   window.__audioDebug.summary()   // per-channel stats + biggest gaps
 *   window.__audioDebug.dump()      // raw {channel: [{t, v}, ...]} for export
 */

interface Sample {
  /** ms since page load (performance.now()), so timestamps are comparable across channels. */
  t: number;
  v: number;
}

const STORAGE_KEY = 'ukesensei:audioDebug';
const MAX_SAMPLES_PER_CHANNEL = 4000;

const channels = new Map<string, Sample[]>();
const events: { t: number; label: string; detail?: string }[] = [];

function readEnabledFlag(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const param = new URLSearchParams(window.location.search).get('audioDebug');
    if (param === '1' || param === 'true') return true;
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

let enabled = readEnabledFlag();

function setEnabled(value: boolean) {
  enabled = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch {
    // ignore (private browsing / storage disabled)
  }
  console.info(`[audioDebug] logging ${value ? 'enabled' : 'disabled'}`);
}

/** Records one timestamped sample for `channel`. No-ops when logging is disabled. */
export function logMetric(channel: string, value: number) {
  if (!enabled) return;
  let arr = channels.get(channel);
  if (!arr) {
    arr = [];
    channels.set(channel, arr);
  }
  arr.push({ t: performance.now(), v: value });
  if (arr.length > MAX_SAMPLES_PER_CHANNEL) arr.splice(0, arr.length - MAX_SAMPLES_PER_CHANNEL);
}

/** Records a discrete event (state change, mute/unmute, etc.), always logged to console immediately. */
export function logEvent(label: string, detail?: string) {
  if (!enabled) return;
  events.push({ t: performance.now(), label, detail });
  console.warn(`[audioDebug] ${label}${detail ? ` — ${detail}` : ''} @ ${performance.now().toFixed(0)}ms`);
}

function gapsFor(samples: Sample[]): { maxGapMs: number; at: number } {
  let maxGapMs = 0;
  let at = -1;
  for (let i = 1; i < samples.length; i++) {
    const gap = samples[i].t - samples[i - 1].t;
    if (gap > maxGapMs) {
      maxGapMs = gap;
      at = samples[i].t;
    }
  }
  return { maxGapMs, at };
}

function summary() {
  if (channels.size === 0 && events.length === 0) {
    console.info('[audioDebug] no samples recorded yet — enable logging and reproduce the issue first.');
    return;
  }
  const rows: Record<string, unknown>[] = [];
  for (const [channel, samples] of channels) {
    if (samples.length === 0) continue;
    const values = samples.map((s) => s.v);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const { maxGapMs, at } = gapsFor(samples);
    const spanMs = samples[samples.length - 1].t - samples[0].t;
    rows.push({
      channel,
      samples: samples.length,
      spanMs: Math.round(spanMs),
      min: Number(min.toFixed(3)),
      max: Number(max.toFixed(3)),
      mean: Number(mean.toFixed(3)),
      maxGapMs: Number(maxGapMs.toFixed(1)),
      maxGapAtMs: Math.round(at),
    });
  }
  console.table(rows);
  if (events.length > 0) {
    console.table(events.map((e) => ({ atMs: Math.round(e.t), label: e.label, detail: e.detail ?? '' })));
  }
}

function dump() {
  const out: Record<string, Sample[]> = {};
  for (const [channel, samples] of channels) out[channel] = samples.slice();
  return { channels: out, events: events.slice() };
}

function clear() {
  channels.clear();
  events.length = 0;
  console.info('[audioDebug] cleared');
}

function exportJson() {
  const blob = new Blob([JSON.stringify(dump(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audio-debug-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

declare global {
  interface Window {
    __audioDebug?: {
      enable: () => void;
      disable: () => void;
      summary: () => void;
      dump: () => ReturnType<typeof dump>;
      clear: () => void;
      export: () => void;
      isEnabled: () => boolean;
    };
  }
}

if (typeof window !== 'undefined') {
  window.__audioDebug = {
    enable: () => setEnabled(true),
    disable: () => setEnabled(false),
    summary,
    dump,
    clear,
    export: exportJson,
    isEnabled: () => enabled,
  };
  if (enabled) {
    console.info(
      '[audioDebug] logging is ON — reproduce the fading/buffering issue, then run window.__audioDebug.summary() or .export()',
    );
  }

  // Tab backgrounding is a common cause of rAF throttling / audio glitches
  // that read exactly like "fading in and out", so always track it once the
  // module is loaded (cheap; only logs on actual visibility transitions).
  document.addEventListener('visibilitychange', () => {
    logEvent('visibilitychange', document.visibilityState);
  });
}

export function isAudioDebugEnabled(): boolean {
  return enabled;
}
