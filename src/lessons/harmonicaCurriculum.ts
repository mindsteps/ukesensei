import { getHarmonicaBoard } from '../theory/harmonicaLayout';
import type { Lesson, LessonModule } from './types';
import { createCurriculum } from './curriculum';

/**
 * "First Licks" -- a beginner curriculum for a standard 10-hole diatonic
 * (Richter-tuned) harmonica in the key of C, covering blow/draw breath
 * control, moving cleanly between holes, and playing the classic
 * holes-4-to-7 major scale.
 *
 * Harmonica has no strings or frets, so positions use `[string, fret]`
 * tuples resolved against getHarmonicaBoard(): `string` is always 0
 * (harmonica has one "virtual string"), and `fret` is the index into every
 * blow/draw note on the instrument, ordered low to high. So `[0, 6]` means
 * hole 4 blow (C5), `[0, 7]` means hole 4 draw (D5), etc. See
 * harmonicaLayout.ts for the full hole-by-hole chart.
 *
 * Important grading caveat: checkpoints in this app are graded purely by
 * PITCH + TIMING picked up from the mic -- breath control, single-hole
 * isolation (playing exactly one hole cleanly, with no bleed from its
 * neighbors), and bending (an advanced technique for reaching pitches
 * outside the fixed blow/draw chart) can't be auto-graded the same way.
 * Those parts of technique are taught as instructional content/tips;
 * checkpoints only cover the pitched, timeable part of each skill (blowing
 * or drawing the right hole, in time). Bending is mentioned only as an
 * advanced technique to explore later -- no lesson here requires it.
 */

// Board indices (into getHarmonicaBoard(), low to high) for readability below.
// This curriculum only uses holes 4-7 -- the classic beginner range that
// contains a complete major scale (see harmonicaLayout.ts for the full chart).
const H4B = 6, H4D = 7, H5B = 8, H5D = 9, H6B = 10, H6D = 11, H7D = 12, H7B = 13;

export const MODULES: LessonModule[] = [
  {
    id: 'foundations',
    title: 'Module 1 — Breath & Your First Holes',
    description: 'Clean single-hole blow and draw notes, and switching between them.',
  },
  {
    id: 'technique',
    title: 'Module 2 — Moving Between Holes',
    description: 'Traveling cleanly from hole to hole without losing single-note isolation.',
  },
  {
    id: 'scales',
    title: 'Module 3 — The Holes 4-7 Major Scale',
    description: 'The classic beginner major scale, ascending, descending, and round trip.',
  },
  {
    id: 'melody',
    title: 'Module 4 — Simple Patterns',
    description: 'The blow chord triad and a short original phrase that ties it together.',
  },
];

export const LESSONS: Lesson[] = [
  // ---------------- Module 1: Breath & Your First Holes ----------------
  {
    id: 'h1-first-notes',
    moduleId: 'foundations',
    title: 'Blow and Draw on Hole 4',
    category: 'technique',
    summary: 'Play a clean blow note, then a clean draw note, on the same hole.',
    content: [
      { type: 'paragraph', text: 'A harmonica has no strings or keys -- each hole simply plays one note when you blow (exhale) into it, and a different note when you draw (inhale). Hole 4, right in the middle of the harp, is the usual starting point: blow gives C, draw gives D.' },
      { type: 'paragraph', text: 'Purse your lips into a small, relaxed "oo" shape and aim for just one hole. Use gentle, steady breath -- forcing air makes the reed sound harsh and pushes the pitch out of tune, it doesn\'t make the note louder in a useful way.' },
      { type: 'tip', text: 'This app grades pitch and timing, not breath control or single-hole isolation. Use the checkpoint to confirm you\'re landing on the right note -- but a clean tone with no bleed from neighboring holes is on you to self-judge by ear.' },
    ],
    practice: [
      {
        id: 'h1-p1',
        title: 'Hold hole 4 blow',
        instructions: 'Blow gently and steadily into hole 4 and hold the note.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, H4B]],
        bpm: null,
      },
      {
        id: 'h1-p2',
        title: 'Hold hole 4 draw',
        instructions: 'Draw (inhale) on hole 4 and hold the note.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, H4D]],
        bpm: null,
      },
    ],
    checkpoint: {
      title: 'Alternate blow and draw on hole 4',
      instructions: 'Play this pattern in time with the click: hole 4 blow, hole 4 draw, blow, draw.',
      root: 'C',
      scaleKey: 'ionian',
      positions: [[0, H4B], [0, H4D], [0, H4B], [0, H4D]],
      requiredAccuracy: 0.75,
      bpm: 65,
    },
  },
  {
    id: 'h2-single-hole',
    moduleId: 'foundations',
    title: 'Single-Hole Isolation',
    category: 'technique',
    summary: 'Move to a neighboring hole without widening your mouth to cover two holes.',
    content: [
      { type: 'paragraph', text: 'The biggest early hurdle on harmonica is playing exactly one hole at a time. Moving your whole head slightly, rather than just stretching your lips, tends to keep the embouchure cleaner as you shift between holes 4 and 5.' },
      { type: 'paragraph', text: 'Hole 5 blow is E, a third above hole 4\'s C -- the same interval you may recognize from other instruments in this app.' },
    ],
    practice: [
      {
        id: 'h2-p1',
        title: 'Hole 4 to hole 5, blow only',
        instructions: 'Blow hole 4, then shift to blow hole 5, then back.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, H4B], [0, H5B], [0, H4B]],
        bpm: null,
      },
      {
        id: 'h2-p2',
        title: 'Add the draw notes',
        instructions: 'Blow 4, draw 4, blow 5, draw 5 -- one hole at a time.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, H4B], [0, H4D], [0, H5B], [0, H5D]],
        bpm: 70,
      },
    ],
    checkpoint: {
      title: 'Hole 4 and 5, blow and draw, in time',
      instructions: 'Play this pattern in time with the click: hole 4 blow, hole 4 draw, hole 5 blow, hole 5 draw.',
      root: 'C',
      scaleKey: 'ionian',
      positions: [[0, H4B], [0, H4D], [0, H5B], [0, H5D]],
      requiredAccuracy: 0.75,
      bpm: 75,
    },
  },

  // ---------------- Module 2: Moving Between Holes ----------------
  {
    id: 'h3-whole-steps',
    moduleId: 'technique',
    title: 'Stepping Through Holes 4-6',
    category: 'practice',
    summary: 'Walk up through three holes worth of notes, one breath change at a time.',
    content: [
      { type: 'paragraph', text: 'Hole 4 blow (C), hole 4 draw (D), and hole 5 blow (E) are three notes in a row up the scale, but they come from switching both hole *and* breath direction each time -- good practice for coordinating both at once.' },
      { type: 'tip', text: 'If a note comes out flat or buzzy, you\'re probably forcing air. Back off the breath pressure until the reed rings cleanly.' },
    ],
    practice: [
      {
        id: 'h3-p1',
        title: 'Three notes up',
        instructions: 'Play hole 4 blow, hole 4 draw, hole 5 blow, in order.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, H4B], [0, H4D], [0, H5B]],
        bpm: 70,
      },
      {
        id: 'h3-p2',
        title: 'Up and back',
        instructions: 'Play hole 4 blow, hole 4 draw, hole 5 blow, then back down: hole 4 draw, hole 4 blow.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, H4B], [0, H4D], [0, H5B], [0, H4D], [0, H4B]],
        bpm: 70,
      },
    ],
    checkpoint: {
      title: 'Step up through holes 4-5 and back',
      instructions: 'Play in time with the click: hole 4 blow, hole 4 draw, hole 5 blow, hole 4 draw, hole 4 blow.',
      root: 'C',
      scaleKey: 'ionian',
      positions: [[0, H4B], [0, H4D], [0, H5B], [0, H4D], [0, H4B]],
      requiredAccuracy: 0.8,
      bpm: 75,
    },
  },
  {
    id: 'h4-skips',
    moduleId: 'technique',
    title: 'Skipping a Hole',
    category: 'practice',
    summary: 'Jump from hole 4 blow straight to hole 5 draw, skipping over a note.',
    content: [
      { type: 'paragraph', text: 'Hole 4 blow (C) up to hole 5 draw (F) skips over both hole 4 draw (D) and hole 5 blow (E) -- a bigger leap that asks your ear to hear the target note before you commit your breath to it.' },
      { type: 'paragraph', text: 'This kind of leap is common in real harmonica melodies, where the tune often jumps around rather than climbing the scale one note at a time.' },
    ],
    practice: [
      {
        id: 'h4-p1',
        title: 'Hole 4 blow to hole 5 draw',
        instructions: 'Play hole 4 blow, then hole 5 draw, then back to hole 4 blow.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, H4B], [0, H5D], [0, H4B]],
        bpm: 65,
      },
      {
        id: 'h4-p2',
        title: 'One step higher',
        instructions: 'Same shape, one hole higher: hole 5 blow to hole 6 draw and back.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, H5B], [0, H6D], [0, H5B]],
        bpm: 65,
      },
    ],
    checkpoint: {
      title: 'Two skips in a row',
      instructions: 'Play in time: hole 4 blow, hole 5 draw, hole 4 blow, hole 5 blow, hole 6 draw, hole 5 blow.',
      root: 'C',
      scaleKey: 'ionian',
      positions: [[0, H4B], [0, H5D], [0, H4B], [0, H5B], [0, H6D], [0, H5B]],
      requiredAccuracy: 0.8,
      bpm: 70,
    },
  },

  // ---------------- Module 3: The Holes 4-7 Major Scale ----------------
  {
    id: 'h5-scale-up',
    moduleId: 'scales',
    title: 'The Major Scale, Ascending',
    category: 'theory',
    summary: 'The famous "holes 4 to 7" major scale, one breath change per note.',
    content: [
      { type: 'paragraph', text: 'Holes 4 through 7 hide a complete major scale: blow 4 (C), draw 4 (D), blow 5 (E), draw 5 (F), blow 6 (G), draw 6 (A), draw 7 (B), blow 7 (C) -- eight notes, C up to C, using only four holes. This is the first full scale almost every harmonica player learns.' },
      { type: 'tip', text: 'Notice the pattern flips at hole 7: draw comes *before* blow in pitch there, the one place on the whole harmonica where that happens. Trust the notes, not the breath-direction pattern from holes 4-6.' },
    ],
    practice: [
      {
        id: 'h5-p1',
        title: 'First half of the scale',
        instructions: 'Play hole 4 blow, hole 4 draw, hole 5 blow, hole 5 draw, one note at a time.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, H4B], [0, H4D], [0, H5B], [0, H5D]],
        bpm: 70,
      },
      {
        id: 'h5-p2',
        title: 'Full scale, slow',
        instructions: 'Play the full ascending scale from hole 4 blow up to hole 7 blow, slowly.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, H4B], [0, H4D], [0, H5B], [0, H5D], [0, H6B], [0, H6D], [0, H7D], [0, H7B]],
        bpm: 65,
      },
    ],
    checkpoint: {
      title: 'Play the holes 4-7 major scale ascending',
      instructions: 'Play hole 4 blow up to hole 7 blow, one note per click.',
      root: 'C',
      scaleKey: 'ionian',
      positions: [[0, H4B], [0, H4D], [0, H5B], [0, H5D], [0, H6B], [0, H6D], [0, H7D], [0, H7B]],
      requiredAccuracy: 0.8,
      bpm: 80,
    },
  },
  {
    id: 'h6-scale-down',
    moduleId: 'scales',
    title: 'The Major Scale, Descending',
    category: 'theory',
    summary: 'The trip back down from hole 7 blow to hole 4 blow.',
    content: [
      { type: 'paragraph', text: 'Coming back down means hitting the hole-7 reversal in the opposite order: blow 7, then draw 7, before the breath pattern goes back to normal (draw-then-blow) for holes 6 down to 4.' },
      { type: 'tip', text: 'If your accuracy dips here compared to the ascending scale, that\'s almost always the hole-7 reversal tripping you up -- slow down and isolate that one transition.' },
    ],
    practice: [
      {
        id: 'h6-p1',
        title: 'Top half, descending',
        instructions: 'Play hole 7 blow, hole 7 draw, hole 6 blow, hole 6 draw, coming down from the top.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, H7B], [0, H7D], [0, H6B], [0, H6D]],
        bpm: 70,
      },
      {
        id: 'h6-p2',
        title: 'Full scale, descending',
        instructions: 'Play the full scale from hole 7 blow down to hole 4 blow.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, H7B], [0, H7D], [0, H6B], [0, H6D], [0, H5B], [0, H5D], [0, H4B]],
        bpm: 65,
      },
    ],
    checkpoint: {
      title: 'Play the holes 4-7 major scale descending',
      instructions: 'Play hole 7 blow down to hole 4 blow, one note per click.',
      root: 'C',
      scaleKey: 'ionian',
      positions: [[0, H7B], [0, H7D], [0, H6B], [0, H6D], [0, H5B], [0, H5D], [0, H4B]],
      requiredAccuracy: 0.8,
      bpm: 80,
    },
  },
  {
    id: 'h7-scale-round-trip',
    moduleId: 'scales',
    title: 'Up and Down Without Stopping',
    category: 'practice',
    summary: 'Combine both directions into one continuous run across holes 4-7.',
    content: [
      { type: 'paragraph', text: 'Now put the two directions together into one continuous run. This is as much a breath-planning exercise as a pitch one -- you\'re changing direction on almost every single note.' },
      { type: 'tip', text: 'If you feel breathless partway through, that\'s a sign you\'re using more air than the reeds need -- ease off the pressure rather than rushing the notes.' },
    ],
    practice: [
      {
        id: 'h7-p1',
        title: 'Half round trip',
        instructions: 'Play up from hole 4 blow to hole 6 draw, then back down to hole 4 blow.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, H4B], [0, H4D], [0, H5B], [0, H5D], [0, H6B], [0, H6D], [0, H6B], [0, H5D], [0, H5B], [0, H4D], [0, H4B]],
        bpm: 80,
      },
    ],
    checkpoint: {
      title: 'Full scale up and down',
      instructions: 'Play the complete scale up to hole 7 blow and back down to hole 4 blow, in time with the click.',
      root: 'C',
      scaleKey: 'ionian',
      positions: [
        [0, H4B], [0, H4D], [0, H5B], [0, H5D], [0, H6B], [0, H6D], [0, H7D], [0, H7B],
        [0, H7D], [0, H6D], [0, H6B], [0, H5D], [0, H5B], [0, H4D], [0, H4B],
      ],
      requiredAccuracy: 0.8,
      bpm: 85,
    },
  },

  // ---------------- Module 4: Simple Patterns ----------------
  {
    id: 'h8-blow-chord',
    moduleId: 'melody',
    title: 'The Blow Chord Triad',
    category: 'practice',
    summary: 'Play the three blow notes that make up a C major chord, one at a time.',
    content: [
      { type: 'paragraph', text: 'Holes 4, 5, and 6 all blow together make the "blow chord" -- a full C major chord, since their single notes (C, E, G) are exactly the C major triad. Playing them one at a time here is melodic; players use the same three holes together for rhythm chugging.' },
      { type: 'paragraph', text: 'This root-third-fifth shape is the same major-triad sound you\'ve likely met on other instruments in this app.' },
    ],
    practice: [
      {
        id: 'h8-p1',
        title: 'Up the triad',
        instructions: 'Play hole 4 blow, hole 5 blow, hole 6 blow, rising through the chord.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, H4B], [0, H5B], [0, H6B]],
        bpm: 70,
      },
      {
        id: 'h8-p2',
        title: 'Up and down the triad',
        instructions: 'Play hole 4 blow, hole 5 blow, hole 6 blow, then back down hole 5 blow, hole 4 blow.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, H4B], [0, H5B], [0, H6B], [0, H5B], [0, H4B]],
        bpm: 70,
      },
    ],
    checkpoint: {
      title: 'Blow chord triad, up and down',
      instructions: 'Play hole 4, 5, 6, 5, 4, all blow, in time with the click.',
      root: 'C',
      scaleKey: 'ionian',
      positions: [[0, H4B], [0, H5B], [0, H6B], [0, H5B], [0, H4B]],
      requiredAccuracy: 0.8,
      bpm: 80,
    },
  },
  {
    id: 'h9-graduation-phrase',
    moduleId: 'melody',
    title: 'Graduation Phrase',
    category: 'practice',
    summary: 'A short melody combining steps, skips, and the blow chord shape.',
    content: [
      { type: 'paragraph', text: 'This closing phrase weaves together everything from this curriculum: a step up from hole 4, a skip up to the blow chord, and a scale-step way back home -- a simple original tune, not a copy of any existing song.' },
      { type: 'list', items: ['Steps between holes (Module 2) for the opening phrase', 'The blow chord shape (this module) for the lift in the middle', 'Clean single-hole isolation (Module 1) to keep the whole phrase clear'] },
      { type: 'tip', text: 'Play it slowly a few times before attempting the checkpoint tempo -- getting the hole/breath sequence right matters more than speed here.' },
    ],
    practice: [
      {
        id: 'h9-p1',
        title: 'Opening phrase',
        instructions: 'Play the opening steps: hole 4 blow, hole 4 draw, hole 5 blow, hole 4 blow.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, H4B], [0, H4D], [0, H5B], [0, H4B]],
        bpm: 80,
      },
      {
        id: 'h9-p2',
        title: 'The lift and the return',
        instructions: 'Play the blow-chord lift and scale-step return: hole 5 blow, hole 6 blow, hole 5 blow, hole 4 draw, hole 4 blow.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, H5B], [0, H6B], [0, H5B], [0, H4D], [0, H4B]],
        bpm: 80,
      },
    ],
    checkpoint: {
      title: 'Full graduation phrase',
      instructions: 'Play the complete phrase in time: hole 4 blow, hole 4 draw, hole 5 blow, hole 4 blow, hole 5 blow, hole 6 blow, hole 5 blow, hole 4 draw, hole 4 blow.',
      root: 'C',
      scaleKey: 'ionian',
      positions: [
        [0, H4B], [0, H4D], [0, H5B], [0, H4B],
        [0, H5B], [0, H6B], [0, H5B], [0, H4D], [0, H4B],
      ],
      requiredAccuracy: 0.85,
      bpm: 85,
    },
  },
];

export const harmonicaCurriculum = createCurriculum({
  id: 'first-licks',
  title: 'First Licks',
  description: 'Blow/draw breath control, moving between holes, and playing the classic holes-4-to-7 major scale.',
  referenceBoard: getHarmonicaBoard(),
  modules: MODULES,
  lessons: LESSONS,
});

export const {
  resolvePositions,
  getLessonById,
  getLessonIndex,
  getNextLessonId,
  getLessonsForModule,
  isLessonUnlocked,
} = harmonicaCurriculum;
