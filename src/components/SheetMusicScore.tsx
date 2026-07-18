import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { MelodyNote } from '../theory/staff';
import { chunkMeasuresIntoLines, quantizeMelody } from '../theory/staff';
import { inferSongChords } from '../theory/harmony';
import type { StemmableNote, Beam as VexBeam } from 'vexflow';

interface SheetMusicScoreProps {
  notes: MelodyNote[];
  title?: string;
  className?: string;
  /** Index into `notes` of the note currently playing, for a moving highlight during playback. */
  activeNoteIndex?: number;
  /**
   * One chord label per measure (lead-sheet style, shown above the staff), or
   * null for a measure with no assigned chord. If omitted, chords are
   * inferred automatically from the melody's detected key.
   */
  chords?: Array<{ display: string } | null>;
  /** Called with the index into `notes` when a notehead is clicked. */
  onNoteClick?: (index: number) => void;
}

const LINE_HEIGHT = 170;
const TOP_MARGIN = 28;
const PADDING = 30;
const MEASURES_PER_LINE = 2;
const ACTIVE_NOTE_COLOR = '#2dd4bf';

export function SheetMusicScore({
  notes,
  title,
  className = '',
  activeNoteIndex = -1,
  chords,
  onNoteClick,
}: SheetMusicScoreProps) {
  const elementId = useId().replace(/:/g, '');
  const [renderError, setRenderError] = useState<string | null>(null);
  // Snap the captured melody's timing onto a tempo grid before notating it,
  // so the rhythm reads cleanly instead of reflecting raw pitch-detection jitter.
  const { bpm, measures } = useMemo(() => quantizeMelody(notes), [notes]);
  const scoreLines = useMemo(
    () => chunkMeasuresIntoLines(measures, MEASURES_PER_LINE),
    [measures],
  );
  const inferredChords = useMemo(() => inferSongChords(notes, measures), [notes, measures]);
  const chordLabels = chords ?? inferredChords;
  const height = useMemo(() => {
    const lines = Math.max(1, scoreLines.length);
    return lines * LINE_HEIGHT + TOP_MARGIN + PADDING * 2 + (title ? 20 : 0);
  }, [scoreLines.length, title]);

  // Maps an original note index to every VexFlow StaveNote rendered for it
  // (a single note can span more than one token if it was decomposed into
  // dotted/tied durations, or split across a measure boundary), so playback
  // can highlight the right notehead(s) without re-rendering the whole score.
  const noteElementsRef = useRef<Map<number, StemmableNote[]>>(new Map());
  const highlightedIndexRef = useRef<number>(-1);

  useEffect(() => {
    const container = document.getElementById(elementId);
    if (!container) return;
    container.innerHTML = '';
    setRenderError(null);
    noteElementsRef.current = new Map();
    highlightedIndexRef.current = -1;

    if (notes.length === 0) return;

    let cancelled = false;

    (async () => {
      try {
        const { Factory, Voice, Beam, Fraction, StaveModifierPosition } = await import('vexflow');
        if (cancelled) return;

        const width = Math.max(320, container.clientWidth || 640);
        const vf = Factory.newFromElementId(elementId, width, height);
        const noteElements = new Map<number, StemmableNote[]>();
        const beams: VexBeam[] = [];

        scoreLines.forEach((line, lineIndex) => {
          const lineY = PADDING + (title ? 20 : 0) + TOP_MARGIN + lineIndex * LINE_HEIGHT;
          const lineWidth = width - 20;
          const measureWidth = lineWidth / line.measures.length;

          line.measures.forEach((measure, measureIndex) => {
            // Each measure gets its own System (rather than sharing one System
            // per line) because System.addStave stacks multiple staves added
            // to the *same* System vertically -- it's meant for simultaneous
            // parts (e.g. a piano grand staff), not sequential measures. A
            // System per measure, positioned side by side along the line,
            // keeps every measure on the same horizontal row.
            const system = vf.System({
              x: 10 + measureIndex * measureWidth,
              y: lineY,
              width: measureWidth,
            });

            const score = vf.EasyScore();
            const tokenStr = measure.map((m) => m.token).join(', ');
            const voiceNotes = score.notes(tokenStr, { stem: 'auto' });

            voiceNotes.forEach((vexNote, i) => {
              const noteIndex = measure[i]?.noteIndex;
              if (noteIndex === null || noteIndex === undefined) return;
              const list = noteElements.get(noteIndex) ?? [];
              list.push(vexNote);
              noteElements.set(noteIndex, list);
            });

            const voice = vf.Voice({ time: { numBeats: 4, beatValue: 4 } })
              .setMode(Voice.Mode.SOFT)
              .addTickables(voiceNotes);

            if (voiceNotes.length > 1) {
              try {
                // Beat-based groups (one quarter note each) instead of one
                // beam spanning the whole measure, so beams break at each
                // beat the way normal notation does.
                beams.push(...Beam.generateBeams(voiceNotes, { groups: [new Fraction(1, 4)] }));
              } catch {
                // Beaming is optional
              }
            }

            const stave = system.addStave({ voices: [voice] });
            if (lineIndex === 0 && measureIndex === 0) {
              stave.addClef('treble').addTimeSignature('4/4');
            }

            const flatMeasureIndex = lineIndex * MEASURES_PER_LINE + measureIndex;
            const chord = chordLabels[flatMeasureIndex];
            if (chord) {
              stave.setStaveText(chord.display, StaveModifierPosition.ABOVE);
            }
          });
        });

        vf.draw();
        // Beams are formatted/drawn manually (rather than via Factory.Beam,
        // which only supports one beam spanning *all* passed notes) so they
        // need the notes' final x/y positions from the system draw above.
        const ctx = vf.getContext();
        for (const beam of beams) {
          beam.setContext(ctx).draw();
        }
        noteElementsRef.current = noteElements;

        if (onNoteClick) {
          const svgEl = container.querySelector('svg');
          // Click on a transparent rect sized larger than the notehead itself
          // (rather than the note's own glyph) so: (1) the hit area is
          // comfortably bigger than the tiny notehead/stem paths, and (2) the
          // click never lands on the underlying SVG text/path glyphs, which
          // avoids the browser placing a blinking text-selection caret when
          // you click directly on notation glyphs.
          const HIT_PADDING_X = 10;
          const HIT_PADDING_Y = 14;
          for (const [noteIndex, vexNotes] of noteElements) {
            for (const vexNote of vexNotes) {
              const el = vexNote.getSVGElement();
              if (!el || !svgEl || !(el instanceof SVGGraphicsElement)) continue;
              const bbox = el.getBBox();
              const hitRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
              hitRect.setAttribute('x', String(bbox.x - HIT_PADDING_X));
              hitRect.setAttribute('y', String(bbox.y - HIT_PADDING_Y));
              hitRect.setAttribute('width', String(bbox.width + HIT_PADDING_X * 2));
              hitRect.setAttribute('height', String(bbox.height + HIT_PADDING_Y * 2));
              hitRect.setAttribute('fill', 'transparent');
              // VexFlow's root <svg> sets stroke="black" and pointer-events="none"
              // as drawing defaults, and both are inheritable SVG properties --
              // override them explicitly, otherwise this rect would inherit a
              // visible black outline and (since a fully transparent fill isn't
              // "painted" under the default pointer-events value) wouldn't
              // register clicks at all.
              hitRect.setAttribute('stroke', 'none');
              hitRect.setAttribute('pointer-events', 'all');
              hitRect.style.cursor = 'pointer';
              hitRect.style.userSelect = 'none';
              hitRect.addEventListener('mousedown', (e) => e.preventDefault());
              hitRect.addEventListener('click', () => onNoteClick(noteIndex));
              svgEl.appendChild(hitRect);
            }
          }
        }

        // Re-apply any highlight that was already active before this (re-)render.
        if (highlightedIndexRef.current >= 0) {
          for (const n of noteElements.get(highlightedIndexRef.current) ?? []) {
            n.setStyle({ fillStyle: ACTIVE_NOTE_COLOR, strokeStyle: ACTIVE_NOTE_COLOR });
            n.drawWithStyle();
          }
        }
      } catch (err) {
        if (!cancelled) {
          setRenderError(err instanceof Error ? err.message : 'Failed to render score');
        }
      }
    })();

    return () => { cancelled = true; };
  }, [elementId, notes, height, title, scoreLines, chordLabels, onNoteClick]);

  // Toggle just the previous/next active note's style rather than
  // re-rendering the whole score, so this stays cheap enough to run on
  // every playback animation frame.
  useEffect(() => {
    if (highlightedIndexRef.current === activeNoteIndex) return;

    for (const n of noteElementsRef.current.get(highlightedIndexRef.current) ?? []) {
      n.setStyle({});
      n.drawWithStyle();
    }
    for (const n of noteElementsRef.current.get(activeNoteIndex) ?? []) {
      n.setStyle({ fillStyle: ACTIVE_NOTE_COLOR, strokeStyle: ACTIVE_NOTE_COLOR });
      n.drawWithStyle();
    }
    highlightedIndexRef.current = activeNoteIndex;
  }, [activeNoteIndex]);

  if (notes.length === 0) {
    return (
      <div className={`text-sm text-[var(--c-text-muted)] text-center py-6 ${className}`}>
        No notes captured yet. Play a melody while recording.
      </div>
    );
  }

  return (
    <div className={className}>
      {title && (
        <h3 className="text-sm font-semibold text-[var(--c-text-muted)] mb-2">
          {title} <span className="font-normal text-[var(--c-text-muted)]/70">(~{bpm} BPM, quantized)</span>
        </h3>
      )}
      {renderError && (
        <p className="text-xs text-red-400 mb-2">{renderError}</p>
      )}
      <div
        id={elementId}
        className="w-full overflow-x-auto bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)] select-none"
        style={{ minHeight: height }}
      />
    </div>
  );
}
