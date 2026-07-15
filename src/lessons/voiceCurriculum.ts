import { getVoiceRangeBoard } from '../theory/voiceRange';
import type { Lesson, LessonModule } from './types';
import { createCurriculum } from './curriculum';

/**
 * "Finding Your Voice" -- a beginner vocal curriculum covering breath
 * support, pitch matching, and singing simple scales and melodic phrases.
 *
 * Voice has no strings or frets, so positions use `[string, fret]` tuples
 * resolved against getVoiceRangeBoard(): `string` is always 0 (voice has one
 * "virtual string"), and `fret` is the number of semitones above the
 * practice range floor, C3. So `[0, 12]` means C4, `[0, 16]` means E4, etc.
 * See voiceRange.ts for the full range (C3-C5).
 *
 * Important grading caveat: checkpoints in this app are graded purely by
 * PITCH + TIMING picked up from the mic -- tone quality, vowel shape, breath
 * support, and resonance can't be auto-graded the same way. Those parts of
 * technique are taught as instructional content/tips; checkpoints only cover
 * the pitched, timeable part of each skill (singing the right note, in time).
 */

// Semitone offsets from C3 (fret 0), for readability in the position tuples below.
// This curriculum sits in the middle octave of the practice range (C4-C5).
const C4 = 12, D4 = 14, E4 = 16, F4 = 17, G4 = 19, A4 = 21, B4 = 23, C5 = 24;

export const MODULES: LessonModule[] = [
  {
    id: 'foundations',
    title: 'Module 1 — Breath & First Pitch',
    description: 'Steady breath support and matching a single pitch reliably.',
  },
  {
    id: 'intervals',
    title: 'Module 2 — Steps & Skips',
    description: 'Move between notes on purpose: whole steps, then skips.',
  },
  {
    id: 'scales',
    title: 'Module 3 — Singing the Scale',
    description: 'The full major scale, ascending, descending, and in one breath.',
  },
  {
    id: 'melody',
    title: 'Module 4 — Simple Melodies',
    description: 'Arpeggios and short melodic phrases that put it all together.',
  },
];

export const LESSONS: Lesson[] = [
  // ---------------- Module 1: Breath & First Pitch ----------------
  {
    id: 'v1-steady-pitch',
    moduleId: 'foundations',
    title: 'Steady Breath, Steady Pitch',
    category: 'technique',
    summary: 'Support one note with your breath instead of your throat.',
    content: [
      { type: 'paragraph', text: 'Good singing starts below the vocal folds, not at them. Take a low, relaxed breath -- let your ribs and belly expand -- then let the air flow out in a slow, steady stream as you sing. A pitch that wavers or fades is usually a breath-support problem, not a "wrong note" problem.' },
      { type: 'paragraph', text: 'Pick a comfortable note in the middle of your range (around C4 for most voices) and hold it as level and steady as you can, like a held note on a wind instrument.' },
      { type: 'tip', text: 'This app grades pitch and timing, not tone or breath. Use the checkpoint to confirm you\'re landing on the right note -- but the real goal here is a steady, unwavering sound, which is on you to self-judge.' },
    ],
    practice: [
      {
        id: 'v1-p1',
        title: 'Hold middle C',
        instructions: 'Take a low breath, then sing "ah" on C4 and hold it as steadily as you can.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, C4]],
        bpm: null,
      },
      {
        id: 'v1-p2',
        title: 'Hold and repeat',
        instructions: 'Sing C4, stop, take a fresh low breath, and sing it again.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, C4], [0, C4]],
        bpm: null,
      },
    ],
    checkpoint: {
      title: 'Sustain middle C four times',
      instructions: 'Sing C4 once per click, four times, taking a relaxed breath before each one.',
      root: 'C',
      scaleKey: 'ionian',
      positions: [[0, C4], [0, C4], [0, C4], [0, C4]],
      requiredAccuracy: 0.75,
      bpm: 60,
    },
  },
  {
    id: 'v2-pitch-matching',
    moduleId: 'foundations',
    title: 'Matching a Pitch',
    category: 'technique',
    summary: 'Train your ear to find a target note and land on it directly.',
    content: [
      { type: 'paragraph', text: 'Pitch matching is the foundation skill of singing: hearing a note and reproducing it exactly, without sliding or guessing your way there. Tap a note in the voice panel to hear a reference tone, then sing it back.' },
      { type: 'paragraph', text: 'Try to attack the note directly rather than scooping up to it from below -- aim for the center of the pitch from the very first instant of sound.' },
    ],
    practice: [
      {
        id: 'v2-p1',
        title: 'Match C4, then D4',
        instructions: 'Tap C4 in the voice panel, sing it back, then do the same for D4.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, C4], [0, D4]],
        bpm: null,
      },
      {
        id: 'v2-p2',
        title: 'Alternate C4 / D4',
        instructions: 'Sing C4, then D4, then back to C4, then D4 again -- a steady back-and-forth.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, C4], [0, D4], [0, C4], [0, D4]],
        bpm: 70,
      },
    ],
    checkpoint: {
      title: 'Alternate C4 and D4 in time',
      instructions: 'Sing this pattern in time with the click: C4, D4, C4, D4.',
      root: 'C',
      scaleKey: 'ionian',
      positions: [[0, C4], [0, D4], [0, C4], [0, D4]],
      requiredAccuracy: 0.75,
      bpm: 75,
    },
  },

  // ---------------- Module 2: Steps & Skips ----------------
  {
    id: 'v3-whole-steps',
    moduleId: 'intervals',
    title: 'Whole Steps: Do-Re-Do',
    category: 'practice',
    summary: 'The smallest common melodic move, up and back down.',
    content: [
      { type: 'paragraph', text: 'A whole step (two semitones, like C to D) is the most common melodic distance in a major scale. Sing it deliberately -- feel the small lift in pitch rather than sliding through it.' },
      { type: 'tip', text: 'If C-to-D feels shaky, hum it first with your mouth closed, then open into "ah" once the pitch feels locked in.' },
    ],
    practice: [
      {
        id: 'v3-p1',
        title: 'Do-Re-Do',
        instructions: 'Sing C4, then D4, then back to C4.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, C4], [0, D4], [0, C4]],
        bpm: 70,
      },
      {
        id: 'v3-p2',
        title: 'Do-Re-Mi-Re-Do',
        instructions: 'Extend the pattern up one more whole step and back: C4, D4, E4, D4, C4.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, C4], [0, D4], [0, E4], [0, D4], [0, C4]],
        bpm: 70,
      },
    ],
    checkpoint: {
      title: 'Sing Do-Re-Mi-Re-Do in time',
      instructions: 'Sing this five-note pattern in time with the click: C4, D4, E4, D4, C4.',
      root: 'C',
      scaleKey: 'ionian',
      positions: [[0, C4], [0, D4], [0, E4], [0, D4], [0, C4]],
      requiredAccuracy: 0.8,
      bpm: 75,
    },
  },
  {
    id: 'v4-thirds',
    moduleId: 'intervals',
    title: 'Skips: Do-Mi-Do',
    category: 'practice',
    summary: 'A bigger leap -- skipping over a note instead of stepping through it.',
    content: [
      { type: 'paragraph', text: 'A third (like C to E) skips over the note in between (D). Skips are harder to hear internally than steps, so it helps to imagine the in-between note briefly before you jump past it.' },
      { type: 'paragraph', text: 'This interval is the backbone of the major triad you\'ll use later for arpeggios, so it\'s worth getting comfortable with now.' },
    ],
    practice: [
      {
        id: 'v4-p1',
        title: 'Do-Mi-Do',
        instructions: 'Sing C4, then skip up to E4, then back down to C4.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, C4], [0, E4], [0, C4]],
        bpm: 65,
      },
      {
        id: 'v4-p2',
        title: 'Re-Fa-Re',
        instructions: 'Same skip, one whole step higher: D4, F4, D4.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, D4], [0, F4], [0, D4]],
        bpm: 65,
      },
    ],
    checkpoint: {
      title: 'Sing two skips: Do-Mi-Do, Re-Fa-Re',
      instructions: 'Sing the pattern in time: C4, E4, C4, D4, F4, D4.',
      root: 'C',
      scaleKey: 'ionian',
      positions: [[0, C4], [0, E4], [0, C4], [0, D4], [0, F4], [0, D4]],
      requiredAccuracy: 0.8,
      bpm: 70,
    },
  },

  // ---------------- Module 3: Singing the Scale ----------------
  {
    id: 'v5-scale-up',
    moduleId: 'scales',
    title: 'The Major Scale, Ascending',
    category: 'theory',
    summary: 'Do-Re-Mi-Fa-Sol-La-Ti-Do, all the way up.',
    content: [
      { type: 'paragraph', text: 'The major scale is the same whole/half-step pattern (W-W-H-W-W-W-H) every instrument uses -- singing it is ear training in its purest form, since there\'s no fret or key to guide you, only your internal sense of pitch.' },
      { type: 'paragraph', text: 'Sing slowly at first, checking each note against the live pitch meter, then gradually increase the tempo once the shape feels secure.' },
    ],
    practice: [
      {
        id: 'v5-p1',
        title: 'First half of the scale',
        instructions: 'Sing C4, D4, E4, F4, one note at a time.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, C4], [0, D4], [0, E4], [0, F4]],
        bpm: 70,
      },
      {
        id: 'v5-p2',
        title: 'Full scale, slow',
        instructions: 'Sing the full ascending scale, C4 up to C5, slowly.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, C4], [0, D4], [0, E4], [0, F4], [0, G4], [0, A4], [0, B4], [0, C5]],
        bpm: 65,
      },
    ],
    checkpoint: {
      title: 'Sing the C major scale ascending',
      instructions: 'Sing C4 up to C5, one note per click: C-D-E-F-G-A-B-C.',
      root: 'C',
      scaleKey: 'ionian',
      positions: [[0, C4], [0, D4], [0, E4], [0, F4], [0, G4], [0, A4], [0, B4], [0, C5]],
      requiredAccuracy: 0.8,
      bpm: 80,
    },
  },
  {
    id: 'v6-scale-down',
    moduleId: 'scales',
    title: 'The Major Scale, Descending',
    category: 'theory',
    summary: 'The trip back down is a different skill than the trip up.',
    content: [
      { type: 'paragraph', text: 'Descending scales tend to flatten in pitch if your breath support relaxes as you go down -- keep the same steady airflow on the way down that you used going up.' },
      { type: 'tip', text: 'It\'s common to sing descending scales slightly under pitch. If your accuracy dips here compared to the ascending scale, that\'s exactly the habit this lesson is training you out of.' },
    ],
    practice: [
      {
        id: 'v6-p1',
        title: 'Top half, descending',
        instructions: 'Sing C5, B4, A4, G4, coming down from the top.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, C5], [0, B4], [0, A4], [0, G4]],
        bpm: 70,
      },
      {
        id: 'v6-p2',
        title: 'Full scale, descending',
        instructions: 'Sing the full scale from C5 down to C4.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, C5], [0, B4], [0, A4], [0, G4], [0, F4], [0, E4], [0, D4], [0, C4]],
        bpm: 65,
      },
    ],
    checkpoint: {
      title: 'Sing the C major scale descending',
      instructions: 'Sing C5 down to C4, one note per click: C-B-A-G-F-E-D-C.',
      root: 'C',
      scaleKey: 'ionian',
      positions: [[0, C5], [0, B4], [0, A4], [0, G4], [0, F4], [0, E4], [0, D4], [0, C4]],
      requiredAccuracy: 0.8,
      bpm: 80,
    },
  },
  {
    id: 'v7-scale-round-trip',
    moduleId: 'scales',
    title: 'Up and Down in One Breath',
    category: 'practice',
    summary: 'Combine both directions and manage your breath across the whole phrase.',
    content: [
      { type: 'paragraph', text: 'Now put the two directions together into one continuous phrase. This is as much a breath-management exercise as a pitch one -- pace your air so you have enough left for the second half of the phrase.' },
      { type: 'tip', text: 'If you run out of air before the end, that\'s a sign to take a slightly deeper breath at the start, not to rush the notes.' },
    ],
    practice: [
      {
        id: 'v7-p1',
        title: 'Half round trip',
        instructions: 'Sing up from C4 to G4, then back down to C4.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, C4], [0, D4], [0, E4], [0, F4], [0, G4], [0, F4], [0, E4], [0, D4], [0, C4]],
        bpm: 80,
      },
    ],
    checkpoint: {
      title: 'Full scale up and down, one breath',
      instructions: 'Sing the complete scale up to C5 and back down to C4, in time with the click.',
      root: 'C',
      scaleKey: 'ionian',
      positions: [
        [0, C4], [0, D4], [0, E4], [0, F4], [0, G4], [0, A4], [0, B4], [0, C5],
        [0, B4], [0, A4], [0, G4], [0, F4], [0, E4], [0, D4], [0, C4],
      ],
      requiredAccuracy: 0.8,
      bpm: 85,
    },
  },

  // ---------------- Module 4: Simple Melodies ----------------
  {
    id: 'v8-arpeggio',
    moduleId: 'melody',
    title: 'Arpeggio: Do-Mi-Sol',
    category: 'practice',
    summary: 'Sing the notes of a major chord, one at a time.',
    content: [
      { type: 'paragraph', text: 'An arpeggio is a chord sung one note at a time -- here, the major triad Do-Mi-Sol (C4-E4-G4). Arpeggios train bigger, more confident leaps than the scale steps you\'ve practiced so far.' },
      { type: 'paragraph', text: 'This shape -- root, third, fifth -- is the sound of a major chord, and it\'s the melodic backbone of countless simple tunes.' },
    ],
    practice: [
      {
        id: 'v8-p1',
        title: 'Up the triad',
        instructions: 'Sing C4, E4, G4, rising through the chord.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, C4], [0, E4], [0, G4]],
        bpm: 70,
      },
      {
        id: 'v8-p2',
        title: 'Up and down the triad',
        instructions: 'Sing C4, E4, G4, then back down E4, C4.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, C4], [0, E4], [0, G4], [0, E4], [0, C4]],
        bpm: 70,
      },
    ],
    checkpoint: {
      title: 'Sing the C major arpeggio, up and down',
      instructions: 'Sing C4, E4, G4, E4, C4 in time with the click.',
      root: 'C',
      scaleKey: 'ionian',
      positions: [[0, C4], [0, E4], [0, G4], [0, E4], [0, C4]],
      requiredAccuracy: 0.8,
      bpm: 80,
    },
  },
  {
    id: 'v9-graduation-phrase',
    moduleId: 'melody',
    title: 'Graduation Phrase',
    category: 'practice',
    summary: 'A short melody combining steps, skips, and the arpeggio shape.',
    content: [
      { type: 'paragraph', text: 'This closing phrase weaves together everything from this curriculum: whole steps, a skip up to the arpeggio, and a scale-step return home -- a simple original tune, not a copy of any existing song.' },
      { type: 'list', items: ['Steps (Module 2) for the opening phrase', 'The arpeggio shape (this module) for the lift in the middle', 'Steady breath support (Module 1) to carry the whole phrase'] },
      { type: 'tip', text: 'Sing it slowly a few times before attempting the checkpoint tempo -- getting the shape right matters more than speed here.' },
    ],
    practice: [
      {
        id: 'v9-p1',
        title: 'Opening phrase',
        instructions: 'Sing the opening steps: C4, D4, E4, C4.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, C4], [0, D4], [0, E4], [0, C4]],
        bpm: 80,
      },
      {
        id: 'v9-p2',
        title: 'The lift and the return',
        instructions: 'Sing the arpeggio lift and scale-step return: E4, G4, E4, D4, C4.',
        root: 'C',
        scaleKey: 'ionian',
        positions: [[0, E4], [0, G4], [0, E4], [0, D4], [0, C4]],
        bpm: 80,
      },
    ],
    checkpoint: {
      title: 'Full graduation phrase',
      instructions: 'Sing the complete phrase in time: C4, D4, E4, C4, E4, G4, E4, D4, C4.',
      root: 'C',
      scaleKey: 'ionian',
      positions: [
        [0, C4], [0, D4], [0, E4], [0, C4],
        [0, E4], [0, G4], [0, E4], [0, D4], [0, C4],
      ],
      requiredAccuracy: 0.85,
      bpm: 85,
    },
  },
];

export const voiceCurriculum = createCurriculum({
  id: 'finding-your-voice',
  title: 'Finding Your Voice',
  description: 'Breath support, pitch matching, and singing simple scales and melodic phrases.',
  referenceBoard: getVoiceRangeBoard(),
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
} = voiceCurriculum;
