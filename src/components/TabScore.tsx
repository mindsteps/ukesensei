import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { MelodyNote } from '../theory/staff';
import { chunkMeasuresIntoLines, quantizeMelody } from '../theory/staff';
import { inferSongChords } from '../theory/harmony';
import { mapMelodyToTab } from '../theory/tab';
import type { InstrumentTuning } from '../theory/fretboard';
import type { StemmableNote, Beam as VexBeam } from 'vexflow';

interface TabScoreProps {
  notes: MelodyNote[];
  tuning: InstrumentTuning;
  title?: string;
  className?: string;
  /** Index into `notes` of the note currently playing, for a moving highlight during playback. */
  activeNoteIndex?: number;
  /** One chord label per measure (lead-sheet style, shown above the tab), or null for a measure with no assigned chord. If omitted, chords are inferred automatically from the melody's detected key. */
  chords?: Array<{ display: string } | null>;
  /** Called with the index into `notes` when a note is clicked. */
  onNoteClick?: (index: number) => void;
}

const LINE_HEIGHT = 190;
const TOP_MARGIN = 28;
const PADDING = 30;
const MEASURES_PER_LINE = 2;
const ACTIVE_NOTE_COLOR = '#2dd4bf';
/** VexFlow's default fret-number size is 9pt, which reads small on a tab staff. */
const TAB_FRET_FONT_SIZE = 13;

export function TabScore({
  notes,
  tuning,
  title,
  className = '',
  activeNoteIndex = -1,
  chords,
  onNoteClick,
}: TabScoreProps) {
  const elementId = useId().replace(/:/g, '');
  const [renderError, setRenderError] = useState<string | null>(null);
  const { bpm, measures } = useMemo(() => quantizeMelody(notes), [notes]);
  const scoreLines = useMemo(
    () => chunkMeasuresIntoLines(measures, MEASURES_PER_LINE),
    [measures],
  );
  const inferredChords = useMemo(() => inferSongChords(notes, measures), [notes, measures]);
  const chordLabels = chords ?? inferredChords;
  const tabPositions = useMemo(() => mapMelodyToTab(notes, tuning), [notes, tuning]);
  const numLines = tuning.strings.length;
  const height = useMemo(() => {
    const lines = Math.max(1, scoreLines.length);
    return lines * LINE_HEIGHT + TOP_MARGIN + PADDING * 2 + (title ? 20 : 0);
  }, [scoreLines.length, title]);

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
        const { Factory, Voice, Beam, Fraction, Formatter, StaveModifierPosition, TabStave, TabNote, GhostNote, Metrics, MetricsDefaults } = await import('vexflow');
        if (cancelled) return;

        // VexFlow's default fret-number size (9pt) reads as quite small on a
        // tab staff; bump it up for legibility. This is a global (module-level)
        // default, so only touch it if it hasn't already been enlarged.
        if (MetricsDefaults.TabNote.text.fontSize < TAB_FRET_FONT_SIZE) {
          MetricsDefaults.TabNote.text.fontSize = TAB_FRET_FONT_SIZE;
          Metrics.clear('TabNote.text');
        }

        const width = Math.max(320, container.clientWidth || 640);
        // A custom TabStave/Voice per measure isn't tracked by Factory's own
        // render queue (that only happens for staves/voices created through
        // its `vf.Stave()`/`vf.Voice()` wrapper methods), so each is
        // positioned, formatted and drawn manually below rather than going
        // through `System.addStave()` like the treble-staff score does.
        const vf = Factory.newFromElementId(elementId, width, height);
        const ctx = vf.getContext();
        const noteElements = new Map<number, StemmableNote[]>();
        const beams: VexBeam[] = [];

        scoreLines.forEach((line, lineIndex) => {
          const lineY = PADDING + (title ? 20 : 0) + TOP_MARGIN + lineIndex * LINE_HEIGHT;
          const lineWidth = width - 20;
          const measureWidth = lineWidth / line.measures.length;

          line.measures.forEach((measure, measureIndex) => {
            const x = 10 + measureIndex * measureWidth;
            const tabStave = new TabStave(x, lineY, measureWidth, { numLines }).setContext(ctx);
            if (lineIndex === 0 && measureIndex === 0) {
              tabStave.addTabGlyph();
            }

            const flatMeasureIndex = lineIndex * MEASURES_PER_LINE + measureIndex;
            const chord = chordLabels[flatMeasureIndex];
            if (chord) {
              tabStave.setStaveText(chord.display, StaveModifierPosition.ABOVE);
            }
            tabStave.draw();

            // Dotted durations affect tick math via the `dots` field (correct
            // playback timing/beaming) but skip the little dot glyph: unlike
            // StaveNote, TabNote/GhostNote have no `keys`, so Dot.buildAndAttach
            // (which iterates note.keys) can't attach a visible dot to them.
            const voiceNotes = measure.map((tok) => {
              if (tok.noteIndex === null) {
                return new GhostNote({ duration: tok.duration, dots: tok.dots });
              }
              const pos = tabPositions[tok.noteIndex];
              return pos
                ? new TabNote({ positions: [{ str: pos.string + 1, fret: pos.fret }], duration: tok.duration, dots: tok.dots })
                : new GhostNote({ duration: tok.duration, dots: tok.dots });
            });

            voiceNotes.forEach((vexNote, i) => {
              const noteIndex = measure[i]?.noteIndex;
              if (noteIndex === null || noteIndex === undefined) return;
              const list = noteElements.get(noteIndex) ?? [];
              list.push(vexNote);
              noteElements.set(noteIndex, list);
            });

            const voice = new Voice({ numBeats: 4, beatValue: 4 })
              .setMode(Voice.Mode.SOFT)
              .addTickables(voiceNotes);

            if (voiceNotes.length > 1) {
              try {
                beams.push(...Beam.generateBeams(voiceNotes, { groups: [new Fraction(1, 4)] }));
              } catch {
                // Beaming is optional
              }
            }

            new Formatter().joinVoices([voice]).format([voice], Math.max(20, measureWidth - 20));
            voice.setContext(ctx).draw(ctx, tabStave);
          });
        });

        for (const beam of beams) {
          beam.setContext(ctx).draw();
        }
        noteElementsRef.current = noteElements;

        if (onNoteClick) {
          for (const [noteIndex, vexNotes] of noteElements) {
            for (const vexNote of vexNotes) {
              const el = vexNote.getSVGElement();
              if (!el) continue;
              el.style.cursor = 'pointer';
              el.addEventListener('click', () => onNoteClick(noteIndex));
            }
          }
        }

        if (highlightedIndexRef.current >= 0) {
          for (const n of noteElements.get(highlightedIndexRef.current) ?? []) {
            n.setStyle({ fillStyle: ACTIVE_NOTE_COLOR, strokeStyle: ACTIVE_NOTE_COLOR });
            n.drawWithStyle();
          }
        }
      } catch (err) {
        if (!cancelled) {
          setRenderError(err instanceof Error ? err.message : 'Failed to render tab');
        }
      }
    })();

    return () => { cancelled = true; };
  }, [elementId, notes, height, title, scoreLines, chordLabels, tabPositions, numLines, onNoteClick]);

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
        className="w-full overflow-x-auto bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)]"
        style={{ minHeight: height }}
      />
    </div>
  );
}
