import { useRef, useEffect, useCallback } from 'react';

interface FftVisualizerProps {
  getAnalyser: () => AnalyserNode | null;
  isActive: boolean;
  height?: number;
}

const NOTE_FREQUENCIES: { note: string; freq: number }[] = [
  { note: 'C2', freq: 65.41 },
  { note: 'G2', freq: 98.0 },
  { note: 'C3', freq: 130.81 },
  { note: 'G3', freq: 196.0 },
  { note: 'C4', freq: 261.63 },
  { note: 'E4', freq: 329.63 },
  { note: 'A4', freq: 440.0 },
  { note: 'C5', freq: 523.25 },
  { note: 'E5', freq: 659.25 },
  { note: 'A5', freq: 880.0 },
  { note: 'C6', freq: 1046.5 },
];

export function FftVisualizer({ getAnalyser, isActive, height = 140 }: FftVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = getAnalyser();
    if (!canvas || !analyser) {
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufLen = analyser.frequencyBinCount;
    if (!dataRef.current || dataRef.current.length !== bufLen) {
      dataRef.current = new Uint8Array(bufLen);
    }

    analyser.getByteFrequencyData(dataRef.current);
    const data = dataRef.current;
    const sampleRate = analyser.context.sampleRate;
    const binHz = sampleRate / (analyser.fftSize);

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, w, h);

    // Logarithmic frequency axis: 60 Hz to 1200 Hz
    const minFreq = 60;
    const maxFreq = 1200;
    const logMin = Math.log2(minFreq);
    const logMax = Math.log2(maxFreq);

    const freqToX = (f: number) => {
      const logF = Math.log2(Math.max(f, minFreq));
      return ((logF - logMin) / (logMax - logMin)) * w;
    };

    const style = getComputedStyle(canvas);
    const accentColor = style.getPropertyValue('--c-accent').trim() || '#14b8a6';
    const mutedColor = style.getPropertyValue('--c-text-muted').trim() || '#666';
    const borderColor = style.getPropertyValue('--c-border').trim() || '#333';

    // Grid lines at note frequencies
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 0.5;
    ctx.font = '9px system-ui, sans-serif';
    ctx.fillStyle = mutedColor;
    ctx.textAlign = 'center';

    for (const { note, freq } of NOTE_FREQUENCIES) {
      if (freq < minFreq || freq > maxFreq) continue;
      const x = freqToX(freq);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h - 14);
      ctx.stroke();
      ctx.fillText(note, x, h - 3);
    }

    // Draw spectrum bars with logarithmic frequency mapping
    const barWidth = Math.max(1, w / 200);
    const gradient = ctx.createLinearGradient(0, h - 14, 0, 0);
    gradient.addColorStop(0, accentColor + '40');
    gradient.addColorStop(0.5, accentColor + 'b0');
    gradient.addColorStop(1, accentColor);

    ctx.fillStyle = gradient;

    for (let freq = minFreq; freq < maxFreq; freq *= 1.02) {
      const bin = Math.round(freq / binHz);
      if (bin >= bufLen) break;

      const x = freqToX(freq);
      const val = data[bin] / 255;
      const barH = val * (h - 16);

      if (barH > 0.5) {
        ctx.fillRect(x - barWidth / 2, h - 14 - barH, barWidth, barH);
      }
    }

    // Peak frequency indicator
    let peakBin = 0;
    let peakVal = 0;
    const minBin = Math.floor(minFreq / binHz);
    const maxBin = Math.min(Math.ceil(maxFreq / binHz), bufLen - 1);
    for (let i = minBin; i <= maxBin; i++) {
      if (data[i] > peakVal) {
        peakVal = data[i];
        peakBin = i;
      }
    }

    if (peakVal > 30) {
      const peakFreq = peakBin * binHz;
      const px = freqToX(peakFreq);
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, h - 14);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = accentColor;
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(peakFreq)} Hz`, px, 10);
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [getAnalyser]);

  useEffect(() => {
    if (isActive) {
      rafRef.current = requestAnimationFrame(draw);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, draw]);

  if (!isActive) return null;

  return (
    <div
      className="bg-[var(--c-surface-half)] rounded-xl border border-[var(--c-border-half)] overflow-hidden"
    >
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-xs text-[var(--c-text-muted)] font-medium">FFT Spectrum</span>
        <span className="text-xs text-[var(--c-text-muted)]">60 Hz — 1.2 kHz (log scale)</span>
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height }}
        className="block"
      />
    </div>
  );
}
